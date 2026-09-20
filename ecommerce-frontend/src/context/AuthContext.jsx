import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as authApi from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authApi.getStoredUser());
  const [authError, setAuthError] = useState(null);

  // If a token refresh fails anywhere in the app (see api/client.js), the
  // interceptor dispatches this event so we can drop the stale session and
  // send the person back to login instead of leaving the UI in a broken
  // "looks logged in but every request 401s" state.
  useEffect(() => {
    const handleForcedLogout = () => setUser(null);
    window.addEventListener('auth:logout', handleForcedLogout);
    return () => window.removeEventListener('auth:logout', handleForcedLogout);
  }, []);

  const login = useCallback(async (credentials) => {
    setAuthError(null);
    const loggedInUser = await authApi.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (fields) => {
    setAuthError(null);
    return authApi.register(fields);
  }, []);

  const logout = useCallback(() => {
    authApi.logout();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: Boolean(user), login, register, logout, authError, setAuthError }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
}
