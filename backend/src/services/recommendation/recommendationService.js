import { prisma } from '../../config/db.js';
import { AIService } from '../ai/aiService.js';
export class RecommendationService {
    /**
     * Generates and stores the "Next Best Practice Session" recommendation
     * for a student after completing a test attempt.
     */
    static async generateNextBestPractice(userId, attemptId) {
        // 1. Fetch user's weakest topic performances
        const performances = await prisma.studentTopicPerformance.findMany({
            where: { userId },
            include: { topic: { include: { subject: true } } },
            orderBy: { weaknessScore: 'desc' },
            take: 3,
        });
        let targetTopicNames = [];
        let subjectName = 'Quantitative Aptitude';
        let difficulty = 'MEDIUM';
        let questionCount = 15;
        let estimatedTime = '15 mins';
        let reason = '';
        let title = 'Targeted Topic Practice';
        if (performances.length > 0) {
            targetTopicNames = performances.map((p) => p.topic.name);
            subjectName = performances[0].topic.subject.name;
            const avgAcc = performances.reduce((sum, p) => sum + p.recentAccuracy, 0) / performances.length;
            if (avgAcc < 50)
                difficulty = 'EASY';
            else if (avgAcc > 75)
                difficulty = 'HARD';
            title = `${subjectName}: ${targetTopicNames.slice(0, 2).join(' & ')} Focus`;
            reason = `Your recent accuracy in ${targetTopicNames.join(', ')} is below the target benchmark. Focused practice on these concepts will rapidly lift your total score.`;
        }
        else {
            // Default baseline recommendation
            targetTopicNames = ['Percentages', 'Number System'];
            title = 'Foundational Mathematics Drill';
            reason = 'Start with key high-weightage topics to build an adaptive strength profile.';
        }
        // Mark previous pending recommendations as replaced
        await prisma.recommendation.updateMany({
            where: { userId, status: 'PENDING' },
            data: { status: 'DISMISSED' },
        });
        // Create new recommendation
        const recommendation = await prisma.recommendation.create({
            data: {
                userId,
                attemptId: attemptId || null,
                title,
                subjectName,
                topicNames: JSON.stringify(targetTopicNames),
                difficulty,
                questionCount,
                estimatedTime,
                reason,
                status: 'PENDING',
            },
        });
        // Run AI analysis asynchronously in background to enrich recommendations
        AIService.analyzeStudentPerformance(userId, attemptId).catch((err) => {
            console.warn('Background AI analysis notice:', err);
        });
        return recommendation;
    }
    /**
     * Alias for generateNextBestPractice for backward compatibility.
     */
    static async generateActiveRecommendation(userId, attemptId) {
        return this.generateNextBestPractice(userId, attemptId);
    }
    /**
     * Retrieves the current active recommendation for the student.
     */
    static async getActiveRecommendation(userId) {
        let rec = await prisma.recommendation.findFirst({
            where: { userId, status: 'PENDING' },
            orderBy: { createdAt: 'desc' },
        });
        if (!rec) {
            // Generate one if none exists
            rec = await this.generateNextBestPractice(userId);
        }
        return {
            ...rec,
            topicNames: typeof rec.topicNames === 'string' ? JSON.parse(rec.topicNames) : rec.topicNames,
        };
    }
}
