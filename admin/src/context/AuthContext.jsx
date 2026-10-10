import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';
import { getStoredUser, getStoredToken, clearStoredAuth } from '../utils/auth';

const AdminAuthContext = createContext(undefined);

export const AdminAuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getStoredToken();
      if (!token) {
        clearStoredAuth();
        setUser(null);
        setIsLoading(false);
        return;
      }

      try {
        const remoteUser = await authApi.getMe();
        if (remoteUser && remoteUser.role === 'ADMIN') {
          setUser(remoteUser);
        } else {
          clearStoredAuth();
          setUser(null);
        }
      } catch (err) {
        console.warn('[AdminAuth] Stale or invalid token, clearing auth:', err.message);
        clearStoredAuth();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const handleLogin = async (email, password) => {
    const res = await authApi.loginAdmin(email, password);
    if (res.success && res.user && res.user.role === 'ADMIN') {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Failed to authenticate as administrator.' };
  };

  const handleLogout = async () => {
    await authApi.logout();
    clearStoredAuth();
    setUser(null);
  };

  const value = {
    user,
    isAuthenticated: !!user && user.role === 'ADMIN',
    isLoading,
    login: handleLogin,
    logout: handleLogout,
  };

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
};

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
};

export const AuthProvider = AdminAuthProvider;
export const useAuth = useAdminAuth;
