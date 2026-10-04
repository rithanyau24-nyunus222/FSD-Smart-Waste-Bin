const BASE_URL = '/api';

export async function api(endpoint, options = {}) {
  const url = endpoint.startsWith('/api')
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const token = localStorage.getItem('token');
  const headers = { ...options.headers };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let body = options.body;
  if (
    body &&
    typeof body === 'object' &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    headers['Content-Type'] = 'application/json';
    body = JSON.stringify(body);
  }

  const res = await fetch(url, {
    ...options,
    headers,
    body
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  let data = null;
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await res.json();
  } else {
    data = await res.text();
  }

  if (!res.ok) {
    const errorMsg =
      data && typeof data === 'object' && data.message
        ? data.message
        : res.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

  return data;
}

api.get = (endpoint, options = {}) => api(endpoint, { ...options, method: 'GET' });
api.post = (endpoint, body, options = {}) => api(endpoint, { ...options, method: 'POST', body });
api.patch = (endpoint, body, options = {}) => api(endpoint, { ...options, method: 'PATCH', body });
api.delete = (endpoint, options = {}) => api(endpoint, { ...options, method: 'DELETE' });

// Photo upload helper ready for Phase 3
export async function uploadPhoto(blob, thumbBlob) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': blob.type || 'image/webp'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch('/api/photos', {
    method: 'POST',
    headers,
    body: blob
  });

  if (res.status === 401) {
    localStorage.removeItem('token');
    window.dispatchEvent(new CustomEvent('auth:logout'));
  }

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || 'Photo upload failed');
  }

  if (thumbBlob && data.id) {
    const thumbHeaders = {
      'Content-Type': thumbBlob.type || 'image/webp'
    };
    if (token) {
      thumbHeaders['Authorization'] = `Bearer ${token}`;
    }
    await fetch(`/api/photos?thumbFor=${data.id}`, {
      method: 'POST',
      headers: thumbHeaders,
      body: thumbBlob
    });
  }

  return data;
}

export default api;
