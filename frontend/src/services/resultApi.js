import apiClient from './api';

export const resultApi = {
  getResultByAttemptId: async (attemptId) => {
    try {
      const res = await apiClient.get(`/results/${attemptId}`);
      if (res.data.success && res.data.result) {
        return res.data.result;
      }
      return null;
    } catch (err) {
      console.warn('Backend result fetch error:', err);
      return null;
    }
  },
};
