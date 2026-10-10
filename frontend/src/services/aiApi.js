import apiClient from './api';

export const aiApi = {
  /**
   * Generates dynamic AI questions calibrated to the student's needs.
   */
  generateQuestions: async (params) => {
    try {
      const res = await apiClient.post('/ai/generate-questions', params || {});
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to generate dynamic questions.');
    }
  },

  /**
   * Fetches latest AI diagnostic analysis for the student.
   */
  getAnalysis: async () => {
    try {
      const res = await apiClient.get('/ai/analysis');
      if (res.data.success && res.data.analysis) {
        return res.data.analysis;
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  /**
   * Triggers a fresh AI diagnostic analysis for the student.
   */
  triggerAnalysis: async (attemptId) => {
    try {
      const res = await apiClient.post('/ai/analyze-performance', {
        attemptId,
      });
      if (res.data.success && res.data.analysis) {
        return res.data.analysis;
      }
      return null;
    } catch (err) {
      return null;
    }
  },
};
