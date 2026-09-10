// Frontend API helper — uses fetch with credentials (httpOnly cookies)
const API_BASE = '';

async function request(path, { method = 'GET', body, headers = {}, ...opts } = {}) {
  const isFormData = body instanceof FormData;
  const res = await fetch(`${API_BASE}/api${path}`, {
    method,
    credentials: 'include',
    headers: {
      ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
      ...headers,
    },
    body: isFormData ? body : body ? JSON.stringify(body) : undefined,
    ...opts,
  });

  const text = await res.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    const err = new Error(data?.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.data = data;
    // Global session expiry handling: if 401 on admin route, redirect to login
    if (res.status === 401 && typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && !path.includes('/auth/')) {
      // Avoid redirect loop if already on login
      if (window.location.pathname !== '/admin/login') {
        window.dispatchEvent(new CustomEvent('auth:unauthorized'));
      }
    }
    throw err;
  }
  return data;
}

// expose for bulk actions
request.bulk = request;

export const api = {
  request,
  // Auth
  login: (email, password) => request('/auth/login', { method: 'POST', body: { email, password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),

  // Categories
  getCategories: (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.all) params.set('all', 'true');
    const q = params.toString() ? `?${params}` : '';
    return request(`/categories${q}`);
  },
  getCategory: (id) => request(`/categories/${id}`),
  createCategory: (data) => request('/categories', { method: 'POST', body: data }),
  updateCategory: (id, data) => request(`/categories/${id}`, { method: 'PUT', body: data }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Photos
  getPhotos: (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.category) params.set('category', opts.category);
    if (opts.featured) params.set('featured', 'true');
    if (opts.album) params.set('album', opts.album);
    if (opts.search) params.set('search', opts.search);
    if (opts.all) params.set('all', 'true');
    if (opts.limit) params.set('limit', String(opts.limit));
    if (opts.offset) params.set('offset', String(opts.offset));
    const q = params.toString() ? `?${params}` : '';
    return request(`/photos${q}`);
  },
  getPhoto: (id) => request(`/photos/${id}`),
  createPhoto: (data) => request('/photos', { method: 'POST', body: data }),
  updatePhoto: (id, data) => request(`/photos/${id}`, { method: 'PUT', body: data }),
  deletePhoto: (id) => request(`/photos/${id}`, { method: 'DELETE' }),
  uploadPhoto: (formData) => request('/photos/upload', { method: 'POST', body: formData }),

  // Albums
  getAlbums: (opts = {}) => {
    const params = new URLSearchParams();
    if (opts.all) params.set('all', 'true');
    const q = params.toString() ? `?${params}` : '';
    return request(`/albums${q}`);
  },
  getAlbum: (id) => request(`/albums/${id}`),
  createAlbum: (data) => request('/albums', { method: 'POST', body: data }),
  updateAlbum: (id, data) => request(`/albums/${id}`, { method: 'PUT', body: data }),
  deleteAlbum: (id) => request(`/albums/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request('/settings'),
  updateSettings: (data) => request('/settings', { method: 'PUT', body: data }),
};

export default api;
