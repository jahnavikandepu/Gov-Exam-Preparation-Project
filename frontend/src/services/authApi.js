import apiClient from './api';

export const authApi = {
  register: async (registrationData, maybeEmail, maybePassword, maybeTargetExam) => {
    try {
      const payload = typeof registrationData === 'object' && registrationData !== null
        ? registrationData
        : {
            name: registrationData,
            email: maybeEmail,
            password: maybePassword,
            targetExam: maybeTargetExam || 'RRB NTPC',
          };
      const res = await apiClient.post('/auth/register', payload);
      if (res.data.token && res.data.user) {
        localStorage.setItem('govprep_token', res.data.token);
        localStorage.setItem('govprep_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Registration failed. Please check your details.',
      };
    }
  },

  login: async (email, password, role) => {
    try {
      const res = await apiClient.post('/auth/login', {
        email,
        password,
        role,
      });
      if (res.data.token && res.data.user) {
        localStorage.setItem('govprep_token', res.data.token);
        localStorage.setItem('govprep_user', JSON.stringify(res.data.user));
      }
      return res.data;
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Invalid email or password.',
      };
    }
  },

  getMe: async () => {
    try {
      const res = await apiClient.get('/auth/me');
      if (res.data.success && res.data.user) {
        localStorage.setItem('govprep_user', JSON.stringify(res.data.user));
        return res.data.user;
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  updateProfile: async (data) => {
    try {
      const res = await apiClient.put('/auth/profile', data);
      if (res.data.success && res.data.user) {
        const stored = localStorage.getItem('govprep_user');
        const prev = stored ? JSON.parse(stored) : {};
        const updated = { ...prev, ...res.data.user };
        localStorage.setItem('govprep_user', JSON.stringify(updated));
      }
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to update profile.',
      };
    }
  },

  changePassword: async (data) => {
    try {
      const res = await apiClient.post('/auth/change-password', data);
      return res.data;
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to change password.',
      };
    }
  },

  forgotPassword: async (email) => {
    try {
      const res = await apiClient.post('/auth/forgot-password', { email });
      return res.data;
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to verify account.',
      };
    }
  },

  resetPassword: async (email, newPassword) => {
    try {
      const res = await apiClient.post('/auth/reset-password', { email, newPassword });
      return res.data;
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || 'Failed to reset password.',
      };
    }
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('govprep_token');
      localStorage.removeItem('govprep_user');
    }
  },
};
