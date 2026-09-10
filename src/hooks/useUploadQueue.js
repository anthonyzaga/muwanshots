import { useState, useCallback, useRef, useEffect } from 'react';

export const MAX_BATCH_SIZE = 10;
export const MAX_CONCURRENT_UPLOADS = 3;

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/avif'];
const MAX_SIZE = 10 * 1024 * 1024;

function createItem(file) {
  return {
    id: crypto.randomUUID(),
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    status: 'queued', // queued | uploading | success | failed | cancelled
    progress: 0,
    error: null,
    photoId: null,
    imageUrl: null,
    previewUrl: URL.createObjectURL(file),
  };
}

function validateFile(file) {
  if (!ALLOWED_TYPES.includes(file.type)) return `Unsupported type: ${file.type}`;
  if (file.size > MAX_SIZE) return `Exceeds 10 MB (${(file.size / 1024 / 1024).toFixed(1)} MB)`;
  if (file.size === 0) return 'File is empty';
  return null;
}

function uploadWithProgress(file, categoryId, onProgress, signal) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const form = new FormData();
    form.append('file', file);
    if (categoryId) form.append('category_id', categoryId);
    form.append('alt_text', file.name);

    xhr.open('POST', '/api/photos/upload', true);
    xhr.withCredentials = true;
    // Don't set Content-Type, let browser set multipart boundary

    if (signal) {
      signal.addEventListener('abort', () => xhr.abort());
    }

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) {
        const pct = Math.round((e.loaded / e.total) * 100);
        onProgress(pct, e.loaded, e.total);
      }
    };

    xhr.onload = () => {
      const text = xhr.responseText;
      let data;
      try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(data);
      } else {
        const err = new Error(data?.error || `Upload failed: ${xhr.status}`);
        err.status = xhr.status;
        err.data = data;
        reject(err);
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.ontimeout = () => reject(new Error('Upload timeout'));
    xhr.onabort = () => reject(new Error('Cancelled'));

    xhr.send(form);
  });
}

export function useUploadQueue({ categoryId, onBatchComplete } = {}) {
  const [queue, setQueue] = useState([]);
  const activeCountRef = useRef(0);
  const queueRef = useRef([]);
  const controllersRef = useRef(new Map());

  // Keep refs in sync
  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  const updateItem = useCallback((id, patch) => {
    // Keep ref synchronously in sync to avoid stale reads in processQueue
    queueRef.current = queueRef.current.map(item => item.id === id ? { ...item, ...patch } : item);
    setQueue(prev => prev.map(item => item.id === id ? { ...item, ...patch } : item));
  }, []);

  const processQueueRef = useRef(null);

  const processQueue = useCallback(async () => {
    // Start next queued items up to concurrency limit
    while (activeCountRef.current < MAX_CONCURRENT_UPLOADS) {
      const next = queueRef.current.find(i => i.status === 'queued');
      if (!next) break;
      activeCountRef.current++;
      // Synchronous ref update inside updateItem ensures next find() sees updated status
      updateItem(next.id, { status: 'uploading', progress: 0, error: null });
      const controller = new AbortController();
      controllersRef.current.set(next.id, controller);

      const currentCategoryId = typeof categoryId === 'function' ? categoryId() : categoryId;

      uploadWithProgress(
        next.file,
        currentCategoryId,
        (pct) => updateItem(next.id, { progress: pct }),
        controller.signal
      ).then(data => {
        const photo = data?.photo;
        updateItem(next.id, {
          status: 'success',
          progress: 100,
          photoId: photo?.id || null,
          imageUrl: photo?.image_url || null,
        });
      }).catch(err => {
        if (err.message === 'Cancelled') {
          updateItem(next.id, { status: 'cancelled', error: 'Cancelled' });
        } else {
          updateItem(next.id, { status: 'failed', error: err.message });
        }
        if (err.status === 401) {
          const failedPatch = { status: 'failed', error: 'Authentication expired — please log in again' };
          queueRef.current = queueRef.current.map(it => it.status === 'queued' ? { ...it, ...failedPatch } : it);
          setQueue(prev => prev.map(it => it.status === 'queued' ? { ...it, ...failedPatch } : it));
        }
      }).finally(() => {
        activeCountRef.current--;
        controllersRef.current.delete(next.id);
        // Defer next batch processing and completion check to allow synchronous ref updates to settle
        setTimeout(() => {
          if (processQueueRef.current) processQueueRef.current();
          // Re-evaluate batch completion after state has settled (use ref which is now sync-updated)
          const remaining = queueRef.current.filter(i => i.status === 'queued' || i.status === 'uploading').length;
          const successCount = queueRef.current.filter(i => i.status === 'success').length;
          if (remaining === 0 && successCount > 0 && onBatchComplete) {
            onBatchComplete();
          }
        }, 0);
      });
    }
  }, [categoryId, onBatchComplete, updateItem]);

  // Keep ref in sync for self-reference
  useEffect(() => {
    processQueueRef.current = processQueue;
  }, [processQueue]);

  const addFiles = useCallback((fileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return { added: 0, error: null };

    if (files.length > MAX_BATCH_SIZE) {
      return { added: 0, error: `You can upload up to ${MAX_BATCH_SIZE} images at a time. You selected ${files.length}.` };
    }

    // Validate each file
    const validFiles = [];
    const invalid = [];
    for (const file of files) {
      const err = validateFile(file);
      if (err) {
        invalid.push({ name: file.name, error: err });
      } else {
        validFiles.push(file);
      }
    }

    if (invalid.length > 0) {
      // If any invalid, don't add any, show error for each
      const msg = invalid.map(i => `❌ ${i.name}: ${i.error}`).join('\n');
      return { added: 0, error: msg, invalid };
    }

    if (validFiles.length + queueRef.current.length > MAX_BATCH_SIZE) {
      return { added: 0, error: `Batch limit is ${MAX_BATCH_SIZE}. You already have ${queueRef.current.length} in queue.` };
    }

    const newItems = validFiles.map(f => createItem(f));
    // Synchronously update ref so processQueue sees items even before React commits
    queueRef.current = [...queueRef.current, ...newItems];
    setQueue(prev => [...prev, ...newItems]);
    // Defer processing to next tick to allow state to update and ensure ref is ready
    setTimeout(() => processQueue(), 0);
    return { added: newItems.length, error: null };
  }, [processQueue]);

  const retry = useCallback((id) => {
    queueRef.current = queueRef.current.map(i => i.id === id ? { ...i, status: 'queued', progress: 0, error: null } : i);
    setQueue(prev => prev.map(i => i.id === id ? { ...i, status: 'queued', progress: 0, error: null } : i));
    setTimeout(() => processQueue(), 0);
  }, [processQueue]);

  const remove = useCallback((id) => {
    // Handle uploading via abort; catch will mark cancelled and sync ref there
    const queuedItem = queueRef.current.find(i => i.id === id);
    if (queuedItem?.status === 'uploading') {
      const ctrl = controllersRef.current.get(id);
      if (ctrl) ctrl.abort();
      return;
    }
    if (queuedItem) {
      try { URL.revokeObjectURL(queuedItem.previewUrl); } catch (_e) { void _e; }
    }
    queueRef.current = queueRef.current.filter(i => i.id !== id);
    setQueue(prev => {
      const item = prev.find(i => i.id === id);
      if (item?.status === 'uploading') return prev;
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const clearCompleted = useCallback(() => {
    const completedItems = queueRef.current.filter(i => ['success','failed','cancelled'].includes(i.status));
    completedItems.forEach(i => { try { URL.revokeObjectURL(i.previewUrl); } catch (_e) { void _e; } });
    queueRef.current = queueRef.current.filter(i => i.status === 'queued' || i.status === 'uploading');
    setQueue(prev => {
      const toKeep = prev.filter(i => i.status === 'queued' || i.status === 'uploading');
      return toKeep;
    });
  }, []);

  const clearAll = useCallback(() => {
    for (const [, ctrl] of controllersRef.current.entries()) {
      ctrl.abort();
    }
    queueRef.current.forEach(i => { try { URL.revokeObjectURL(i.previewUrl); } catch (_e) { void _e; } });
    queueRef.current = [];
    setQueue(prev => {
      prev.forEach(i => { try { URL.revokeObjectURL(i.previewUrl); } catch (_e) { void _e; } });
      return [];
    });
    activeCountRef.current = 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const controllers = controllersRef.current;
    return () => {
      queueRef.current.forEach(i => { try { URL.revokeObjectURL(i.previewUrl); } catch (_e) { void _e; } });
      for (const ctrl of controllers.values()) ctrl.abort();
    };
  }, []);

  const total = queue.length;
  const completed = queue.filter(i => i.status === 'success').length;
  const failed = queue.filter(i => i.status === 'failed').length;
  const uploading = queue.filter(i => i.status === 'uploading').length;
  const queued = queue.filter(i => i.status === 'queued').length;

  // Overall progress: bytes or completed files fallback
  const overallProgress = total === 0 ? 0 : Math.round((completed / total) * 100);
  const hasCompleted = queue.some(i => ['success','failed','cancelled'].includes(i.status));
  const isIdle = total === 0 || (queued === 0 && uploading === 0);

  return {
    queue,
    addFiles,
    retry,
    remove,
    clearCompleted,
    clearAll,
    total,
    completed,
    failed,
    uploading,
    queued,
    overallProgress,
    hasCompleted,
    isIdle,
  };
}
