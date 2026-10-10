import apiClient from './api';

export const adaptiveApi = {
  getNextSession: async () => {
    try {
      const res = await apiClient.get('/adaptive/next-session');
      if (res.data.success && res.data.nextSession) {
        return res.data.nextSession;
      }
      return null;
    } catch (err) {
      // Fallback
      return {
        id: 'rec-fallback-01',
        title: 'Mathematics Focus Practice',
        subjectName: 'Mathematics',
        topicNames: ['Percentages', 'Ratio & Proportion'],
        difficulty: 'MEDIUM',
        questionCount: 15,
        estimatedTime: '15 mins',
        reason: 'Your recent accuracy in Percentages and Ratio & Proportion is below your general Mathematics average.',
      };
    }
  },

  generateSession: async (options) => {
    try {
      const res = await apiClient.post('/adaptive/generate-session', options || {});
      return res.data;
    } catch (err) {
      throw new Error(err.response?.data?.message || 'Failed to generate adaptive practice session.');
    }
  },

  getWeaknessProfile: async () => {
    try {
      const res = await apiClient.get('/adaptive/weaknesses');
      if (res.data.success) {
        return res.data;
      }
      throw new Error('Could not fetch weakness profile.');
    } catch (err) {
      // Fallback empty structured data
      return {
        weaknessProfile: null,
        topics: {
          highPriority: [],
          mediumPriority: [],
          needsAttention: [],
          improving: [],
          strong: [],
        },
        totalTopicsTracked: 0,
      };
    }
  },

  getRecommendations: async () => {
    try {
      const res = await apiClient.get('/adaptive/recommendations');
      return res.data.recommendations || [];
    } catch (err) {
      return [];
    }
  },
};
