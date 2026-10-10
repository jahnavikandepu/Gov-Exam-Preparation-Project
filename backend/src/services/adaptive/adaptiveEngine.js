import { prisma } from '../../config/db.js';
/**
 * Adaptive Learning Engine for GovPrep
 * Continuously evaluates student performance across topics and generates tailored sessions.
 */
export class AdaptiveEngine {
    /**
     * Calculates weakness score for a topic using multi-factor weighting:
     * 1. Inverted Accuracy (40% weight)
     * 2. Recent Accuracy Drop (25% weight)
     * 3. High Error Rate / Incorrect penalty (20% weight)
     * 4. Recency & volume confidence factor (15% weight)
     */
    static computeWeaknessScore(data) {
        const accuracyPenalty = Math.max(0, 100 - data.accuracy);
        const recentAccuracyPenalty = Math.max(0, 100 - data.recentAccuracy);
        const errorPenalty = data.incorrectRate * 100;
        // Confidence multiplier: few attempts have lower statistical confidence
        const volumeMultiplier = Math.min(1.0, Math.max(0.6, data.attemptCount / 10));
        // Recency decay: unpracticed topics gradually shift toward needing revision
        const recencyDecay = Math.min(15, data.daysSinceLastPractice * 0.5);
        let rawScore = (accuracyPenalty * 0.40 +
            recentAccuracyPenalty * 0.25 +
            errorPenalty * 0.20 +
            recencyDecay) * volumeMultiplier;
        const score = Math.round(Math.min(100, Math.max(0, rawScore)) * 10) / 10;
        let trend = 'NEEDS_ATTENTION';
        if (data.daysSinceLastPractice > 14 && score < 50) {
            trend = 'REVISION_NEEDED';
        }
        else if (score >= 65 || (data.accuracy < 55 && data.attemptCount >= 5)) {
            trend = 'WEAK';
        }
        else if (data.recentAccuracy > data.accuracy + 5 && score >= 40) {
            trend = 'IMPROVING';
        }
        else if (score < 40 && data.accuracy >= 75) {
            trend = 'STRONG';
        }
        else {
            trend = 'NEEDS_ATTENTION';
        }
        return { score, trend };
    }
    /**
     * Evaluates and updates student topic performances directly from a test attempt ID.
     */
    static async updateTopicPerformanceAfterAttempt(userId, attemptId) {
        const answers = await prisma.answer.findMany({
            where: { attemptId },
            include: { question: true },
        });
        if (!answers || answers.length === 0)
            return;
        const formattedAnswers = answers.map((ans) => ({
            questionId: ans.questionId,
            isCorrect: ans.isCorrect,
            status: ans.status,
            timeSpentSeconds: ans.timeSpentSeconds || 0,
            selectedOption: ans.selectedOption,
        }));
        await this.updateStudentPerformance(userId, attemptId, formattedAnswers);
    }
    /**
     * Updates student topic performances based on a completed test attempt.
     */
    static async updateStudentPerformance(userId, attemptId, answers) {
        // 1. Fetch question metadata (topic, subject, exam, difficulty)
        const questionIds = answers.map((a) => a.questionId);
        const questions = await prisma.question.findMany({
            where: { id: { in: questionIds } },
            include: { topic: true, subject: true, exam: true },
        });
        const questionMap = new Map(questions.map((q) => [q.id, q]));
        // 2. Aggregate attempt metrics by topic
        const topicAggregates = {};
        for (const ans of answers) {
            const q = questionMap.get(ans.questionId);
            if (!q)
                continue;
            if (!topicAggregates[q.topicId]) {
                topicAggregates[q.topicId] = {
                    topicId: q.topicId,
                    subjectId: q.subjectId,
                    examId: q.examId,
                    attempted: 0,
                    correct: 0,
                    incorrect: 0,
                    skipped: 0,
                    totalTime: 0,
                };
            }
            const agg = topicAggregates[q.topicId];
            if (ans.status === 'ANSWERED' || ans.status === 'ANSWERED_AND_MARKED') {
                agg.attempted += 1;
                if (ans.isCorrect)
                    agg.correct += 1;
                else
                    agg.incorrect += 1;
            }
            else {
                agg.skipped += 1;
            }
            agg.totalTime += ans.timeSpentSeconds || 0;
            // 2.1 Record QuestionHistory for tracking questions seen and retention
            try {
                await prisma.questionHistory.create({
                    data: {
                        userId,
                        questionId: ans.questionId,
                        testAttemptId: attemptId,
                        selectedOption: ans.selectedOption || null,
                        isCorrect: ans.isCorrect,
                        timeSpentSeconds: ans.timeSpentSeconds || 0,
                    },
                });
            }
            catch (historyErr) {
                // Non-blocking history logging
            }
        }
        // 3. Upsert StudentTopicPerformance records
        for (const [topicId, data] of Object.entries(topicAggregates)) {
            const existing = await prisma.studentTopicPerformance.findUnique({
                where: {
                    userId_topicId: {
                        userId,
                        topicId,
                    },
                },
            });
            const newAttempted = (existing?.questionsAttempted || 0) + data.attempted;
            const newCorrect = (existing?.correctAnswers || 0) + data.correct;
            const newIncorrect = (existing?.incorrectAnswers || 0) + data.incorrect;
            const newSkipped = (existing?.skippedCount || 0) + data.skipped;
            const overallAccuracy = newAttempted > 0 ? (newCorrect / newAttempted) * 100 : 0;
            const currentAttemptAccuracy = data.attempted > 0 ? (data.correct / data.attempted) * 100 : overallAccuracy;
            // Exponential moving average for recent accuracy
            const recentAccuracy = existing
                ? Math.round((existing.recentAccuracy * 0.4 + currentAttemptAccuracy * 0.6) * 10) / 10
                : Math.round(currentAttemptAccuracy * 10) / 10;
            const avgTime = newAttempted > 0
                ? Math.round(((existing ? existing.avgTimeSeconds * existing.questionsAttempted : 0) + data.totalTime) / newAttempted)
                : 45;
            const incorrectRate = newAttempted > 0 ? newIncorrect / newAttempted : 0;
            const { score: weaknessScore, trend } = this.computeWeaknessScore({
                accuracy: overallAccuracy,
                recentAccuracy,
                incorrectRate,
                attemptCount: newAttempted,
                daysSinceLastPractice: 0,
            });
            await prisma.studentTopicPerformance.upsert({
                where: {
                    userId_topicId: {
                        userId,
                        topicId,
                    },
                },
                create: {
                    userId,
                    topicId,
                    subjectId: data.subjectId,
                    examId: data.examId,
                    questionsAttempted: newAttempted,
                    correctAnswers: newCorrect,
                    incorrectAnswers: newIncorrect,
                    skippedCount: newSkipped,
                    accuracy: Math.round(overallAccuracy * 10) / 10,
                    recentAccuracy,
                    avgTimeSeconds: avgTime,
                    trend,
                    weaknessScore,
                    lastPracticedAt: new Date(),
                },
                update: {
                    questionsAttempted: newAttempted,
                    correctAnswers: newCorrect,
                    incorrectAnswers: newIncorrect,
                    skippedCount: newSkipped,
                    accuracy: Math.round(overallAccuracy * 10) / 10,
                    recentAccuracy,
                    avgTimeSeconds: avgTime,
                    trend,
                    weaknessScore,
                    lastPracticedAt: new Date(),
                },
            });
        }
        // 4. Update overall WeaknessProfile for the user
        await this.refreshUserWeaknessProfile(userId);
    }
    /**
     * Recalculates and stores aggregate user weakness profile.
     */
    static async refreshUserWeaknessProfile(userId) {
        const performances = await prisma.studentTopicPerformance.findMany({
            where: { userId },
            include: { topic: true },
            orderBy: { weaknessScore: 'desc' },
        });
        if (performances.length === 0) {
            return;
        }
        const weakTopics = performances.filter((p) => p.trend === 'WEAK' || p.weaknessScore >= 60);
        const improvingTopics = performances.filter((p) => p.trend === 'IMPROVING');
        const strongTopics = performances.filter((p) => p.trend === 'STRONG');
        const avgScore = performances.reduce((sum, p) => sum + p.weaknessScore, 0) / performances.length;
        const priorityTopics = performances.slice(0, 3).map((p) => ({
            topicId: p.topicId,
            topicName: p.topic.name,
            weaknessScore: p.weaknessScore,
            accuracy: p.accuracy,
            recentAccuracy: p.recentAccuracy,
            trend: p.trend,
        }));
        await prisma.weaknessProfile.upsert({
            where: { userId },
            create: {
                userId,
                overallWeaknessScore: Math.round(avgScore * 10) / 10,
                weakTopicsCount: weakTopics.length,
                improvingTopicsCount: improvingTopics.length,
                strongTopicsCount: strongTopics.length,
                priorityTopics: JSON.stringify(priorityTopics),
                lastEvaluatedAt: new Date(),
            },
            update: {
                overallWeaknessScore: Math.round(avgScore * 10) / 10,
                weakTopicsCount: weakTopics.length,
                improvingTopicsCount: improvingTopics.length,
                strongTopicsCount: strongTopics.length,
                priorityTopics: JSON.stringify(priorityTopics),
                lastEvaluatedAt: new Date(),
            },
        });
    }
    /**
     * Generates a tailored adaptive practice session for the student.
     * Balances 70% weak topics, 20% medium topics, 10% strong retention topics.
     */
    static async generateSession(userId, options) {
        const questionCount = options?.desiredQuestionCount || 15;
        // 1. Fetch user topic performances
        const performances = await prisma.studentTopicPerformance.findMany({
            where: {
                userId,
                ...(options?.targetSubjectId && { subjectId: options.targetSubjectId }),
            },
            include: { topic: true },
            orderBy: { weaknessScore: 'desc' },
        });
        // 2. Classify topics
        const weakPerformances = performances.filter((p) => p.weaknessScore >= 55);
        const mediumPerformances = performances.filter((p) => p.weaknessScore >= 35 && p.weaknessScore < 55);
        const strongPerformances = performances.filter((p) => p.weaknessScore < 35);
        // If no performance records exist yet, pick default topics from approved question bank
        let targetTopicIds = [];
        let targetTopicNames = [];
        let reason = '';
        let targetSubjectName = 'Mathematics & Reasoning';
        if (weakPerformances.length > 0) {
            const topWeak = weakPerformances.slice(0, 3);
            targetTopicIds = topWeak.map((p) => p.topicId);
            targetTopicNames = topWeak.map((p) => p.topic.name);
            const accList = topWeak.map((p) => `${p.topic.name} (${p.recentAccuracy || p.accuracy}%)`).join(', ');
            reason = `Your recent accuracy in ${accList} indicates high score leakage. This session reinforces core concepts and error patterns.`;
        }
        else {
            // Pick top available topics from the database
            const sampleTopics = await prisma.topic.findMany({
                take: 3,
                include: { subject: true },
            });
            targetTopicIds = sampleTopics.map((t) => t.id);
            targetTopicNames = sampleTopics.map((t) => t.name);
            reason = 'Adaptive diagnostic baseline session to discover your strength and weakness profile.';
        }
        // Determine target difficulty
        const avgRecentAccuracy = performances.length > 0
            ? performances.reduce((sum, p) => sum + p.recentAccuracy, 0) / performances.length
            : 55;
        let targetDifficulty = 'MEDIUM';
        if (avgRecentAccuracy < 45) {
            targetDifficulty = 'EASY';
        }
        else if (avgRecentAccuracy > 75) {
            targetDifficulty = 'HARD';
        }
        // 3. Fetch past answered question IDs to avoid repeats
        const pastAnswers = await prisma.answer.findMany({
            where: { attempt: { userId } },
            select: { questionId: true },
            distinct: ['questionId'],
        });
        const pastQuestionIds = new Set(pastAnswers.map((a) => a.questionId));
        // 4. Select candidate questions from target topics
        let candidateQuestions = await prisma.question.findMany({
            where: {
                topicId: { in: targetTopicIds },
                status: { in: ['APPROVED', 'PUBLISHED'] },
            },
            include: { topic: true, subject: true, exam: true },
        });
        // Prioritize questions the student hasn't seen yet
        let unseen = candidateQuestions.filter((q) => !pastQuestionIds.has(q.id));
        // If unseen questions in weak topics are fewer than required and Gemini is configured, generate dynamic AI questions!
        const { GEMINI_CONFIG } = await import('../../config/geminiConfig');
        if (unseen.length < questionCount && GEMINI_CONFIG.isConfigured && targetTopicIds.length > 0) {
            try {
                const { GeminiQuestionService } = await import('../ai/geminiQuestionService');
                const primaryTopic = await prisma.topic.findUnique({
                    where: { id: targetTopicIds[0] },
                    include: { subject: { include: { exam: true } } },
                });
                if (primaryTopic) {
                    const neededAi = questionCount - unseen.length;
                    const aiGenerated = await GeminiQuestionService.generateQuestions({
                        examName: primaryTopic.subject.exam.name,
                        examSlug: primaryTopic.subject.exam.slug,
                        subjectName: primaryTopic.subject.name,
                        topicName: primaryTopic.name,
                        difficulty: targetDifficulty,
                        questionCount: Math.min(neededAi, 10),
                        excludedQuestions: candidateQuestions.map((q) => q.questionText).slice(0, 10),
                    });
                    for (const genQ of aiGenerated) {
                        try {
                            const saved = await prisma.question.create({
                                data: {
                                    examId: primaryTopic.subject.examId,
                                    subjectId: primaryTopic.subjectId,
                                    topicId: primaryTopic.id,
                                    questionText: genQ.questionText,
                                    options: JSON.stringify(genQ.options),
                                    correctOption: genQ.correctOption,
                                    explanation: genQ.explanation,
                                    difficulty: genQ.difficulty,
                                    subtopic: genQ.subtopic,
                                    status: 'APPROVED',
                                    source: 'AI_GENERATED',
                                    generationModel: genQ.generationModel,
                                    generationPromptVersion: genQ.generationPromptVersion,
                                    questionHash: genQ.questionHash,
                                },
                                include: { topic: true, subject: true, exam: true },
                            });
                            unseen.push(saved);
                            candidateQuestions.push(saved);
                        }
                        catch (saveErr) {
                            // continue
                        }
                    }
                }
            }
            catch (aiErr) {
                console.warn('[AdaptiveEngine] Dynamic question generation skipped:', aiErr?.message);
            }
        }
        // If still fewer than desired, fetch from all available topics
        if (candidateQuestions.length < questionCount) {
            const extraQuestions = await prisma.question.findMany({
                where: {
                    status: { in: ['APPROVED', 'PUBLISHED'] },
                    id: { notIn: candidateQuestions.map((q) => q.id) },
                },
                take: questionCount - candidateQuestions.length,
                include: { topic: true, subject: true, exam: true },
            });
            candidateQuestions = [...candidateQuestions, ...extraQuestions];
            unseen = candidateQuestions.filter((q) => !pastQuestionIds.has(q.id));
        }
        const seen = candidateQuestions.filter((q) => pastQuestionIds.has(q.id));
        const finalQuestions = [...unseen, ...seen].slice(0, questionCount);
        // 5. Create PracticeSession in DB
        const session = await prisma.practiceSession.create({
            data: {
                userId,
                title: `${targetTopicNames.slice(0, 2).join(' & ')} Adaptive Practice`,
                subjectName: targetSubjectName,
                targetTopics: JSON.stringify(targetTopicNames),
                difficulty: targetDifficulty,
                questionCount: finalQuestions.length,
                estimatedMinutes: Math.round(finalQuestions.length * 1.2),
                reason,
                status: 'GENERATED',
            },
        });
        // Create question associations
        for (let i = 0; i < finalQuestions.length; i++) {
            await prisma.practiceSessionQuestion.create({
                data: {
                    practiceSessionId: session.id,
                    questionId: finalQuestions[i].id,
                    order: i + 1,
                },
            });
        }
        return {
            session,
            questions: finalQuestions.map((q) => ({
                id: q.id,
                sectionId: q.subjectId,
                sectionName: q.subject.name,
                topicId: q.topicId,
                topicName: q.topic.name,
                questionText: q.questionText,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                // CRITICAL: Do NOT expose correctOption or explanation to students before submission!
                difficulty: q.difficulty,
                examName: q.examId,
                subject: q.subject.name,
            })),
        };
    }
}
