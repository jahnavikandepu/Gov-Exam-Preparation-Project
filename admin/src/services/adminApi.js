import apiClient from './api';

export const adminApi = {
  getStats: async () => {
    const res = await apiClient.get('/admin/dashboard/stats');

    if (res.data && res.data.success) {
      return {
        totalUsers: res.data.totalUsers,
        totalQuestions: res.data.totalQuestions,
        totalTests: res.data.totalTests,
        totalExams: res.data.totalExams ?? 0,
        totalAttempts: res.data.totalAttempts,
        totalTopicAttempts: res.data.totalTopicAttempts ?? 0,
        totalExamAttempts: res.data.totalExamAttempts ?? 0,
      };
    }
    throw new Error('Failed to fetch administrator dashboard statistics from database.');
  },

  getAnalytics: async () => {
    try {
      const res = await apiClient.get('/admin/analytics');
      return res.data.analytics;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch analytics.');
    }
  },

  getUsers: async () => {
    try {
      const res = await apiClient.get('/admin/users');
      return res.data.users || [];
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch users.');
    }
  },

  getUserDetails: async (userId) => {
    try {
      const res = await apiClient.get(`/admin/users/${userId}`);
      if (res.data && res.data.success) {
        return res.data;
      }
      throw new Error('Failed to retrieve user details.');
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to fetch user details.');
    }
  },

  updateUserStatus: async (userId, status) => {
    try {
      const res = await apiClient.patch(`/admin/users/${userId}/status`, { status });
      return res.data.success;
    } catch {
      return false;
    }
  },

  getQuestions: async () => {
    try {
      const res = await apiClient.get('/admin/questions');
      return res.data.questions || [];
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch questions.');
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

  getExamStages: async () => {
    try {
      const res = await apiClient.get('/admin/stages');
      return res.data.stages || [];
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch exam stages.');
    }
  },

  updateExamStage: async (id, data) => {
    try {
      const res = await apiClient.put(`/admin/stages/${id}`, data);
      return res.data.stage;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to update exam stage.');
    }
  },

  getQuestionPoolHealth: async () => {
    try {
      const res = await apiClient.get('/admin/pool-health');
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to fetch question pool health.');
    }
  },

  syncTopicTests: async () => {
    try {
      const res = await apiClient.post('/admin/sync-tests');
      return { success: true, message: res.data.message };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.message || err.message || 'Failed to trigger test synchronization.',
      };
    }
  },

  bulkGenerateQuestions: async (data) => {
    try {
      const res = await apiClient.post('/admin/questions/generate', data);
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || err.message || 'Failed to generate questions.');
    }
  },

  getGeminiStatus: async () => {
    try {
      const res = await apiClient.get('/admin/questions/ai-status');
      return res.data;
    } catch (err) {
      return { success: false, available: false, error: err.message };
    }
  },
};
