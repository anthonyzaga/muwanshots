import { useEffect, useState, useCallback } from 'react';
import { Search, Upload, Trash2, Star, Eye, EyeOff, X, Edit2, ChevronLeft, ChevronRight, Filter, Check, Clock, XCircle, RotateCcw, Image as ImageIcon } from 'lucide-react';
import { api } from '../../lib/api';
import { useUploadQueue, MAX_BATCH_SIZE, MAX_CONCURRENT_UPLOADS } from '../../hooks/useUploadQueue';

const PAGE_SIZE = 20;

export default function Photos() {
  const [photos, setPhotos] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPublished, setFilterPublished] = useState('all');
  const [filterFeatured, setFilterFeatured] = useState('all');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(new Set());
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const offset = page * PAGE_SIZE;

  useEffect(() => {
    api.getCategories({ all: true }).then(r => setCategories(r.categories || [])).catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.getPhotos({
        search: search || undefined,
        category: filterCategory || undefined,
        featured: filterFeatured === 'featured' ? true : filterFeatured === 'not-featured' ? undefined : undefined,
        all: filterPublished === 'all' || filterPublished === 'unpublished' ? true : undefined,
        limit: PAGE_SIZE,
        offset,
      });
      let filtered = res.photos || [];
      if (filterPublished === 'published') filtered = filtered.filter(p => p.is_published);
      if (filterPublished === 'unpublished') filtered = filtered.filter(p => !p.is_published);
      if (filterFeatured === 'featured') filtered = filtered.filter(p => p.is_featured);
      if (filterFeatured === 'not-featured') filtered = filtered.filter(p => !p.is_featured);
      setPhotos(filtered);
      setTotal(res.total || filtered.length);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterCategory, filterPublished, filterFeatured, offset]);

  useEffect(() => { load(); }, [load]);

  // Multi-upload queue
  const { queue, addFiles, retry, remove, clearCompleted, total: batchTotal, completed, failed, uploading, queued, overallProgress, hasCompleted } = useUploadQueue({
    categoryId: () => {
      if (!filterCategory) return null;
      const cat = categories.find(c => c.slug === filterCategory);
      return cat ? cat.id : null;
    },
    onBatchComplete: () => {
      // Refresh list once batch finishes
      load();
    },
  });

  const handleFilesSelected = (fileList) => {
    setError('');
    const result = addFiles(fileList);
    if (result.error) {
      setError(result.error);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files) {
      handleFilesSelected(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files) {
      handleFilesSelected(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(0);
  };

  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const clearSelection = () => setSelected(new Set());

  const handleBulk = async (action) => {
    if (selected.size === 0) return;
    if (action === 'delete' && !confirm(`Delete ${selected.size} photo(s)? This will also delete from R2.`)) return;
    try {
      await api.request(`/photos/bulk`, { method: 'POST', body: { ids: Array.from(selected), action } });
      clearSelection();
      await load();
    } catch (e) {
      setError(e.message);
    }
  };

  const handleTogglePublish = async (photo) => {
    try { await api.updatePhoto(photo.id, { is_published: !photo.is_published }); await load(); } catch (e) { setError(e.message); }
  };
  const handleToggleFeatured = async (photo) => {
    try { await api.updatePhoto(photo.id, { is_featured: !photo.is_featured }); await load(); } catch (e) { setError(e.message); }
  };
  const handleDelete = async (photo) => {
    if (!confirm(`Delete "${photo.title || photo.r2_key}"? This will delete from R2 and cannot be undone.`)) return;
    try { await api.deletePhoto(photo.id); await load(); } catch (e) { setError(e.message); }
  };
  const handleEditSave = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const data = {
      title: form.get('title'),
      description: form.get('description'),
      alt_text: form.get('alt_text'),
      category_id: form.get('category_id') || null,
      is_published: form.get('is_published') === 'on',
      is_featured: form.get('is_featured') === 'on',
      sort_order: parseInt(form.get('sort_order') || '0', 10),
    };
    try { await api.updatePhoto(editing.id, data); setEditing(null); await load(); } catch (err) { setError(err.message); }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success': return <Check size={12} className="text-green-600" aria-hidden />;
      case 'failed': return <XCircle size={12} className="text-red-600" aria-hidden />;
      case 'uploading': return <Clock size={12} className="text-amber-600 animate-pulse" aria-hidden />;
      case 'queued': return <Clock size={12} className="text-[var(--text-muted)]" aria-hidden />;
      default: return null;
    }
  };

  return (
    <div className="space-y-6 overflow-x-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-semibold truncate">Photos</h1>
          <p className="text-sm text-[var(--text-muted)] truncate">{total} photos • Page {page + 1} of {totalPages || 1} • Up to {MAX_BATCH_SIZE} per batch</p>
        </div>
      </div>

      {/* Upload Manager */}
      <div
        className={`rounded-2xl border-2 border-dashed bg-[var(--surface)] p-4 sm:p-6 space-y-4 transition-colors ${dragOver ? 'border-[var(--accent)] bg-[var(--accent)]/5' : 'border-[var(--border)]'}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        aria-label="Upload area"
      >
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div>
            <h2 className="font-semibold flex items-center gap-2"><Upload size={16} aria-hidden /> Upload Photos</h2>
            <p className="text-xs text-[var(--text-muted)] mt-1">Select up to {MAX_BATCH_SIZE} images • JPEG, PNG, WebP, AVIF • 10 MB each • {MAX_CONCURRENT_UPLOADS} concurrent</p>
          </div>
          <label className="inline-flex items-center justify-center gap-2 rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-semibold cursor-pointer hover:opacity-90 shrink-0 focus-within:ring-2 focus-within:ring-[var(--accent)]">
            <Upload size={16} aria-hidden /> Choose Images
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif" onChange={handleInputChange} className="hidden" aria-label="Choose images to upload" />
          </label>
        </div>

        <p className="text-xs text-[var(--text-muted)]">Drag & drop images here or use the picker. Category: <span className="font-medium">{filterCategory ? categories.find(c=>c.slug===filterCategory)?.name || filterCategory : 'Uncategorized (or select filter)'}</span> will be applied to all in batch.</p>

        {error && <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3 whitespace-pre-wrap">{error}</div>}

        {queue.length > 0 && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="font-medium" aria-live="polite">{completed} / {batchTotal} complete • {uploading} uploading • {queued} waiting {failed > 0 && `• ${failed} failed`}</span>
              <div className="flex gap-2">
                <button onClick={clearCompleted} disabled={!hasCompleted} className="rounded-full border border-[var(--border)] px-4 py-1.5 text-xs disabled:opacity-30 hover:bg-[var(--bg-soft)]">Clear completed</button>
              </div>
            </div>

            {/* Overall progress */}
            <div className="w-full h-2 rounded-full bg-[var(--bg-soft)] border border-[var(--border)] overflow-hidden" role="progressbar" aria-valuenow={overallProgress} aria-valuemin={0} aria-valuemax={100} aria-label="Overall upload progress">
              <div className="h-full bg-[var(--accent)] transition-all duration-300" style={{ width: `${overallProgress}%` }} />
            </div>
            <p className="text-xs text-[var(--text-muted)] text-right" aria-live="polite">{overallProgress}% • {completed} of {batchTotal} uploaded</p>

            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
              {queue.map(item => (
                <div key={item.id} className="flex items-center gap-3 p-3 rounded-xl border bg-[var(--bg)] border-[var(--border)]">
                  <img src={item.previewUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-[var(--border)]" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate pr-2" title={item.name}>{item.name}</div>
                    <div className="text-xs text-[var(--text-muted)]">{(item.size/1024).toFixed(0)} KB • {item.type.split('/')[1]?.toUpperCase()}</div>
                    {item.status === 'uploading' && (
                      <div className="mt-1.5 w-full h-1.5 rounded-full bg-[var(--bg-soft)] border border-[var(--border)] overflow-hidden">
                        <div className="h-full bg-[var(--accent)] transition-all" style={{ width: `${item.progress}%` }} />
                      </div>
                    )}
                    {item.status === 'failed' && item.error && <div className="text-xs text-red-600 truncate mt-1" role="alert">{item.error}</div>}
                    {item.status === 'success' && <div className="text-xs text-green-600 mt-1">Uploaded • pending optimization</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px] font-medium border ${item.status === 'success' ? 'bg-green-50 border-green-200 text-green-700' : item.status === 'failed' ? 'bg-red-50 border-red-200 text-red-600' : item.status === 'uploading' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-[var(--bg-soft)] border-[var(--border)] text-[var(--text-muted)]'}`}>
                      {getStatusIcon(item.status)} {item.status === 'queued' ? 'Waiting' : item.status === 'uploading' ? `${item.progress}%` : item.status === 'success' ? 'Done' : item.status === 'failed' ? 'Failed' : item.status}
                    </span>
                    <div className="flex gap-1">
                      {item.status === 'failed' && <button onClick={() => retry(item.id)} className="rounded-full bg-amber-500 text-white px-3 py-1 text-[11px] flex items-center gap-1 hover:bg-amber-600"><RotateCcw size={10} aria-hidden /> Retry</button>}
                      {(item.status === 'queued' || item.status === 'failed' || item.status === 'success') && (
                        <button onClick={() => remove(item.id)} className="rounded-full border border-[var(--border)] bg-white px-2 py-1 text-[11px] hover:bg-red-50 hover:text-red-600 hover:border-red-200" aria-label={`Remove ${item.name}`}>
                          <X size={12} aria-hidden />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-xs text-[var(--text-muted)] text-center">Max {MAX_CONCURRENT_UPLOADS} simultaneous • {MAX_BATCH_SIZE} per batch • Each file validated and uploaded via <code className="px-1 py-0.5 rounded bg-[var(--bg-soft)] border border-[var(--border)] text-[10px]">POST /api/photos/upload</code></p>
          </div>
        )}
      </div>

      {error && !queue.length && <div role="alert" className="rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 text-sm px-4 py-3 whitespace-pre-wrap">{error}</div>}

      {/* Filters */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 space-y-3">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1 min-w-0">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" aria-hidden />
            <input value={searchInput} onChange={e=>setSearchInput(e.target.value)} placeholder="Search title, description, alt text" aria-label="Search photos" className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border)] bg-[var(--bg)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
          </div>
          <button type="submit" className="rounded-xl bg-[var(--text-primary)] text-[var(--bg)] px-6 py-2.5 text-sm font-medium shrink-0">Search</button>
          {(search || filterCategory || filterPublished !== 'all' || filterFeatured !== 'all') && (
            <button type="button" onClick={()=>{setSearch(''); setSearchInput(''); setFilterCategory(''); setFilterPublished('all'); setFilterFeatured('all'); setPage(0);}} className="rounded-xl border border-[var(--border)] px-6 py-2.5 text-sm shrink-0">Clear</button>
          )}
        </form>
        <div className="flex flex-wrap gap-2 items-center">
          <Filter size={14} className="text-[var(--text-muted)]" aria-hidden />
          <select value={filterCategory} onChange={e=>{setFilterCategory(e.target.value); setPage(0);}} aria-label="Filter by category" className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-1.5 text-xs max-w-[160px] truncate">
            <option value="">All categories</option>
            {categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}
          </select>
          <select value={filterPublished} onChange={e=>{setFilterPublished(e.target.value); setPage(0);}} aria-label="Filter by published" className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-1.5 text-xs">
            <option value="all">All status</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
          <select value={filterFeatured} onChange={e=>{setFilterFeatured(e.target.value); setPage(0);}} aria-label="Filter by featured" className="rounded-full border border-[var(--border)] bg-[var(--bg)] px-4 py-1.5 text-xs">
            <option value="all">All featured</option>
            <option value="featured">Featured only</option>
            <option value="not-featured">Not featured</option>
          </select>
        </div>
      </div>

      {/* Bulk actions */}
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2 items-center rounded-xl bg-[var(--accent)]/10 border border-[var(--accent)]/20 px-4 py-3">
          <span className="text-sm font-medium">{selected.size} selected</span>
          <button onClick={()=>handleBulk('publish')} className="rounded-full bg-white border border-[var(--border)] px-4 py-1.5 text-xs font-medium">Publish</button>
          <button onClick={()=>handleBulk('unpublish')} className="rounded-full bg-white border border-[var(--border)] px-4 py-1.5 text-xs">Unpublish</button>
          <button onClick={()=>handleBulk('feature')} className="rounded-full bg-white border border-[var(--border)] px-4 py-1.5 text-xs">Feature</button>
          <button onClick={()=>handleBulk('unfeature')} className="rounded-full bg-white border border-[var(--border)] px-4 py-1.5 text-xs">Unfeature</button>
          <button onClick={()=>handleBulk('delete')} className="rounded-full bg-red-600 text-white px-4 py-1.5 text-xs">Delete</button>
          <button onClick={clearSelection} className="ml-auto rounded-full p-1 hover:bg-black/5" aria-label="Clear selection"><X size={16} aria-hidden /></button>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/3] rounded-2xl shimmer" />)}
        </div>
      ) : photos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface)] p-8 sm:p-12 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-[var(--bg-soft)] border border-[var(--border)] flex items-center justify-center"><ImageIcon size={20} className="text-[var(--text-muted)]" aria-hidden /></div>
          <p className="font-medium mt-3">No photos yet.</p>
          <p className="text-sm text-[var(--text-muted)] mt-1">Upload your first photograph to start building your portfolio.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {photos.map(photo => (
            <div key={photo.id} className={`group relative rounded-2xl border overflow-hidden bg-[var(--surface)] ${selected.has(photo.id) ? 'border-[var(--accent)] ring-2 ring-[var(--accent)]/20' : 'border-[var(--border)] hover:border-[var(--border-strong)]'}`}>
              <div className="absolute top-2 left-2 z-10 flex gap-1">
                <input type="checkbox" checked={selected.has(photo.id)} onChange={()=>toggleSelect(photo.id)} aria-label={`Select ${photo.title || 'photo'}`} className="w-5 h-5 rounded border-[var(--border)]" />
                {photo.is_featured ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 text-white px-2 py-1 text-[10px] font-semibold"><Star size={10} aria-hidden /> Featured</span> : null}
              </div>
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                <button onClick={()=>handleTogglePublish(photo)} aria-label={photo.is_published ? 'Unpublish' : 'Publish'} className={`w-8 h-8 rounded-full flex items-center justify-center backdrop-blur ${photo.is_published ? 'bg-green-600 text-white' : 'bg-black/50 text-white'}`} title={photo.is_published ? 'Published' : 'Unpublished'}>
                  {photo.is_published ? <Eye size={14} aria-hidden /> : <EyeOff size={14} aria-hidden />}
                </button>
              </div>
              <img src={photo.image_url} alt={photo.alt_text || photo.title || ''} loading="lazy" decoding="async" width={photo.width || 800} height={photo.height || 600} className="w-full aspect-[4/3] object-cover cursor-pointer" onClick={()=>setPreview(photo)} />
              <div className="p-3">
                <div className="text-sm font-medium truncate" title={photo.title}>{photo.title || 'Untitled'}</div>
                <div className="text-xs text-[var(--text-muted)] truncate">{photo.category_name || 'Uncategorized'} • {new Date(photo.created_at).toLocaleDateString()}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[10px] flex-wrap">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 font-medium border ${photo.processing_status === 'ready' ? 'bg-green-50 border-green-200 text-green-700' : photo.processing_status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' : photo.processing_status === 'failed' ? 'bg-red-50 border-red-200 text-red-600' : 'bg-[var(--bg-soft)] border-[var(--border)] text-[var(--text-muted)]'}`}>{photo.processing_status || 'ready'}</span>
                  {photo.width && photo.height && <span className="text-[var(--text-muted)]">{photo.width}×{photo.height}</span>}
                  {photo.file_size && <span className="text-[var(--text-muted)]">{(photo.file_size/1024).toFixed(0)}KB</span>}
                  {photo.variants && Object.keys(photo.variants).length > 1 && <span className="text-[var(--text-muted)]">{Object.keys(photo.variants).length} variants</span>}
                </div>
                <div className="mt-2 flex gap-1">
                  <button onClick={()=>handleToggleFeatured(photo)} className={`flex-1 rounded-full border px-3 py-1.5 text-xs ${photo.is_featured ? 'bg-amber-500 text-white border-amber-500' : 'bg-[var(--bg)] border-[var(--border)]'}`}>{photo.is_featured ? 'Featured' : 'Feature'}</button>
                  <button onClick={()=>setEditing(photo)} className="flex-1 rounded-full border border-[var(--border)] bg-[var(--bg)] px-3 py-1.5 text-xs flex items-center justify-center gap-1"><Edit2 size={12} aria-hidden /> Edit</button>
                </div>
                <button onClick={()=>handleDelete(photo)} className="mt-2 w-full rounded-full bg-red-50 border border-red-200 text-red-600 px-3 py-1.5 text-xs flex items-center justify-center gap-1 hover:bg-red-100"><Trash2 size={12} aria-hidden /> Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <button disabled={page===0} onClick={()=>setPage(p=>Math.max(0,p-1))} aria-label="Previous page" className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30"><ChevronLeft size={16} aria-hidden /></button>
          <span className="text-sm px-3">Page {page+1} of {totalPages}</span>
          <button disabled={page+1>=totalPages} onClick={()=>setPage(p=>p+1)} aria-label="Next page" className="w-9 h-9 rounded-full border border-[var(--border)] flex items-center justify-center disabled:opacity-30"><ChevronRight size={16} aria-hidden /></button>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>setEditing(null)} role="dialog" aria-modal="true" aria-label="Edit photo">
          <form onSubmit={handleEditSave} onClick={e=>e.stopPropagation()} className="w-full max-w-lg rounded-2xl bg-[var(--surface)] border border-[var(--border)] p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-xl">Edit Photo</h2>
              <button type="button" onClick={()=>setEditing(null)} aria-label="Close" className="w-8 h-8 rounded-full border border-[var(--border)] flex items-center justify-center"><X size={16} aria-hidden /></button>
            </div>
            <img src={editing.image_url} alt="" className="w-full h-48 object-cover rounded-xl border border-[var(--border)]" />
            <div className="space-y-2">
              <label htmlFor="edit-title" className="block text-sm font-medium">Title</label>
              <input id="edit-title" name="title" defaultValue={editing.title || ''} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-desc" className="block text-sm font-medium">Description</label>
              <textarea id="edit-desc" name="description" defaultValue={editing.description || ''} rows={3} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-alt" className="block text-sm font-medium">Alt text</label>
              <input id="edit-alt" name="alt_text" defaultValue={editing.alt_text || ''} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
            </div>
            <div className="space-y-2">
              <label htmlFor="edit-category" className="block text-sm font-medium">Category</label>
              <select id="edit-category" name="category_id" defaultValue={editing.category_id || ''} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]">
                <option value="">Uncategorized</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="edit-sort" className="block text-sm font-medium">Sort order</label>
                <input id="edit-sort" name="sort_order" type="number" defaultValue={editing.sort_order || 0} className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--accent)]" />
              </div>
              <div className="space-y-2 pt-0 sm:pt-6">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_published" defaultChecked={!!editing.is_published} className="rounded" /> Published</label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="is_featured" defaultChecked={!!editing.is_featured} className="rounded" /> Featured</label>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={()=>setEditing(null)} className="flex-1 rounded-full border border-[var(--border)] py-2.5 text-sm">Cancel</button>
              <button type="submit" className="flex-1 rounded-full bg-[var(--text-primary)] text-[var(--bg)] py-2.5 text-sm font-semibold">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur flex items-center justify-center p-4" onClick={()=>setPreview(null)} role="dialog" aria-modal="true" aria-label="Preview photo">
          <div onClick={e=>e.stopPropagation()} className="w-full max-w-2xl rounded-2xl bg-[var(--surface)] overflow-hidden border border-[var(--border)] max-h-[90vh] overflow-y-auto">
            <img src={preview.image_url} alt={preview.alt_text || ''} className="w-full max-h-[60vh] object-contain bg-black" />
            <div className="p-6 space-y-3">
              <h3 className="font-serif text-xl truncate">{preview.title || 'Untitled'}</h3>
              <p className="text-sm text-[var(--text-muted)]">{preview.category_name || 'Uncategorized'} • {preview.is_published ? 'Published' : 'Unpublished'} • {preview.is_featured ? 'Featured' : 'Not featured'} • {new Date(preview.created_at).toLocaleString()}</p>
              {preview.description && <p className="text-sm break-words">{preview.description}</p>}
              {preview.alt_text && <p className="text-xs text-[var(--text-muted)] break-words">Alt: {preview.alt_text}</p>}
              <div className="rounded-xl bg-[var(--bg-soft)] border border-[var(--border)] p-3 space-y-1 text-xs">
                <div className="flex flex-wrap gap-2">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-1 font-medium border ${preview.processing_status === 'ready' ? 'bg-green-50 border-green-200 text-green-700' : preview.processing_status === 'pending' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-[var(--surface)] border-[var(--border)]'}`}>Status: {preview.processing_status || 'ready'}</span>
                  {preview.width && <span className="inline-flex items-center rounded-full bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1">{preview.width} × {preview.height}</span>}
                  {preview.file_size && <span className="inline-flex items-center rounded-full bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1">{(preview.file_size/1024).toFixed(1)} KB</span>}
                  {preview.variants && <span className="inline-flex items-center rounded-full bg-[var(--surface)] border border-[var(--border)] px-2.5 py-1">{Object.keys(preview.variants).length} variants</span>}
                </div>
                <div className="text-[var(--text-muted)] break-all">Original: {preview.r2_key || preview.image_url}</div>
                {preview.variants && <div className="flex flex-wrap gap-1">{Object.entries(preview.variants).map(([k, url]) => <span key={k} className="inline-flex items-center rounded-full bg-white border border-[var(--border)] px-2 py-1 text-[10px] truncate max-w-[140px]">{k}: {String(url).split('/').pop()}</span>)}</div>}
                {preview.processing_error && <p className="text-red-600 break-words">Error: {preview.processing_error}</p>}
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={()=>{setPreview(null); setEditing(preview);}} className="rounded-full bg-[var(--text-primary)] text-[var(--bg)] px-5 py-2 text-sm">Edit</button>
                <button onClick={()=>setPreview(null)} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm">Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
