import { useEffect } from 'react';

export function useSeo({ title, description, canonical, ogImage, ogType = 'website', jsonLd }) {
  useEffect(() => {
    if (title) document.title = title;
    const setMeta = (selector, content, attr='name') => {
      let el = document.querySelector(selector);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, selector.replace(`meta[${attr}="`, '').replace('"]',''));
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };
    if (description) {
      setMeta('meta[name="description"]', description);
      setMeta('meta[property="og:description"]', description, 'property');
      setMeta('meta[property="twitter:description"]', description, 'property');
    }
    if (title) {
      setMeta('meta[property="og:title"]', title, 'property');
      setMeta('meta[property="twitter:title"]', title, 'property');
    }
    if (ogImage) {
      setMeta('meta[property="og:image"]', new URL(ogImage, window.location.origin).href, 'property');
      setMeta('meta[property="twitter:image"]', new URL(ogImage, window.location.origin).href, 'property');
      setMeta('meta[property="twitter:card"]', 'summary_large_image', 'property');
    }
    if (ogType) setMeta('meta[property="og:type"]', ogType, 'property');
    // canonical
    let link = document.querySelector('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.setAttribute('rel', 'canonical');
      document.head.appendChild(link);
    }
    link.setAttribute('href', canonical || window.location.href.split('?')[0]);
    // JSON-LD
    let script = document.getElementById('seo-jsonld');
    if (jsonLd) {
      if (!script) {
        script = document.createElement('script');
        script.id = 'seo-jsonld';
        script.type = 'application/ld+json';
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(jsonLd);
    } else if (script) {
      script.remove();
    }
  }, [title, description, canonical, ogImage, ogType, jsonLd]);
}
