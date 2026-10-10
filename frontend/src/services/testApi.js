import apiClient from './api';
import { mockTests } from '../data/tests';
import { mockQuestions } from '../data/questions';

export const testApi = {
  getTests: async (filters) => {
    try {
      const res = await apiClient.get('/tests', {
        params: filters,
      });
      if (res.data.success && res.data.tests?.length > 0) {
        return res.data.tests;
      }
      return mockTests;
    } catch (err) {
      console.warn('Falling back to mock tests:', err);
      return mockTests;
    }
  },

  getTestById: async (id) => {
    try {
      const res = await apiClient.get(`/tests/${id}`);
      if (res.data.success && res.data.test) {
        return res.data.test;
      }
      return mockTests.find((t) => t.id === id);
    } catch (err) {
      return mockTests.find((t) => t.id === id);
    }
  },

  startTest: async (testId, options) => {
    try {
      const res = await apiClient.post(`/tests/${testId}/start`, options || {});

      if (res.data.success && (res.data.isCompleted || res.data.isExpired)) {
        return {
          attemptId: res.data.attemptId,
          isCompleted: true,
          isExpired: true,
          message: res.data.message || 'Time is up. Your exam has been automatically submitted.',
          score: res.data.score,
          totalMarks: res.data.totalMarks,
        };
      }

      if (res.data.success && res.data.questions && res.data.questions.length > 0) {
        return {
          attemptId: res.data.attemptId,
          attemptNumber: res.data.attemptNumber,
          isResumed: res.data.isResumed,
          startedAt: res.data.startedAt,
          expiresAt: res.data.expiresAt,
          currentSectionId: res.data.currentSectionId,
          currentSectionIndex: res.data.currentSectionIndex ?? 0,
          sectionExpiresAt: res.data.sectionExpiresAt,
          sectionTimingData: res.data.sectionTimingData,
          serverTime: res.data.serverTime,
          durationSeconds: res.data.durationSeconds,
          remainingSeconds: res.data.remainingSeconds,
          sectionRemainingSeconds: res.data.sectionRemainingSeconds,
          tabSwitchCount: res.data.tabSwitchCount || 0,
          test: res.data.test,
          questions: res.data.questions,
          isCompleted: false,
          isExpired: false,
        };
      }
    } catch (err) {
      console.warn('[testApi.startTest] Backend test session initialization note, falling back to mock dataset:', err.message || err);
    }

    // Fallback for mock tests, unauthenticated session previews, or offline dev
    const fallbackTest = mockTests.find((t) => t.id === testId || t.examSlug === testId) || mockTests[0];
    const testQuestions = mockQuestions.filter((q) => q.testId === fallbackTest?.id || q.examName === fallbackTest?.examName);
    const questionsToUse = testQuestions.length > 0 ? testQuestions : mockQuestions;
    const durationSeconds = (fallbackTest?.durationMinutes || 90) * 60;
    const now = new Date();

    return {
      attemptId: `mock-attempt-${Date.now()}`,
      attemptNumber: 1,
      isResumed: false,
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + durationSeconds * 1000).toISOString(),
      serverTime: now.toISOString(),
      durationSeconds,
      remainingSeconds: durationSeconds,
      tabSwitchCount: 0,
      test: fallbackTest || {
        id: testId,
        title: 'Mock Test Simulator',
        durationMinutes: 90,
        totalQuestions: questionsToUse.length,
        negativeMarkingPerQuestion: 0.33,
        marksPerCorrect: 1,
        sections: [{ id: 'general', name: 'General', questionsCount: questionsToUse.length }],
      },
      questions: questionsToUse,
    };
  },

  autosaveAnswer: async (attemptId, data) => {
    try {
      const res = await apiClient.post(`/tests/attempts/${attemptId}/answer`, data);
      return res.data;
    } catch (err) {
      console.warn('Autosave failed:', err);
      return { success: false };
    }
  },

  recordTabSwitch: async (attemptId) => {
    try {
      const res = await apiClient.post(
        `/tests/attempts/${attemptId}/tab-switch`,
        { event: 'TAB_SWITCH' }
      );
      return res.data;
    } catch (err) {
      console.warn('Tab switch recording failed:', err);
      return { success: false, tabSwitchCount: 1, shouldSubmit: false };
    }
  },

  getAttemptState: async (attemptId) => {
    try {
      const res = await apiClient.get(`/tests/attempts/${attemptId}`);
      if (res.data.success) {
        return res.data.attempt;
      }
      return null;
    } catch (err) {
      console.warn('Failed to load attempt state:', err);
      return null;
    }
  },

  submitSection: async (attemptId, data) => {
    try {
      const res = await apiClient.post(`/tests/attempts/${attemptId}/submit-section`, data || {});
      return res.data;
    } catch (err) {
      console.warn('Failed to submit section:', err);
      return { success: false };
    }
  },

  submitAttempt: async (attemptData) => {
    try {
      const res = await apiClient.post(
        `/tests/${attemptData.testId}/submit`,
        attemptData
      );
      if (res.data.success && res.data.attemptId) {
        return { attemptId: res.data.attemptId };
      }
      return { attemptId: attemptData.attemptId || 'att-mock-fallback' };
    } catch (err) {
      console.warn('Backend submit error, using local fallback attempt ID:', err);
      return { attemptId: attemptData.attemptId || 'att-rrb-ntpc-01' };
    }
  },
};
