import apiClient from './api';
import { mockAllUsers } from '../data/users';
import { mockQuestions } from '../data/questions';

export const adminApi = {
  getStats: async () => {
    const res = await apiClient.get('/admin/dashboard/stats');

    if (res.data && res.data.success) {
      return {
        totalUsers: res.data.totalUsers,
        totalQuestions: res.data.totalQuestions,
        totalTests: res.data.totalTests,
        totalAttempts: res.data.totalAttempts,
      };
    }
    throw new Error('Failed to fetch administrator dashboard statistics from database.');
  },

  getAnalytics: async () => {
    try {
      const res = await apiClient.get('/admin/analytics');
      return res.data.analytics;
    } catch (err) {
      return null;
    }
  },

  getUsers: async () => {
    try {
      const res = await apiClient.get('/admin/users');
      if (res.data.success && res.data.users?.length > 0) {
        return res.data.users;
      }
      return mockAllUsers;
    } catch (err) {
      return mockAllUsers;
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const res = await apiClient.patch(`/admin/users/${userId}/status`, { status });
      return res.data.success;
    } catch (err) {
      return false;
    }
  },

  getQuestions: async () => {
    try {
      const res = await apiClient.get('/admin/questions');
      if (res.data.success && res.data.questions?.length > 0) {
        return res.data.questions;
      }
      return mockQuestions;
    } catch (err) {
      return mockQuestions;
    }
  },

  addQuestion: async (question) => {
    try {
      const res = await apiClient.post('/admin/questions', question);
      return res.data.question;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to create question.');
    }
  },

  updateQuestion: async (id, question) => {
    try {
      const res = await apiClient.put(`/admin/questions/${id}`, question);
      return res.data.question;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update question.');
    }
  },

  deleteQuestion: async (id) => {
    await apiClient.delete(`/admin/questions/${id}`);
  },

  getQuestionPoolHealth: async () => {
    try {
      const res = await apiClient.get('/admin/pool-health');
      return res.data;
    } catch (err) {
      return null;
    }
  },
};
