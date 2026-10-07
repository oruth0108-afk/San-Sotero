import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { tokenStore } from '../lib/api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!tokenStore.get());

  const refresh = useCallback(async () => {
    try {
      const { data } = await api.get('/auth/me');
      setUser(data.user);
      return data.user;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    if (tokenStore.get()) refresh().finally(() => setLoading(false));
    const onUnauthorized = () => setUser(null);
    window.addEventListener('ss:unauthorized', onUnauthorized);
    return () => window.removeEventListener('ss:unauthorized', onUnauthorized);
  }, [refresh]);

  const accept = (data) => { tokenStore.set(data.token); setUser(data.user); return data.user; };

  const login = async (email, password) => accept((await api.post('/auth/login', { email, password })).data);
  const register = async (formData) => accept((await api.post('/auth/register', formData)).data);

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch { /* token may already be invalid */ }
    tokenStore.clear();
    setUser(null);
  };

  const isStaff = !!user && user.role !== 'resident';

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refresh, isStaff }}>
      {children}
    </AuthContext.Provider>
  );
}
