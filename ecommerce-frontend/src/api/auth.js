import { api, tokenStore } from './client';

// Matches RegistrationSerializer fields: username, email, password, password2
export async function register({ username, email, password, password2 }) {
  const { data } = await api.post('/register/', { username, email, password, password2 });
  return data;
}

// Matches TokenObtainPairView at /token/ — returns { access, refresh }.
// Note: the backend has no "current user" endpoint, so we keep the
// username the person typed alongside the tokens for display purposes.
export async function login({ username, password }) {
  const { data } = await api.post('/token/', { username, password });
  tokenStore.setTokens(data.access, data.refresh);
  localStorage.setItem('cg_username', username);
  return { username };
}

export function logout() {
  tokenStore.clear();
  localStorage.removeItem('cg_username');
}

export function getStoredUser() {
  const username = localStorage.getItem('cg_username');
  const isAuthenticated = Boolean(tokenStore.getAccess());
  return isAuthenticated && username ? { username } : null;
}
