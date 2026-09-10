import { useCallback, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useLightboxUrl(images) {
  const [searchParams, setSearchParams] = useSearchParams();
  const photoId = searchParams.get('photo');
  const currentIndex = photoId ? images.findIndex(i => i.id === photoId) : -1;
  const isOpen = currentIndex !== -1 && currentIndex < images.length;
  const currentImage = isOpen ? images[currentIndex] : null;

  // If URL contains a photo id that doesn't exist in current gallery (stale after category change), clean it
  useEffect(() => {
    if (photoId && currentIndex === -1) {
      const next = new URLSearchParams(searchParams);
      next.delete('photo');
      setSearchParams(next, { replace: true });
    }
  }, [photoId, currentIndex, searchParams, setSearchParams]);

  const open = useCallback((id) => {
    const next = new URLSearchParams(searchParams);
    next.set('photo', id);
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  const close = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('photo');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const navigate = useCallback((dir) => {
    const nextIndex = currentIndex + dir;
    if (nextIndex < 0 || nextIndex >= images.length) return;
    const nextId = images[nextIndex].id;
    const next = new URLSearchParams(searchParams);
    next.set('photo', nextId);
    setSearchParams(next, { replace: false });
  }, [currentIndex, images, searchParams, setSearchParams]);

  return { photoId, currentIndex, isOpen, currentImage, open, close, navigate };
}
