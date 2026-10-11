import axios from 'axios';
import { examApi } from './examApi';
import { testApi } from './testApi';
import { resultApi } from './resultApi';
import { analyticsApi } from './analyticsApi';
import { adminApi } from './adminApi';
import { adaptiveApi } from './adaptiveApi';
import { authApi } from './authApi';
import { aiApi } from './aiApi';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Inject JWT token from localStorage
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('govprep_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: Handle common HTTP responses
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized session or expired token.');
    }
    return Promise.reject(error);
  }
);

// Compatibility exports
export const examService = {
  getExams: examApi.getExams,
  getExamBySlug: examApi.getExamBySlug,
};

export const testService = {
  getTests: testApi.getTests,
  getTestById: testApi.getTestById,
  getTestQuestions: async (testId) => {
    const res = await testApi.startTest(testId);
    return res.questions;
  },
  submitAttempt: testApi.submitAttempt,
};

export const resultService = {
  getResultByAttemptId: resultApi.getResultByAttemptId,
};

export const studentService = {
  getDashboard: analyticsApi.getDashboard,
  getHistory: analyticsApi.getHistory,
  updateProfile: async (userData) => userData,
};

export const adminService = {
  getStats: adminApi.getStats,
  getQuestions: adminApi.getQuestions,
  addQuestion: adminApi.addQuestion,
  updateQuestion: adminApi.updateQuestion,
  deleteQuestion: adminApi.deleteQuestion,
};

export { authApi, examApi, testApi, resultApi, adaptiveApi, analyticsApi, adminApi, aiApi };
export default apiClient;
