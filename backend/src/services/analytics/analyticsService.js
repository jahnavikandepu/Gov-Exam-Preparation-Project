import { prisma } from '../../config/db.js';
export class AnalyticsService {
    /**
     * Retrieves comprehensive progress analytics for a student.
     */
    static async getStudentProgress(userId) {
        const attempts = await prisma.testAttempt.findMany({
            where: { userId, isCompleted: true },
            orderBy: { submittedAt: 'asc' },
        });
        const topicPerformances = await prisma.studentTopicPerformance.findMany({
            where: { userId },
            include: { topic: { include: { subject: true } } },
            orderBy: { weaknessScore: 'desc' },
        });
        const weaknessProfile = await prisma.weaknessProfile.findUnique({
            where: { userId },
        });
        // Accuracy trend over time
        const accuracyTrend = attempts.map((a, index) => ({
            attemptNumber: index + 1,
            testTitle: a.testTitle,
            accuracy: a.accuracy,
            score: a.score,
            date: a.submittedAt ? a.submittedAt.toISOString().split('T')[0] : '',
        }));
        // Subject breakdown
        const subjectMap = {};
        for (const tp of topicPerformances) {
            if (!subjectMap[tp.subjectId]) {
                subjectMap[tp.subjectId] = {
                    total: 0,
                    correct: 0,
                    subjectName: tp.topic.subject.name,
                };
            }
            subjectMap[tp.subjectId].total += tp.questionsAttempted;
            subjectMap[tp.subjectId].correct += tp.correctAnswers;
        }
        const subjectAccuracy = Object.values(subjectMap).map((s) => ({
            subjectName: s.subjectName,
            accuracy: s.total > 0 ? Math.round((s.correct / s.total) * 100) : 0,
            questionsPracticed: s.total,
        }));
        const totalFromPerformances = topicPerformances.reduce((sum, tp) => sum + tp.questionsAttempted, 0);
        const correctFromPerformances = topicPerformances.reduce((sum, tp) => sum + tp.correctAnswers, 0);
        const totalFromAttempts = attempts.reduce((sum, a) => sum + a.attemptedQuestions, 0);
        const correctFromAttempts = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
        const totalQuestionsPracticed = Math.max(totalFromPerformances, totalFromAttempts);
        const totalCorrect = totalFromPerformances > 0 ? correctFromPerformances : correctFromAttempts;
        const overallAccuracy = totalQuestionsPracticed > 0
            ? Math.round((totalCorrect / totalQuestionsPracticed) * 100)
            : 0;
        const weakTopics = topicPerformances.filter((tp) => tp.trend === 'WEAK' || tp.weaknessScore >= 55);
        const improvingTopics = topicPerformances.filter((tp) => tp.trend === 'IMPROVING');
        const strongTopics = topicPerformances.filter((tp) => tp.trend === 'STRONG' || tp.weaknessScore < 35);
        return {
            totalTestsCompleted: attempts.length,
            totalQuestionsPracticed,
            overallAccuracy,
            accuracyTrend,
            subjectAccuracy,
            weakTopics: weakTopics.map((tp) => ({
                topicId: tp.topicId,
                topicName: tp.topic.name,
                subjectName: tp.topic.subject.name,
                accuracy: tp.accuracy,
                recentAccuracy: tp.recentAccuracy,
                questionsAttempted: tp.questionsAttempted,
                avgTimeSeconds: tp.avgTimeSeconds,
                trend: tp.trend,
                weaknessScore: tp.weaknessScore,
                lastPracticedAt: tp.lastPracticedAt,
            })),
            improvingTopics: improvingTopics.map((tp) => ({
                topicId: tp.topicId,
                topicName: tp.topic.name,
                subjectName: tp.topic.subject.name,
                accuracy: tp.accuracy,
                recentAccuracy: tp.recentAccuracy,
                questionsAttempted: tp.questionsAttempted,
                trend: tp.trend,
            })),
            strongTopics: strongTopics.map((tp) => ({
                topicId: tp.topicId,
                topicName: tp.topic.name,
                subjectName: tp.topic.subject.name,
                accuracy: tp.accuracy,
                questionsAttempted: tp.questionsAttempted,
                trend: tp.trend,
            })),
            weaknessProfile,
        };
    }
    /**
     * Retrieves global platform analytics for the admin panel.
     */
    static async getAdminAnalytics() {
        const totalStudents = await prisma.user.count({ where: { role: 'USER' } });
        const totalAttempts = await prisma.testAttempt.count({ where: { isCompleted: true } });
        const totalQuestions = await prisma.question.count();
        const totalTests = await prisma.test.count();
        // Topic-wise performance aggregation across all students
        const topicPerformances = await prisma.studentTopicPerformance.findMany({
            include: { topic: { include: { subject: true } } },
        });
        const topicStats = {};
        for (const tp of topicPerformances) {
            if (!topicStats[tp.topicId]) {
                topicStats[tp.topicId] = {
                    topicName: tp.topic.name,
                    subjectName: tp.topic.subject.name,
                    totalAttempted: 0,
                    totalCorrect: 0,
                    weakStudentCount: 0,
                };
            }
            topicStats[tp.topicId].totalAttempted += tp.questionsAttempted;
            topicStats[tp.topicId].totalCorrect += tp.correctAnswers;
            if (tp.trend === 'WEAK' || tp.weaknessScore >= 55) {
                topicStats[tp.topicId].weakStudentCount += 1;
            }
        }
        const topicsArray = Object.values(topicStats).map((t) => ({
            ...t,
            accuracy: t.totalAttempted > 0 ? Math.round((t.totalCorrect / t.totalAttempted) * 100) : 0,
        }));
        // Most difficult topics (lowest accuracy with >= 5 attempts)
        const mostDifficultTopics = [...topicsArray]
            .sort((a, b) => a.accuracy - b.accuracy)
            .slice(0, 5);
        // Most frequently weak topics
        const mostFrequentlyWeakTopics = [...topicsArray]
            .sort((a, b) => b.weakStudentCount - a.weakStudentCount)
            .slice(0, 5);
        // Most missed questions
        const answers = await prisma.answer.findMany({
            where: { isCorrect: false },
            include: { question: { include: { topic: true, subject: true } } },
        });
        const questionMissCount = {};
        for (const a of answers) {
            if (!questionMissCount[a.questionId]) {
                questionMissCount[a.questionId] = {
                    id: a.questionId,
                    text: a.question.questionText,
                    topic: a.question.topic.name,
                    misses: 0,
                };
            }
            questionMissCount[a.questionId].misses += 1;
        }
        const mostMissedQuestions = Object.values(questionMissCount)
            .sort((a, b) => b.misses - a.misses)
            .slice(0, 5);
        const approvedQuestions = await prisma.question.count({ where: { status: 'PUBLISHED' } });
        const draftQuestions = await prisma.question.count({ where: { status: 'DRAFT' } });
        const recentAttempts = await prisma.testAttempt.findMany({
            where: { isCompleted: true },
            include: { user: true },
            orderBy: [{ submittedAt: 'desc' }, { createdAt: 'desc' }],
            take: 5,
        });
        return {
            totalStudents,
            totalAttempts,
            totalQuestions,
            totalTests,
            approvedQuestions,
            draftQuestions,
            recentAttempts: recentAttempts.map((a) => ({
                id: a.id,
                userName: a.user?.name || 'Aspirant',
                testTitle: a.testTitle,
                score: a.score,
                totalMarks: a.totalMarks,
                date: a.submittedAt ? a.submittedAt.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : 'Recent',
            })),
            mostDifficultTopics,
            mostFrequentlyWeakTopics,
            mostMissedQuestions,
        };
    }
}
