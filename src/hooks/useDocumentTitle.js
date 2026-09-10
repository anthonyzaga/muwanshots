import { useEffect } from 'react';
export function useDocumentTitle(title, description) {
  useEffect(() => {
    if (title) document.title = title;
    if (description) {
      let m = document.querySelector('meta[name="description"]');
      if (m) m.setAttribute('content', description);
    }
  }, [title, description]);
}
