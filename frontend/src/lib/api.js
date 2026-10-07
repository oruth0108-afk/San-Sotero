import axios from 'axios';

const TOKEN_KEY = 'ss_token';

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = tokenStore.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes('/auth/login');
    if (err.response?.status === 401 && !isLogin) {
      tokenStore.clear();
      window.dispatchEvent(new Event('ss:unauthorized'));
    }
    return Promise.reject(err);
  }
);

export const errorMessage = (e) => {
  if (e?.response?.status === 422 && e.response.data?.errors) {
    return Object.values(e.response.data.errors).flat()[0];
  }
  if (e?.response?.status === 429) return 'Too many attempts. Please wait a minute and try again.';
  return e?.response?.data?.message || 'Something went wrong. Please check your connection and try again.';
};

export const fieldErrors = (e) => {
  const raw = e?.response?.data?.errors || {};
  return Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, v[0]]));
};

/** Fetches a protected file with the auth token, then opens it in a new tab or downloads it. */
export async function openFile(url, { download = false, filename = 'download', params } = {}) {
  const win = download ? null : window.open('', '_blank'); // open synchronously so popup blockers allow it
  try {
    const res = await api.get(url, { responseType: 'blob', params });
    const blobUrl = URL.createObjectURL(res.data);
    if (download) {
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } else if (win) {
      win.location.href = blobUrl;
    }
    setTimeout(() => URL.revokeObjectURL(blobUrl), 60000);
  } catch (e) {
    if (win) win.close();
    throw e;
  }
}

export default api;
