import { prisma } from '../config/db.js';
import { AnalyticsService } from '../services/analytics/analyticsService.js';
import { GeminiQuestionService } from '../services/ai/geminiQuestionService.js';
import { generateQuestionHash } from '../utils/questionHash.js';
export class AdminController {
    /**
     * Retrieves live, database-calculated platform statistics for the Admin Dashboard.
     */
    static async getDashboardStats(req, res) {
        try {
            const [totalUsers, totalQuestions, totalTests, totalExams, totalAttempts, totalTopicAttempts, totalExamAttempts,] = await Promise.all([
                prisma.user.count({
                    where: {
                        role: 'USER',
                        status: { notIn: ['Deleted', 'DELETED', 'ARCHIVED'] },
                    },
                }),
                prisma.question.count(),
                prisma.test.count({
                    where: {
                        type: 'TOPIC_TEST',
                        status: 'ACTIVE',
                    },
                }),
                prisma.exam.count({
                    where: {
                        status: { notIn: ['Deleted', 'DELETED', 'ARCHIVED'] },
                    },
                }),
                prisma.testAttempt.count({
                    where: { isCompleted: true },
                }),
                prisma.testAttempt.count({
                    where: {
                        isCompleted: true,
                        OR: [
                            { topicId: { not: null } },
                            { test: { type: 'TOPIC_TEST' } },
                        ],
                    },
                }),
                prisma.testAttempt.count({
                    where: {
                        isCompleted: true,
                        OR: [
                            { stageId: { not: null } },
                            { test: { type: { in: ['FULL_MOCK', 'SECTIONAL'] } } },
                            { AND: [{ topicId: null }, { testId: null }] },
                        ],
                    },
                }),
            ]);
            res.status(200).json({
                success: true,
                totalUsers,
                totalQuestions,
                totalTests,
                totalExams,
                totalAttempts,
                totalTopicAttempts,
                totalExamAttempts,
            });
        }
        catch (error) {
            console.error('[AdminController.getDashboardStats] Error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch admin dashboard statistics from database.',
            });
        }
    }
    static async getUsers(req, res) {
        try {
            const users = await prisma.user.findMany({
                where: {
                    role: 'USER',
                    status: { notIn: ['Deleted', 'DELETED', 'ARCHIVED'] },
                },
                include: {
                    testAttempts: {
                        where: { isCompleted: true },
                        select: { score: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            const formatted = users.map((u) => {
                const attemptsCount = u.testAttempts.length;
                const avgScore = attemptsCount > 0
                    ? Math.round((u.testAttempts.reduce((sum, a) => sum + a.score, 0) / attemptsCount) * 10) / 10
                    : 0;
                return {
                    id: u.id,
                    name: u.name,
                    email: u.email,
                    phone: u.phone,
                    role: u.role,
                    targetExam: u.targetExam,
                    targetYear: u.targetYear,
                    category: u.category,
                    state: u.state,
                    qualification: u.qualification,
                    gender: u.gender,
                    dob: u.dob,
                    preferredLanguage: u.preferredLanguage,
                    status: u.status,
                    joinedDate: u.joinedDate || 'Recent',
                    createdAt: u.createdAt,
                    testsAttempted: attemptsCount,
                    averageScore: avgScore,
                };
            });
            res.status(200).json({ success: true, users: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch users.' });
        }
    }
    static async getUserDetails(req, res) {
        try {
            const { id } = req.params;
            const user = await prisma.user.findUnique({
                where: { id },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    phone: true,
                    role: true,
                    targetExam: true,
                    targetYear: true,
                    category: true,
                    state: true,
                    qualification: true,
                    gender: true,
                    dob: true,
                    preferredLanguage: true,
                    status: true,
                    joinedDate: true,
                    avatarUrl: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });
            if (!user) {
                res.status(404).json({ success: false, message: 'User not found.' });
                return;
            }
            // Fetch all attempts for this user with test, stage, topic, subject relations
            const attempts = await prisma.testAttempt.findMany({
                where: { userId: id },
                include: {
                    test: {
                        select: {
                            type: true,
                            title: true,
                            difficulty: true,
                            totalQuestions: true,
                            durationMinutes: true,
                        },
                    },
                    stage: {
                        select: {
                            id: true,
                            name: true,
                            code: true,
                            paperName: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            });
            // Separate into official Exam attempts vs Topic-based Test attempts
            const examAttempts = attempts.filter((a) => a.stageId !== null || a.test?.type === 'FULL_MOCK' || a.test?.type === 'SECTIONAL' || (a.topicId === null && a.test?.type !== 'TOPIC_TEST')).map((a) => ({
                id: a.id,
                testId: a.testId,
                stageId: a.stageId,
                examName: a.examName,
                stageName: a.stageName || a.stage?.name || 'Main Exam',
                testTitle: a.testTitle,
                attemptNumber: a.attemptNumber,
                score: a.score,
                totalMarks: a.totalMarks,
                accuracy: a.accuracy,
                totalQuestions: a.totalQuestions,
                attemptedQuestions: a.attemptedQuestions,
                correctAnswers: a.correctAnswers,
                incorrectAnswers: a.incorrectAnswers,
                skippedQuestions: a.skippedQuestions,
                durationSeconds: a.durationSeconds,
                isCompleted: a.isCompleted,
                status: a.status,
                startedAt: a.startedAt || a.startTime,
                submittedAt: a.submittedAt || a.endTime || a.createdAt,
            }));
            const topicAttempts = attempts.filter((a) => a.topicId !== null || a.test?.type === 'TOPIC_TEST').map((a) => ({
                id: a.id,
                testId: a.testId,
                topicId: a.topicId,
                examName: a.examName,
                subjectName: a.subjectName || 'General',
                topicName: a.topicName || a.testTitle,
                testTitle: a.testTitle,
                attemptNumber: a.attemptNumber,
                score: a.score,
                totalMarks: a.totalMarks || 50,
                accuracy: a.accuracy,
                totalQuestions: a.totalQuestions || 50,
                attemptedQuestions: a.attemptedQuestions,
                correctAnswers: a.correctAnswers,
                incorrectAnswers: a.incorrectAnswers,
                skippedQuestions: a.skippedQuestions,
                durationSeconds: a.durationSeconds,
                isCompleted: a.isCompleted,
                status: a.status,
                startedAt: a.startedAt || a.startTime,
                submittedAt: a.submittedAt || a.endTime || a.createdAt,
            }));
            // Fetch topic performance analytics
            const topicPerformances = await prisma.studentTopicPerformance.findMany({
                where: { userId: id },
                include: {
                    topic: {
                        include: { subject: true },
                    },
                },
                orderBy: { weaknessScore: 'desc' },
            });
            const completedAttempts = attempts.filter((a) => a.isCompleted);
            const totalScoreSum = completedAttempts.reduce((sum, a) => sum + a.score, 0);
            const totalAccuracySum = completedAttempts.reduce((sum, a) => sum + a.accuracy, 0);
            const averageScore = completedAttempts.length > 0
                ? Math.round((totalScoreSum / completedAttempts.length) * 10) / 10
                : 0;
            const averageAccuracy = completedAttempts.length > 0
                ? Math.round((totalAccuracySum / completedAttempts.length) * 10) / 10
                : 0;
            const strongTopics = topicPerformances
                .filter((p) => p.accuracyRate >= 70 || p.status === 'STRONG')
                .map((p) => ({
                topicName: p.topic.name,
                subjectName: p.topic.subject.name,
                accuracyRate: Math.round(p.accuracyRate * 10) / 10,
                totalAttempted: p.totalAttempted,
                status: p.status,
            }));
            const weakTopics = topicPerformances
                .filter((p) => p.accuracyRate < 50 || p.status === 'NEEDS_ATTENTION' || p.weaknessScore >= 50)
                .map((p) => ({
                topicName: p.topic.name,
                subjectName: p.topic.subject.name,
                accuracyRate: Math.round(p.accuracyRate * 10) / 10,
                weaknessScore: Math.round(p.weaknessScore * 10) / 10,
                totalAttempted: p.totalAttempted,
                status: p.status,
            }));
            res.status(200).json({
                success: true,
                user,
                summary: {
                    totalExamAttempts: examAttempts.length,
                    totalTopicAttempts: topicAttempts.length,
                    totalAttempts: attempts.length,
                    completedAttemptsCount: completedAttempts.length,
                    averageScore,
                    averageAccuracy,
                    strongTopics,
                    weakTopics,
                },
                examAttempts,
                topicAttempts,
            });
        }
        catch (error) {
            console.error('[AdminController.getUserDetails] Error:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch user details.' });
        }
    }
    static async updateUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const updated = await prisma.user.update({
                where: { id },
                data: { status: status || 'Active' },
            });
            res.status(200).json({
                success: true,
                message: `User status updated to ${updated.status}.`,
                user: updated,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to update user status.' });
        }
    }
    static async getQuestions(req, res) {
        try {
            const questions = await prisma.question.findMany({
                include: {
                    topic: true,
                    subject: true,
                    exam: true,
                },
                orderBy: { createdAt: 'desc' },
            });
            const formatted = questions.map((q) => ({
                id: q.id,
                examId: q.examId,
                examName: q.exam.name,
                subjectId: q.subjectId,
                subject: q.subject.name,
                sectionName: q.subject.name,
                topicId: q.topicId,
                topicName: q.topic.name,
                questionText: q.questionText,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                correctOption: q.correctOption,
                explanation: q.explanation,
                difficulty: q.difficulty,
                status: q.status,
                source: q.source || 'GovPrep Expert Team',
                generationModel: q.generationModel || null,
                questionHash: q.questionHash || null,
                createdAt: q.createdAt.toISOString(),
            }));
            res.status(200).json({ success: true, questions: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch questions.' });
        }
    }
    static async createQuestion(req, res) {
        try {
            const { examId, subjectId, topicId, questionText, options, correctOption, explanation, difficulty, status, source, } = req.body;
            if (!questionText || !options || !correctOption) {
                res.status(400).json({ success: false, message: 'Question text, options, and correct answer are required.' });
                return;
            }
            let eId = examId;
            let sId = subjectId;
            let tId = topicId;
            if (!eId || !sId || !tId) {
                const defaultTopic = await prisma.topic.findFirst({
                    include: { subject: { include: { exam: true } } },
                });
                if (defaultTopic) {
                    tId = tId || defaultTopic.id;
                    sId = sId || defaultTopic.subjectId;
                    eId = eId || defaultTopic.subject.examId;
                }
            }
            const newQ = await prisma.question.create({
                data: {
                    examId: eId,
                    subjectId: sId,
                    topicId: tId,
                    questionText: questionText.trim(),
                    options: typeof options === 'string' ? options : JSON.stringify(options),
                    correctOption,
                    explanation: explanation || '',
                    difficulty: difficulty || 'MEDIUM',
                    status: status || 'APPROVED',
                    source: source || 'GovPrep Admin Team',
                },
                include: { topic: true, subject: true, exam: true },
            });
            res.status(201).json({
                success: true,
                message: 'Question created successfully.',
                question: {
                    id: newQ.id,
                    examName: newQ.exam.name,
                    subject: newQ.subject.name,
                    topicName: newQ.topic.name,
                    questionText: newQ.questionText,
                    options: JSON.parse(newQ.options),
                    correctOption: newQ.correctOption,
                    explanation: newQ.explanation,
                    difficulty: newQ.difficulty,
                    status: newQ.status,
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to create question.' });
        }
    }
    static async updateQuestion(req, res) {
        try {
            const { id } = req.params;
            const { questionText, options, correctOption, explanation, difficulty, status, topicId, } = req.body;
            const updated = await prisma.question.update({
                where: { id },
                data: {
                    ...(questionText && { questionText: questionText.trim() }),
                    ...(options && { options: typeof options === 'string' ? options : JSON.stringify(options) }),
                    ...(correctOption && { correctOption }),
                    ...(explanation !== undefined && { explanation }),
                    ...(difficulty && { difficulty }),
                    ...(status && { status }),
                    ...(topicId && { topicId }),
                },
                include: { topic: true, subject: true, exam: true },
            });
            res.status(200).json({
                success: true,
                message: 'Question updated successfully.',
                question: {
                    id: updated.id,
                    questionText: updated.questionText,
                    options: JSON.parse(updated.options),
                    correctOption: updated.correctOption,
                    explanation: updated.explanation,
                    difficulty: updated.difficulty,
                    status: updated.status,
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to update question.' });
        }
    }
    static async deleteQuestion(req, res) {
        try {
            const { id } = req.params;
            await prisma.question.delete({ where: { id } });
            res.status(200).json({ success: true, message: 'Question deleted successfully.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to delete question.' });
        }
    }
    static async getAnalytics(req, res) {
        try {
            const analytics = await AnalyticsService.getAdminAnalytics();
            res.status(200).json({ success: true, analytics });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch admin analytics.' });
        }
    }
    // ==========================================
    // EXAM CONFIGURATION & STAGE MANAGEMENT
    // ==========================================
    static async getExamStages(req, res) {
        try {
            const stages = await prisma.examStage.findMany({
                include: {
                    exam: true,
                    sections: {
                        orderBy: { order: 'asc' },
                    },
                },
                orderBy: [{ examId: 'asc' }, { order: 'asc' }],
            });
            const formatted = stages.map((s) => ({
                id: s.id,
                examId: s.examId,
                examName: s.exam.name,
                examCode: s.exam.code,
                code: s.code,
                name: s.name,
                paperName: s.paperName,
                description: s.description,
                durationMinutes: s.durationMinutes,
                scribeDurationMinutes: s.scribeDurationMinutes,
                totalQuestions: s.totalQuestions,
                totalMarks: s.totalMarks,
                marksPerQuestion: s.marksPerQuestion,
                negativeMarks: s.negativeMarks,
                questionType: s.questionType,
                language: s.language,
                isQualifying: s.isQualifying,
                isMerit: s.isMerit,
                isScreening: s.isScreening,
                notificationReference: s.notificationReference,
                notificationYear: s.notificationYear,
                lastVerifiedAt: s.lastVerifiedAt,
                status: s.status,
                sections: s.sections,
            }));
            res.status(200).json({ success: true, stages: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch exam stages.' });
        }
    }
    static async updateExamStage(req, res) {
        try {
            const { id } = req.params;
            const { name, paperName, durationMinutes, scribeDurationMinutes, totalQuestions, totalMarks, marksPerQuestion, negativeMarks, isQualifying, isMerit, isScreening, notificationReference, notificationYear, status, } = req.body;
            const updated = await prisma.examStage.update({
                where: { id },
                data: {
                    ...(name && { name }),
                    ...(paperName !== undefined && { paperName }),
                    ...(durationMinutes !== undefined && { durationMinutes: Number(durationMinutes) }),
                    ...(scribeDurationMinutes !== undefined && { scribeDurationMinutes: Number(scribeDurationMinutes) }),
                    ...(totalQuestions !== undefined && { totalQuestions: Number(totalQuestions) }),
                    ...(totalMarks !== undefined && { totalMarks: Number(totalMarks) }),
                    ...(marksPerQuestion !== undefined && { marksPerQuestion: Number(marksPerQuestion) }),
                    ...(negativeMarks !== undefined && { negativeMarks: Number(negativeMarks) }),
                    ...(isQualifying !== undefined && { isQualifying: Boolean(isQualifying) }),
                    ...(isMerit !== undefined && { isMerit: Boolean(isMerit) }),
                    ...(isScreening !== undefined && { isScreening: Boolean(isScreening) }),
                    ...(notificationReference !== undefined && { notificationReference }),
                    ...(notificationYear !== undefined && { notificationYear: Number(notificationYear) }),
                    ...(status && { status }),
                    lastVerifiedAt: new Date(),
                },
                include: { exam: true, sections: true },
            });
            res.status(200).json({
                success: true,
                message: `Exam stage configuration updated successfully.`,
                stage: updated,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to update exam stage.' });
        }
    }
    // ==========================================
    // QUESTION POOL HEALTH & EXAM METRICS
    // ==========================================
    static async getQuestionPoolHealth(req, res) {
        try {
            const exams = await prisma.exam.findMany({
                include: {
                    stages: {
                        include: {
                            sections: {
                                include: { subject: true },
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                    subjects: {
                        include: {
                            topics: true,
                            questions: true,
                        },
                    },
                    questions: true,
                },
            });
            const poolData = exams.map((exam) => {
                const totalQuestionsInBank = exam.questions.length;
                const verifiedCount = exam.questions.filter((q) => q.source !== 'AI_GENERATED').length;
                const aiGeneratedCount = exam.questions.filter((q) => q.source === 'AI_GENERATED').length;
                const stagesHealth = exam.stages.map((stg) => {
                    const requiredPerAttempt = stg.totalQuestions;
                    const sectionBreakdowns = stg.sections.map((sec) => {
                        const subjectQuestions = exam.questions.filter((q) => q.subjectId === sec.subjectId || (sec.subject && q.subjectId === sec.subject.id));
                        const verified = subjectQuestions.filter((q) => q.source !== 'AI_GENERATED').length;
                        const ai = subjectQuestions.filter((q) => q.source === 'AI_GENERATED').length;
                        const shortfall = Math.max(0, sec.questionCount - (verified + ai));
                        return {
                            sectionId: sec.id,
                            sectionName: sec.name,
                            requiredCount: sec.questionCount,
                            availableTotal: subjectQuestions.length,
                            verifiedCount: verified,
                            aiGeneratedCount: ai,
                            shortfallToGenerate: shortfall,
                        };
                    });
                    const totalAvailableForStage = sectionBreakdowns.reduce((s, b) => s + b.availableTotal, 0);
                    const totalShortfall = sectionBreakdowns.reduce((s, b) => s + b.shortfallToGenerate, 0);
                    return {
                        stageId: stg.id,
                        stageCode: stg.code,
                        stageName: stg.name,
                        requiredPerAttempt,
                        totalAvailable: totalAvailableForStage,
                        aiGenerationRequired: totalShortfall,
                        sections: sectionBreakdowns,
                    };
                });
                return {
                    examId: exam.id,
                    examName: exam.name,
                    examSlug: exam.slug,
                    totalQuestionsInBank,
                    verifiedCount,
                    aiGeneratedCount,
                    stages: stagesHealth,
                };
            });
            res.status(200).json({ success: true, poolHealth: poolData });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch question pool health.' });
        }
    }
    static async syncTests(req, res) {
        try {
            const { TestSyncService } = await import('../services/test/testSyncService');
            await TestSyncService.syncAllTests();
            res.status(200).json({
                success: true,
                message: 'All 30 topic tests and official exams synchronized successfully with 50 questions each.',
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to sync tests.' });
        }
    }

    /**
     * Admin Bulk AI Question Generator endpoint.
     * Generates questions with Gemini, validates schema, deduplicates with SHA-256 fingerprint,
     * and persists directly to PostgreSQL.
     */
    static async generateQuestionsBulk(req, res) {
        try {
            const {
                examId,
                examSlug,
                subjectId,
                topicId,
                count = 10,
                difficulty = 'MEDIUM',
                batchSize = 5,
                status = 'PUBLISHED',
                strictAi = false,
            } = req.body || {};

            const requestedCount = Math.max(1, Math.min(100, parseInt(String(count), 10) || 10));
            const effectiveBatchSize = Math.max(1, Math.min(10, parseInt(String(batchSize), 10) || 5));

            // 1. Resolve Exam
            let exam = null;
            if (examId) {
                exam = await prisma.exam.findUnique({
                    where: { id: examId },
                    include: { subjects: { include: { topics: true } } },
                });
            } else if (examSlug) {
                exam = await prisma.exam.findUnique({
                    where: { slug: examSlug },
                    include: { subjects: { include: { topics: true } } },
                });
            }

            if (!exam) {
                exam = await prisma.exam.findFirst({
                    include: { subjects: { include: { topics: true } } },
                });
            }

            if (!exam) {
                return res.status(404).json({ success: false, message: 'No examination blueprint found in database.' });
            }

            // 2. Resolve Subject
            let subject = null;
            if (subjectId) {
                subject = exam.subjects.find((s) => s.id === subjectId) || (await prisma.subject.findUnique({ where: { id: subjectId }, include: { topics: true } }));
            }
            if (!subject && exam.subjects.length > 0) {
                subject = exam.subjects[0];
            }

            if (!subject) {
                return res.status(404).json({ success: false, message: 'No subject found for this exam.' });
            }

            // 3. Resolve Topic(s)
            let targetTopics = [];
            if (topicId && topicId !== 'ALL' && topicId !== 'all') {
                const matchedTopic = subject.topics.find((t) => t.id === topicId) || (await prisma.topic.findUnique({ where: { id: topicId } }));
                if (matchedTopic) {
                    targetTopics = [matchedTopic];
                }
            }
            if (targetTopics.length === 0) {
                targetTopics = subject.topics.length > 0 ? subject.topics : [
                    await prisma.topic.create({
                        data: {
                            subjectId: subject.id,
                            name: 'General Syllabus',
                            slug: `${subject.slug || 'subject'}-general-${Date.now()}`,
                        },
                    })
                ];
            }

            // 4. Load existing hashes for deduplication
            const existingQuestions = await prisma.question.findMany({
                where: {
                    OR: [
                        { examId: exam.id },
                        { subjectId: subject.id },
                    ],
                },
                select: { questionText: true, questionHash: true },
            });

            const existingHashes = new Set(existingQuestions.map((q) => q.questionHash).filter(Boolean));
            const existingTexts = existingQuestions.map((q) => q.questionText).filter(Boolean);

            const telemetry = {
                requested: requestedCount,
                generated: 0,
                validated: 0,
                saved: 0,
                duplicatesSkipped: 0,
                rejected: 0,
                errors: [],
            };

            const createdQuestions = [];
            let remainingToGenerate = requestedCount;
            let topicIndex = 0;

            while (remainingToGenerate > 0 && telemetry.errors.length < 5) {
                const currentTopic = targetTopics[topicIndex % targetTopics.length];
                topicIndex++;

                const currentBatchCount = Math.min(remainingToGenerate, effectiveBatchSize);

                try {
                    const batchResult = await GeminiQuestionService.generateQuestions({
                        examName: exam.name,
                        examSlug: exam.slug,
                        subjectName: subject.name,
                        topicName: currentTopic.name,
                        difficulty: difficulty === 'ALL' ? (topicIndex % 3 === 0 ? 'HARD' : topicIndex % 2 === 0 ? 'MEDIUM' : 'EASY') : difficulty,
                        questionCount: currentBatchCount,
                        excludedQuestions: existingTexts.slice(-30),
                        excludedHashes: existingHashes,
                        strictAiOnly: Boolean(strictAi),
                    });

                    telemetry.generated += batchResult.length;

                    for (const q of batchResult) {
                        if (createdQuestions.length >= requestedCount) break;

                        const qHash = q.questionHash || generateQuestionHash(q.questionText, q.options);
                        if (existingHashes.has(qHash)) {
                            telemetry.duplicatesSkipped++;
                            continue;
                        }

                        telemetry.validated++;

                        const saved = await prisma.question.create({
                            data: {
                                examId: exam.id,
                                subjectId: subject.id,
                                topicId: currentTopic.id,
                                questionText: q.questionText.trim(),
                                options: typeof q.options === 'string' ? q.options : JSON.stringify(q.options),
                                correctOption: q.correctOption,
                                explanation: q.explanation || '',
                                difficulty: q.difficulty || 'MEDIUM',
                                subtopic: q.subtopic || currentTopic.name,
                                status: status || 'PUBLISHED',
                                source: 'AI_GENERATED',
                                generationModel: q.generationModel || 'gemini-3.5-flash-lite',
                                generationPromptVersion: q.generationPromptVersion || 'govprep-gemini-v2.5',
                                questionHash: qHash,
                            },
                            include: { exam: true, subject: true, topic: true },
                        });

                        existingHashes.add(qHash);
                        existingTexts.push(saved.questionText);
                        createdQuestions.push({
                            id: saved.id,
                            examName: saved.exam.name,
                            subjectName: saved.subject.name,
                            topicName: saved.topic.name,
                            questionText: saved.questionText,
                            options: JSON.parse(saved.options),
                            correctOption: saved.correctOption,
                            explanation: saved.explanation,
                            difficulty: saved.difficulty,
                            status: saved.status,
                            source: saved.source,
                            generationModel: saved.generationModel,
                            createdAt: saved.createdAt.toISOString(),
                        });

                        telemetry.saved++;
                        remainingToGenerate--;
                    }
                } catch (err) {
                    console.error('[AdminController.generateQuestionsBulk] Batch error:', err);
                    telemetry.errors.push(err.message);
                    if (strictAi) {
                        break;
                    }
                }
            }

            const totalStored = await prisma.question.count();

            return res.status(telemetry.saved > 0 ? 200 : (telemetry.errors.length > 0 ? 500 : 200)).json({
                success: telemetry.saved > 0,
                message: telemetry.saved > 0
                    ? `Successfully generated, validated and saved ${telemetry.saved} questions to PostgreSQL.`
                    : `Failed to generate questions: ${telemetry.errors.join(', ')}`,
                telemetry,
                totalStoredQuestions: totalStored,
                questions: createdQuestions,
            });
        } catch (error) {
            console.error('[AdminController.generateQuestionsBulk] Fatal error:', error);
            return res.status(500).json({
                success: false,
                message: error.message || 'An error occurred during question bank bulk generation.',
            });
        }
    }

    /**
     * Checks Gemini AI configuration and model connectivity.
     */
    static async getGeminiModelStatus(req, res) {
        try {
            const status = await GeminiQuestionService.checkModelAvailability();
            res.status(200).json({ success: true, ...status });
        } catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to check Gemini model status.' });
        }
    }
}
