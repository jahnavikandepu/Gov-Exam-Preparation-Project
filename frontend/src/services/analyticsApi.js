import apiClient from './api';

export const analyticsApi = {
  getDashboard: async () => {
    try {
      const res = await apiClient.get('/performance/dashboard');
      if (res.data.success && res.data.dashboard) {
        const d = res.data.dashboard;
        return {
          user: {},
          stats: {
            testsAttempted: typeof d.totalTests === 'number' ? d.totalTests : 0,
            questionsPracticed: typeof d.totalQuestions === 'number' ? d.totalQuestions : 0,
            accuracy: typeof d.overallAccuracy === 'number' ? d.overallAccuracy : 0,
            averageScore: typeof d.averageScore === 'number' ? d.averageScore : 0,
          },
          scoreTrends: Array.isArray(d.scoreTrends) ? d.scoreTrends : [],
          weakTopics: Array.isArray(d.weakTopics) ? d.weakTopics : [],
          continueTest: d.continueTest || undefined,
          recommendedTest: d.recommendedTest || undefined,
        };
      }
      return {
        user: {},
        stats: {
          testsAttempted: 0,
          averageScore: 0,
          accuracy: 0,
          questionsPracticed: 0,
        },
        scoreTrends: [],
        weakTopics: [],
      };
    } catch (err) {
      return {
        user: {},
        stats: {
          testsAttempted: 0,
          averageScore: 0,
          accuracy: 0,
          questionsPracticed: 0,
        },
        scoreTrends: [],
        weakTopics: [],
      };
    }
  },

  getHistory: async () => {
    try {
      const res = await apiClient.get('/performance/history');
      if (res.data.success && Array.isArray(res.data.history)) {
        return res.data.history;
      }
      return [];
    } catch (err) {
      return [];
    }
  },

  getProgress: async () => {
    try {
      const res = await apiClient.get('/performance/progress');
      if (res.data.success && res.data.progress) {
        return res.data.progress;
      }
      return {
        totalTestsCompleted: 0,
        totalQuestionsPracticed: 0,
        overallAccuracy: 0,
        accuracyTrend: [],
        subjectAccuracy: [],
        weakTopics: [],
        improvingTopics: [],
        strongTopics: [],
      };
    } catch (err) {
      return {
        totalTestsCompleted: 0,
        totalQuestionsPracticed: 0,
        overallAccuracy: 0,
        accuracyTrend: [],
        subjectAccuracy: [],
        weakTopics: [],
        improvingTopics: [],
        strongTopics: [],
      };
    }
  },

  getAIAnalysis: async (attemptId) => {
    try {
      const endpoint = attemptId ? `/ai/analysis/${attemptId}` : '/ai/analysis';
      const res = await apiClient.get(endpoint);
      if (res.data.success && res.data.analysis) {
        return res.data.analysis;
      }
      return null;
    } catch (err) {
      return null;
    }
  },

  getAIAnalysisHistory: async () => {
    try {
      const res = await apiClient.get('/ai/history');
      if (res.data.success && res.data.history) {
        return res.data.history;
      }
      return [];
    } catch (err) {
      return [];
    }
  },

  triggerAIAnalysis: async (attemptId) => {
    try {
      const res = await apiClient.post('/ai/analyze-performance', { attemptId });
      return res.data.analysis;
    } catch (err) {
      return analyticsApi.getAIAnalysis(attemptId);
    }
  },
};
