import { prisma } from '../config/db.js';
import { AdaptiveEngine } from '../services/adaptive/adaptiveEngine.js';
import { RecommendationService } from '../services/recommendation/recommendationService.js';
export class AdaptiveController {
    static async getNextSession(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const recommendation = await RecommendationService.getActiveRecommendation(userId);
            res.status(200).json({ success: true, nextSession: recommendation });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch next practice session.' });
        }
    }
    static async generateSession(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const { targetSubjectId, desiredQuestionCount, examSlug } = req.body;
            const generated = await AdaptiveEngine.generateSession(userId, {
                targetSubjectId,
                desiredQuestionCount: desiredQuestionCount || 15,
                examSlug,
            });
            res.status(201).json({
                success: true,
                message: 'Adaptive practice session generated successfully.',
                practiceSessionId: generated.session.id,
                session: {
                    id: generated.session.id,
                    title: generated.session.title,
                    subjectName: generated.session.subjectName,
                    targetTopics: JSON.parse(generated.session.targetTopics),
                    difficulty: generated.session.difficulty,
                    questionCount: generated.session.questionCount,
                    estimatedMinutes: generated.session.estimatedMinutes,
                    reason: generated.session.reason,
                },
                questions: generated.questions,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to generate adaptive session.' });
        }
    }
    static async getWeaknessProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const completedAttemptsCount = await prisma.testAttempt.count({
                where: { userId, isCompleted: true },
            });
            if (completedAttemptsCount === 0) {
                res.status(200).json({
                    success: true,
                    weaknessProfile: null,
                    topics: {
                        highPriority: [],
                        mediumPriority: [],
                        needsAttention: [],
                        improving: [],
                        strong: [],
                    },
                    totalTopicsTracked: 0,
                    totalCompletedAttempts: 0,
                });
                return;
            }
            const performances = await prisma.studentTopicPerformance.findMany({
                where: { userId },
                include: { topic: { include: { subject: true } } },
                orderBy: { weaknessScore: 'desc' },
            });
            const profile = await prisma.weaknessProfile.findUnique({
                where: { userId },
            });
            const highPriority = performances
                .filter((p) => p.accuracy < 50 || p.weaknessScore >= 65 || p.trend === 'WEAK')
                .map((p) => ({
                topicId: p.topicId,
                topicName: p.topic.name,
                subjectName: p.topic.subject.name,
                accuracy: p.accuracy,
                recentAccuracy: p.recentAccuracy,
                questionsAttempted: p.questionsAttempted,
                correctAnswers: p.correctAnswers,
                incorrectAnswers: p.incorrectAnswers,
                skippedCount: p.skippedCount,
                avgTimeSeconds: p.avgTimeSeconds,
                trend: p.trend,
                weaknessScore: p.weaknessScore,
                priority: 'HIGH',
                statusLabel: 'Weak',
                lastPracticedAt: p.lastPracticedAt ? p.lastPracticedAt.toISOString() : null,
                recommendation: `High error rate (${Math.round(100 - p.accuracy)}%). Needs concept drill and fundamental revision.`,
            }));
            const mediumPriority = performances
                .filter((p) => (p.accuracy >= 50 && p.accuracy < 70) ||
                (p.weaknessScore >= 45 && p.weaknessScore < 65 && p.trend !== 'WEAK' && p.trend !== 'IMPROVING'))
                .map((p) => ({
                topicId: p.topicId,
                topicName: p.topic.name,
                subjectName: p.topic.subject.name,
                accuracy: p.accuracy,
                recentAccuracy: p.recentAccuracy,
                questionsAttempted: p.questionsAttempted,
                correctAnswers: p.correctAnswers,
                incorrectAnswers: p.incorrectAnswers,
                skippedCount: p.skippedCount,
                avgTimeSeconds: p.avgTimeSeconds,
                trend: p.trend,
                weaknessScore: p.weaknessScore,
                priority: 'MEDIUM',
                statusLabel: 'Needs Improvement',
                lastPracticedAt: p.lastPracticedAt ? p.lastPracticedAt.toISOString() : null,
                recommendation: `Moderate accuracy (${p.accuracy}%). Practice 15-20 medium difficulty questions to reach benchmark.`,
            }));
            const improving = performances
                .filter((p) => p.trend === 'IMPROVING' || (p.recentAccuracy > p.accuracy + 3 && p.accuracy < 80))
                .map((p) => ({
                topicId: p.topicId,
                topicName: p.topic.name,
                subjectName: p.topic.subject.name,
                accuracy: p.accuracy,
                recentAccuracy: p.recentAccuracy,
                questionsAttempted: p.questionsAttempted,
                correctAnswers: p.correctAnswers,
                incorrectAnswers: p.incorrectAnswers,
                skippedCount: p.skippedCount,
                avgTimeSeconds: p.avgTimeSeconds,
                trend: p.trend,
                weaknessScore: p.weaknessScore,
                priority: 'LOW',
                statusLabel: 'Improving',
                lastPracticedAt: p.lastPracticedAt ? p.lastPracticedAt.toISOString() : null,
                recommendation: `Recent accuracy trending up (${p.recentAccuracy}%). Maintain momentum with timed practice.`,
            }));
            const strong = performances
                .filter((p) => (p.accuracy >= 70 && p.weaknessScore < 45) || p.trend === 'STRONG')
                .map((p) => ({
                topicId: p.topicId,
                topicName: p.topic.name,
                subjectName: p.topic.subject.name,
                accuracy: p.accuracy,
                recentAccuracy: p.recentAccuracy,
                questionsAttempted: p.questionsAttempted,
                correctAnswers: p.correctAnswers,
                incorrectAnswers: p.incorrectAnswers,
                skippedCount: p.skippedCount,
                avgTimeSeconds: p.avgTimeSeconds,
                trend: p.trend,
                weaknessScore: p.weaknessScore,
                priority: 'LOW',
                statusLabel: 'Strong',
                lastPracticedAt: p.lastPracticedAt ? p.lastPracticedAt.toISOString() : null,
                recommendation: 'Solid concept mastery (>70% accuracy). Periodic speed drills recommended to maintain edge.',
            }));
            const categorized = {
                highPriority,
                mediumPriority,
                needsAttention: highPriority, // Backward compatibility alias
                improving,
                strong,
            };
            res.status(200).json({
                success: true,
                weaknessProfile: profile,
                topics: categorized,
                totalTopicsTracked: performances.length,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch weakness profile.' });
        }
    }
    static async getRecommendations(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const recommendations = await prisma.recommendation.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 10,
            });
            const formatted = recommendations.map((r) => ({
                ...r,
                topicNames: typeof r.topicNames === 'string' ? JSON.parse(r.topicNames) : r.topicNames,
            }));
            res.status(200).json({ success: true, recommendations: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch recommendations.' });
        }
    }
}
