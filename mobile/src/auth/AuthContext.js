import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { post, get, setToken, clearToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, check for existing token
  useEffect(() => {
    async function restoreSession() {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setTokenState(storedToken);
          setUser({ token: storedToken });
        }
      } catch (err) {
        console.warn('Session restore failed:', err.message);
        await clearToken();
      } finally {
        setIsLoading(false);
      }
    }
    restoreSession();
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await post('/api/auth/login', { email, password });
    const { token: newToken, user: userData } = res.data;
    await setToken(newToken);
    setTokenState(newToken);
    setUser({ ...userData, token: newToken });
    return res.data;
  }, []);

  const signup = useCallback(async (email, password, displayName) => {
    const res = await post('/api/auth/signup', { email, password, displayName });
    const { token: newToken, user: userData } = res.data;
    await setToken(newToken);
    setTokenState(newToken);
    setUser({ ...userData, token: newToken });
    return res.data;
  }, []);

  const enterDemoMode = useCallback(() => {
    setTokenState('demo');
    setUser({ displayName: 'Demo User', email: 'demo@example.com', token: 'demo', isDemo: true });
  }, []);

  const logout = useCallback(async () => {
    if (user?.isDemo) {
      setTokenState(null);
      setUser(null);
      return;
    }
    try {
      await post('/api/auth/logout');
    } catch (err) {
      console.warn('Logout API call failed:', err.message);
    }
    await clearToken();
    setTokenState(null);
    setUser(null);
  }, [user]);

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    enterDemoMode,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
