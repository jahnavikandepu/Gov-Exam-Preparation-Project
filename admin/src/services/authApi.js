import apiClient from './api';
import { setStoredAuth, clearStoredAuth } from '../utils/auth';

export const authApi = {
  loginAdmin: async (email, password) => {
    try {
      const res = await apiClient.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
        role: 'ADMIN',
      });

      if (res.data.success && res.data.user) {
        if (res.data.user.role !== 'ADMIN') {
          return { success: false, error: 'Access denied. Only administrator accounts can access the Admin portal.' };
        }
        setStoredAuth(res.data.token, res.data.user);
        return { success: true, user: res.data.user };
      }
      return { success: false, error: res.data.message || 'Login failed.' };
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Invalid administrator credentials.';
      return { success: false, error: msg };
    }
  },

  getMe: async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data.success && res.data.user && res.data.user.role === 'ADMIN') {
        return res.data.user;
      }
      return null;
    } catch {
      return null;
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {
      // ignore
    } finally {
      clearStoredAuth();
    }
  },
};
