import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../services/authApi';
import { getCurrentUser, setStoredUser, logout as clearStoredAuth } from '../utils/auth';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from backend or localStorage on mount
  useEffect(() => {
    const initAuth = async () => {
      const stored = getCurrentUser();
      if (stored) {
        if (stored.role === 'ADMIN') {
          clearStoredAuth();
          setUser(null);
        } else {
          setUser(stored);
        }
      }

      const token = localStorage.getItem('govprep_token');
      if (token) {
        const remoteUser = await authApi.getMe();
        if (remoteUser) {
          if (remoteUser.role === 'ADMIN') {
            clearStoredAuth();
            setUser(null);
          } else {
            setUser(remoteUser);
          }
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const handleLogin = async (
    email,
    password,
    role = 'USER'
  ) => {
    const res = await authApi.login(email, password, role);
    if (res.success && res.user) {
      // Strictly enforce Student portal access control: deny ADMIN role accounts
      if (res.user.role === 'ADMIN') {
        clearStoredAuth();
        setUser(null);
        return {
          success: false,
          error: 'This account has Administrator privileges. Please access the separate Admin Portal to log in.',
        };
      }
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Invalid email or password.' };
  };

  const handleRegister = async (
    registrationData,
    email,
    password,
    targetExam
  ) => {
    const res = await authApi.register(registrationData, email, password, targetExam);
    if (res.success && res.user) {
      setUser(res.user);
      return { success: true };
    }
    return { success: false, error: res.error || 'Registration failed.' };
  };

  const handleLogout = async () => {
    await authApi.logout();
    clearStoredAuth();
    setUser(null);
  };

  const handleUpdateUser = (data) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setStoredUser(updated);
    setUser(updated);
  };

  const value = {
    user,
    role: user ? user.role : null,
    isAuthenticated: !!user && user.role === 'USER',
    isLoading,
    login: handleLogin,
    register: handleRegister,
    logout: handleLogout,
    updateUser: handleUpdateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
