import { AnalyticsService } from '../services/analytics/analyticsService.js';
import { prisma } from '../config/db.js';
export class PerformanceController {
    static async getProgress(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const progress = await AnalyticsService.getStudentProgress(userId);
            res.status(200).json({ success: true, progress });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch student progress.' });
        }
    }
    static async getHistory(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const attempts = await prisma.testAttempt.findMany({
                where: { userId, isCompleted: true },
                include: {
                    test: { include: { exam: true, topic: true, subject: true } },
                    stage: true,
                },
                orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
            });
            const formatted = attempts.map((a, index, arr) => {
                const prevAttempt = arr[index + 1];
                let diffPct = 0;
                if (prevAttempt && prevAttempt.score > 0) {
                    diffPct = Math.round(((a.score - prevAttempt.score) / prevAttempt.score) * 100);
                }
                const subjectBreakdown = a.subjectBreakdown ? JSON.parse(a.subjectBreakdown) : {};
                const subjects = Object.values(subjectBreakdown);
                let strongest = 'General';
                let weakest = 'General';
                if (subjects.length > 0) {
                    const sorted = [...subjects].sort((x, y) => (y.correct / (y.attempted || 1)) - (x.correct / (x.attempted || 1)));
                    strongest = sorted[0]?.name || 'General';
                    weakest = sorted[sorted.length - 1]?.name || 'General';
                }
                const dateObj = a.submittedAt || a.endTime || a.createdAt;
                const formattedDate = dateObj
                    ? new Date(dateObj).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                    : 'Recent';
                const isTopicTest = Boolean(a.topicId || a.test?.type === 'TOPIC_TEST' || a.test?.topicId);
                return {
                    id: a.id,
                    attemptId: a.id,
                    attemptNumber: a.attemptNumber || 1,
                    testId: a.testId || a.practiceSessionId || 'session',
                    testSlug: a.test?.slug || a.testId || '',
                    testTitle: a.testTitle,
                    examName: a.examName,
                    examSlug: a.test?.exam?.slug || '',
                    stageName: a.stage?.name || '',
                    topicName: a.test?.topic?.name || '',
                    subjectName: a.test?.subject?.name || '',
                    category: isTopicTest ? 'TOPIC_TEST' : 'EXAM',
                    testType: a.test?.type || (isTopicTest ? 'TOPIC_TEST' : 'FULL_MOCK'),
                    date: formattedDate,
                    score: a.score,
                    totalMarks: a.totalMarks,
                    maxScore: a.totalMarks,
                    accuracy: a.accuracy,
                    totalQuestions: a.totalQuestions,
                    attemptedQuestions: a.attemptedQuestions,
                    correctAnswers: a.correctAnswers,
                    incorrectAnswers: a.incorrectAnswers,
                    skippedQuestions: a.skippedQuestions,
                    timeSpent: `${Math.round(a.durationSeconds / 60)} mins`,
                    timeSpentMinutes: Math.round(a.durationSeconds / 60),
                    status: 'Completed',
                    strongestSubject: strongest,
                    weakestSubject: weakest,
                    percentile: Math.min(99, Math.round(a.accuracy * 0.95 + 5)),
                    scoreDiff: diffPct,
                };
            });
            res.status(200).json({ success: true, history: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch attempt history.' });
        }
    }
    static async getDashboardData(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const progress = await AnalyticsService.getStudentProgress(userId);
            const recentAttempts = await prisma.testAttempt.findMany({
                where: { userId, isCompleted: true },
                include: {
                    test: { include: { exam: true } },
                },
                orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
                take: 5,
            });
            const activeRecommendation = await prisma.recommendation.findFirst({
                where: { userId, status: 'PENDING' },
                orderBy: { createdAt: 'desc' },
            });
            const avgScoreAgg = await prisma.testAttempt.aggregate({
                where: { userId, isCompleted: true },
                _avg: { score: true },
            });
            const averageScore = avgScoreAgg._avg.score ? Math.round(avgScoreAgg._avg.score * 10) / 10 : 0;
            const scoreTrends = progress.accuracyTrend.map((t) => ({
                testName: t.testTitle,
                date: t.date,
                score: t.score,
                maxScore: 100,
                accuracy: t.accuracy,
            }));
            res.status(200).json({
                success: true,
                dashboard: {
                    totalTests: progress.totalTestsCompleted,
                    totalQuestions: progress.totalQuestionsPracticed,
                    overallAccuracy: progress.overallAccuracy,
                    averageScore,
                    scoreTrends,
                    weakTopicsCount: progress.weakTopics.length,
                    improvingTopicsCount: progress.improvingTopics.length,
                    strongTopicsCount: progress.strongTopics.length,
                    weakTopics: progress.weakTopics,
                    nextPractice: activeRecommendation ? {
                        ...activeRecommendation,
                        topicNames: typeof activeRecommendation.topicNames === 'string' ? JSON.parse(activeRecommendation.topicNames) : activeRecommendation.topicNames,
                    } : null,
                    recentAttempts: recentAttempts.map((a) => {
                        const dateObj = a.submittedAt || a.endTime || a.createdAt;
                        const formattedDate = dateObj
                            ? new Date(dateObj).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                            : '';
                        return {
                            id: a.id,
                            attemptId: a.id,
                            testTitle: a.testTitle,
                            examName: a.examName,
                            score: a.score,
                            maxScore: a.totalMarks,
                            accuracy: a.accuracy,
                            duration: `${Math.round(a.durationSeconds / 60)} mins`,
                            timeSpent: `${Math.round(a.durationSeconds / 60)} mins`,
                            date: formattedDate,
                        };
                    }),
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch dashboard data.' });
        }
    }
}
