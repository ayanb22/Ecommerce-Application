import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

// Matches SIMPLE_JWT's AUTH_HEADER_TYPES = ('Bearer',) in settings.py
const ACCESS_KEY = 'cg_access_token';
const REFRESH_KEY = 'cg_refresh_token';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS_KEY),
  getRefresh: () => localStorage.getItem(REFRESH_KEY),
  setTokens: (access, refresh) => {
    localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  },
  clear: () => {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export const api = axios.create({
  baseURL: BASE_URL,
});

// Plain client with no interceptors, used only for the refresh call itself
// so a failed refresh can't recursively trigger another refresh attempt.
const bareClient = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccess();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshInFlight = null;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    // Only attempt one silent refresh per request, and only on 401s from an
    // authenticated call (not on login/register, which don't send a token).
    if (response && response.status === 401 && !config._retried && tokenStore.getRefresh()) {
      config._retried = true;
      try {
        if (!refreshInFlight) {
          refreshInFlight = bareClient
            .post('/token/refresh/', { refresh: tokenStore.getRefresh() })
            .finally(() => {
              refreshInFlight = null;
            });
        }
        const { data } = await refreshInFlight;
        tokenStore.setTokens(data.access, null);
        config.headers.Authorization = `Bearer ${data.access}`;
        return api(config);
      } catch (refreshError) {
        tokenStore.clear();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Normalizes DRF's various error shapes ({detail}, {field: [...]}, {message})
// into one readable string for the UI to display.
export function extractErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  if (data.message) return data.message;
  if (data.error) return typeof data.error === 'string' ? data.error : fallback;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const val = data[firstKey];
    const text = Array.isArray(val) ? val[0] : val;
    return typeof text === 'string' ? text : fallback;
  }
  return fallback;
}
