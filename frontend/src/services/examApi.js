import apiClient from './api';
import { mockExams } from '../data/exams';

export const examApi = {
  getExams: async () => {
    try {
      const res = await apiClient.get('/exams');
      if (res.data.success && res.data.exams?.length > 0) {
        return res.data.exams;
      }
      return mockExams;
    } catch (err) {
      console.warn('Falling back to mock exams due to backend notice:', err);
      return mockExams;
    }
  },

  getExamBySlug: async (slug) => {
    try {
      const res = await apiClient.get(`/exams/${slug}`);
      if (res.data.success && res.data.exam) {
        return res.data.exam;
      }
      return mockExams.find((e) => e.slug === slug);
    } catch (err) {
      return mockExams.find((e) => e.slug === slug);
    }
  },
};
