import { prisma } from '../config/db.js';
import { AdaptiveEngine } from '../services/adaptive/adaptiveEngine.js';
import { RecommendationService } from '../services/recommendation/recommendationService.js';
import { QuestionSelectionService } from '../services/question/questionSelectionService.js';
import { AIService } from '../services/ai/aiService.js';
export class TestController {
    static async getTests(req, res) {
        try {
            const { examSlug, stageId, subjectId, topicId, type, difficulty } = req.query;
            const tests = await prisma.test.findMany({
                where: {
                    status: 'ACTIVE',
                    ...(examSlug && { exam: { slug: String(examSlug) } }),
                    ...(stageId && { stageId: String(stageId) }),
                    ...(subjectId && { subjectId: String(subjectId) }),
                    ...(topicId && { topicId: String(topicId) }),
                    ...(type && type !== 'All' && {
                        type: type === 'Full Mock' ? 'FULL_MOCK' : type === 'Sectional' ? 'SECTIONAL' : type === 'Topic Test' ? 'TOPIC_TEST' : String(type)
                    }),
                    ...(difficulty && difficulty !== 'All' && { difficulty: String(difficulty).toUpperCase() }),
                },
                include: {
                    exam: true,
                    subject: true,
                    topic: {
                        include: { subject: true },
                    },
                    stage: {
                        include: {
                            sections: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                    testQuestions: {
                        include: { question: { include: { subject: true, topic: true } } },
                        orderBy: { order: 'asc' },
                    },
                },
                orderBy: [{ type: 'asc' }, { createdAt: 'desc' }],
            });
            const formatted = tests.map((t) => {
                let sections = [];
                if (t.type === 'TOPIC_TEST') {
                    const topicName = t.topic?.name || t.title.replace(' Practice Test', '');
                    sections = [
                        {
                            id: t.topicId || 'sec-topic',
                            name: topicName,
                            questionsCount: 50,
                            durationMinutes: 60,
                            marksPerQuestion: 1.0,
                            negativeMarks: 0.0,
                        },
                    ];
                }
                else if (t.stage && t.stage.sections.length > 0) {
                    sections = t.stage.sections.map((s) => ({
                        id: s.id,
                        name: s.name,
                        questionsCount: s.questionCount,
                        durationMinutes: s.durationMinutes,
                        marksPerQuestion: s.marksPerQuestion,
                        negativeMarks: s.negativeMarks,
                    }));
                }
                else {
                    const sectionMap = {};
                    for (const tq of t.testQuestions) {
                        const sName = tq.sectionName || tq.question.subject.name;
                        const sId = tq.question.subjectId;
                        if (!sectionMap[sId]) {
                            sectionMap[sId] = { id: sId, name: sName, questionsCount: 0, durationMinutes: null };
                        }
                        sectionMap[sId].questionsCount += 1;
                    }
                    sections = Object.values(sectionMap);
                }
                const displayType = t.type === 'TOPIC_TEST' ? 'Topic Test' : t.type === 'SECTIONAL' ? 'Sectional' : 'Full Mock';
                const displayDifficulty = t.difficulty.charAt(0).toUpperCase() + t.difficulty.slice(1).toLowerCase();
                return {
                    id: t.id,
                    examId: t.examId,
                    examSlug: t.exam.slug,
                    examName: t.exam.name,
                    subjectId: t.subjectId || t.topic?.subjectId || null,
                    subjectName: t.subject?.name || t.topic?.subject?.name || null,
                    topicId: t.topicId || null,
                    topicName: t.topic?.name || null,
                    stageId: t.stageId,
                    stageName: t.stage?.name,
                    title: t.title,
                    slug: t.slug,
                    type: displayType,
                    rawType: t.type,
                    difficulty: displayDifficulty,
                    totalQuestions: t.type === 'TOPIC_TEST' ? 50 : (t.totalQuestions || t.stage?.totalQuestions || 100),
                    durationMinutes: t.type === 'TOPIC_TEST' ? 60 : (t.durationMinutes || t.stage?.durationMinutes || 90),
                    scribeDurationMinutes: t.type === 'TOPIC_TEST' ? 80 : (t.stage?.scribeDurationMinutes || Math.round((t.durationMinutes || 90) * 1.33)),
                    sectionTiming: t.type === 'TOPIC_TEST' ? false : (t.stage?.sectionTiming || false),
                    totalMarks: t.type === 'TOPIC_TEST' ? 50 : (t.totalMarks || t.stage?.totalMarks || 100),
                    negativeMarkingPerQuestion: t.type === 'TOPIC_TEST' ? 0.0 : (t.negativeMarkingPerQuestion ?? t.stage?.negativeMarks ?? 0.33),
                    marksPerCorrect: t.type === 'TOPIC_TEST' ? 1.0 : (t.marksPerCorrect ?? t.stage?.marksPerQuestion ?? 1.0),
                    status: 'New',
                    notificationReference: t.stage?.notificationReference,
                    notificationYear: t.stage?.notificationYear,
                    instructions: t.instructions ? JSON.parse(t.instructions) : [],
                    sections,
                };
            });
            res.status(200).json({ success: true, tests: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch tests.' });
        }
    }
    static async getTestById(req, res) {
        try {
            const { id } = req.params;
            let test = await prisma.test.findFirst({
                where: {
                    OR: [{ id }, { slug: id }],
                },
                include: {
                    exam: true,
                    subject: true,
                    topic: {
                        include: { subject: true },
                    },
                    stage: {
                        include: {
                            sections: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                    testQuestions: {
                        include: { question: { include: { subject: true, topic: true } } },
                        orderBy: { order: 'asc' },
                    },
                },
            });
            if (!test) {
                const normId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
                const allTests = await prisma.test.findMany({
                    include: {
                        exam: true,
                        subject: true,
                        topic: { include: { subject: true } },
                        stage: { include: { sections: { orderBy: { order: 'asc' } } } },
                        testQuestions: { include: { question: { include: { subject: true, topic: true } } }, orderBy: { order: 'asc' } },
                    },
                });
                test = allTests.find(
                    (t) =>
                        t.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normId ||
                        (t.slug && t.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === normId) ||
                        (t.exam && t.exam.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === normId)
                );
            }
            if (!test) {
                res.status(404).json({ success: false, message: 'Test not found.' });
                return;
            }
            let sections = [];
            if (test.type === 'TOPIC_TEST') {
                const topicName = test.topic?.name || test.title.replace(' Practice Test', '');
                sections = [
                    {
                        id: test.topicId || 'sec-topic',
                        name: topicName,
                        questionsCount: 50,
                        durationMinutes: 60,
                        marksPerQuestion: 1.0,
                        negativeMarks: 0.0,
                    },
                ];
            }
            else if (test.stage && test.stage.sections.length > 0) {
                sections = test.stage.sections.map((s) => ({
                    id: s.id,
                    name: s.name,
                    questionsCount: s.questionCount,
                    durationMinutes: s.durationMinutes,
                    marksPerQuestion: s.marksPerQuestion,
                    negativeMarks: s.negativeMarks,
                }));
            }
            else {
                const sectionMap = {};
                for (const tq of test.testQuestions) {
                    const sName = tq.sectionName || tq.question.subject.name;
                    const sId = tq.question.subjectId;
                    if (!sectionMap[sId]) {
                        sectionMap[sId] = { id: sId, name: sName, questionsCount: 0, durationMinutes: null };
                    }
                    sectionMap[sId].questionsCount += 1;
                }
                sections = Object.values(sectionMap);
            }
            const displayType = test.type === 'TOPIC_TEST' ? 'Topic Test' : test.type === 'SECTIONAL' ? 'Sectional' : 'Full Mock';
            const displayDifficulty = test.difficulty.charAt(0).toUpperCase() + test.difficulty.slice(1).toLowerCase();
            const formatted = {
                id: test.id,
                examId: test.examId,
                examSlug: test.exam.slug,
                examName: test.exam.name,
                subjectId: test.subjectId || test.topic?.subjectId || null,
                subjectName: test.subject?.name || test.topic?.subject?.name || null,
                topicId: test.topicId || null,
                topicName: test.topic?.name || null,
                stageId: test.stageId,
                stageName: test.stage?.name,
                title: test.title,
                slug: test.slug,
                type: displayType,
                rawType: test.type,
                difficulty: displayDifficulty,
                totalQuestions: test.type === 'TOPIC_TEST' ? 50 : (test.totalQuestions || test.stage?.totalQuestions || 100),
                durationMinutes: test.type === 'TOPIC_TEST' ? 60 : (test.durationMinutes || test.stage?.durationMinutes || 90),
                scribeDurationMinutes: test.type === 'TOPIC_TEST' ? 80 : (test.stage?.scribeDurationMinutes || Math.round((test.durationMinutes || 90) * 1.33)),
                sectionTiming: test.type === 'TOPIC_TEST' ? false : (test.stage?.sectionTiming || false),
                totalMarks: test.type === 'TOPIC_TEST' ? 50 : (test.totalMarks || test.stage?.totalMarks || 100),
                negativeMarkingPerQuestion: test.type === 'TOPIC_TEST' ? 0.0 : (test.negativeMarkingPerQuestion ?? test.stage?.negativeMarks ?? 0.33),
                marksPerCorrect: test.type === 'TOPIC_TEST' ? 1.0 : (test.marksPerCorrect ?? test.stage?.marksPerQuestion ?? 1.0),
                status: 'New',
                notificationReference: test.stage?.notificationReference,
                notificationYear: test.stage?.notificationYear,
                instructions: test.instructions ? JSON.parse(test.instructions) : [
                    'Total examination time is strictly enforced by the server countdown clock.',
                    'Each question carries specified positive marks for correct answers and negative marks for wrong answers.',
                    'You can navigate between questions freely during the examination.',
                    'Answers are saved continuously in real-time to prevent any data loss.',
                ],
                sections,
            };
            res.status(200).json({ success: true, test: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch test.' });
        }
    }
    static async startTest(req, res) {
        try {
            const { id } = req.params;
            const { debugDurationSeconds, forceNew: bodyForceNew, retake } = req.body || {};
            const forceNew = bodyForceNew === true || req.query.forceNew === 'true' || retake === true;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const startedAt = new Date();
            // 1. Check if it's a practice session
            const practiceSession = await prisma.practiceSession.findUnique({
                where: { id },
                include: {
                    questions: {
                        include: { question: { include: { topic: true, subject: true, exam: true } } },
                        orderBy: { order: 'asc' },
                    },
                },
            });
            if (practiceSession) {
                let durationSeconds = practiceSession.estimatedMinutes * 60;
                if (debugDurationSeconds && process.env.NODE_ENV !== 'production') {
                    durationSeconds = Number(debugDurationSeconds);
                }

                if (!forceNew) {
                    const existingAttempt = await prisma.testAttempt.findFirst({
                        where: {
                            userId,
                            practiceSessionId: practiceSession.id,
                            isCompleted: false,
                        },
                        orderBy: { startedAt: 'desc' },
                    });

                    if (existingAttempt) {
                        const now = Date.now();
                        const hasExpired = existingAttempt.expiresAt && now >= existingAttempt.expiresAt.getTime();
                        if (hasExpired) {
                            const finalized = await TestController.internalFinalizeAttempt(existingAttempt.id, {
                                autoSubmitReason: 'TIME_EXPIRED',
                            });
                            res.status(200).json({
                                success: true,
                                isCompleted: true,
                                isExpired: true,
                                attemptId: existingAttempt.id,
                                message: 'Time is up. Your exam has been automatically submitted.',
                                score: finalized.score,
                                totalMarks: finalized.totalMarks,
                            });
                            return;
                        }

                        const remainingSeconds = existingAttempt.expiresAt
                            ? Math.max(0, Math.floor((existingAttempt.expiresAt.getTime() - now) / 1000))
                            : existingAttempt.durationSeconds;

                        const questions = practiceSession.questions.map((pq) => {
                            const q = pq.question;
                            return {
                                id: q.id,
                                sectionId: q.subjectId,
                                sectionName: q.subject.name,
                                topicId: q.topicId,
                                topicName: q.topic.name,
                                questionText: q.questionText,
                                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                                difficulty: q.difficulty,
                                examName: q.exam.name,
                                subject: q.subject.name,
                                source: q.source || 'VERIFIED',
                            };
                        });

                        res.status(200).json({
                            success: true,
                            isResumed: true,
                            attemptId: existingAttempt.id,
                            attemptNumber: existingAttempt.attemptNumber,
                            startedAt: existingAttempt.startedAt.toISOString(),
                            expiresAt: existingAttempt.expiresAt.toISOString(),
                            serverTime: new Date().toISOString(),
                            durationSeconds: existingAttempt.durationSeconds,
                            remainingSeconds,
                            tabSwitchCount: existingAttempt.tabSwitchCount || 0,
                            test: {
                                id: practiceSession.id,
                                title: practiceSession.title,
                                durationMinutes: practiceSession.estimatedMinutes,
                                sectionTiming: false,
                                totalQuestions: questions.length,
                                negativeMarkingPerQuestion: 0.0,
                                marksPerCorrect: 1.0,
                                sections: [{ id: 'adaptive', name: practiceSession.subjectName || 'Adaptive Practice', questionsCount: questions.length }],
                            },
                            questions,
                        });
                        return;
                    }
                }

                const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);
                const attempt = await prisma.testAttempt.create({
                    data: {
                        userId,
                        practiceSessionId: practiceSession.id,
                        testTitle: practiceSession.title,
                        examName: 'Adaptive Practice',
                        isCompleted: false,
                        status: 'IN_PROGRESS',
                        startTime: startedAt,
                        startedAt,
                        expiresAt,
                        durationSeconds,
                        totalQuestions: practiceSession.questions.length,
                    },
                });
                const questions = practiceSession.questions.map((pq) => {
                    const q = pq.question;
                    return {
                        id: q.id,
                        sectionId: q.subjectId,
                        sectionName: q.subject.name,
                        topicId: q.topicId,
                        topicName: q.topic.name,
                        questionText: q.questionText,
                        options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                        difficulty: q.difficulty,
                        examName: q.exam.name,
                        subject: q.subject.name,
                        source: q.source || 'VERIFIED',
                    };
                });
                res.status(200).json({
                    success: true,
                    attemptId: attempt.id,
                    attemptNumber: 1,
                    startedAt: startedAt.toISOString(),
                    expiresAt: expiresAt.toISOString(),
                    serverTime: new Date().toISOString(),
                    durationSeconds,
                    remainingSeconds: durationSeconds,
                    tabSwitchCount: 0,
                    test: {
                        id: practiceSession.id,
                        title: practiceSession.title,
                        durationMinutes: practiceSession.estimatedMinutes,
                        sectionTiming: false,
                        totalQuestions: questions.length,
                        negativeMarkingPerQuestion: 0.0,
                        marksPerCorrect: 1.0,
                        sections: [{ id: 'adaptive', name: practiceSession.subjectName || 'Adaptive Practice', questionsCount: questions.length }],
                    },
                    questions,
                });
                return;
            }
            // 2. Standard Test / Topic Test
            let test = await prisma.test.findFirst({
                where: {
                    OR: [{ id }, { slug: id }],
                },
                include: {
                    exam: true,
                    subject: true,
                    topic: { include: { subject: true } },
                    stage: {
                        include: {
                            sections: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                },
            });
            if (!test) {
                test = await prisma.test.findFirst({
                    where: {
                        OR: [{ exam: { slug: id } }, { examId: id }],
                    },
                    include: {
                        exam: true,
                        subject: true,
                        topic: { include: { subject: true } },
                        stage: {
                            include: {
                                sections: {
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                    orderBy: { createdAt: 'desc' },
                });
            }
            if (!test) {
                const normId = id.toLowerCase().replace(/[^a-z0-9]/g, '');
                const allTests = await prisma.test.findMany({
                    include: {
                        exam: true,
                        subject: true,
                        topic: { include: { subject: true } },
                        stage: {
                            include: {
                                sections: {
                                    orderBy: { order: 'asc' },
                                },
                            },
                        },
                    },
                });
                test = allTests.find(
                    (t) =>
                        t.id.toLowerCase().replace(/[^a-z0-9]/g, '') === normId ||
                        (t.slug && t.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === normId) ||
                        (t.exam && t.exam.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === normId)
                );
            }
            if (!test) {
                res.status(404).json({ success: false, message: 'Test not found.' });
                return;
            }
            const isTopicTest = test.type === 'TOPIC_TEST';
            const configuredQuestionCount = isTopicTest ? 50 : (test.totalQuestions || test.stage?.totalQuestions || 100);

            // Exact exam duration calculation: if stage has sections with sectionTiming/separateTimer, use sum of section durations
            const isSectionTimed = !isTopicTest && Boolean(test.stage?.sections && test.stage.sections.length > 0 && (test.stage.sectionTiming || test.stage.separateTimer));
            let configuredDurationMinutes = isTopicTest ? 60 : (test.durationMinutes || test.stage?.durationMinutes || 90);
            if (isSectionTimed) {
                const sumSectionMinutes = test.stage.sections.reduce((acc, s) => acc + (s.durationMinutes || 0), 0);
                if (sumSectionMinutes > 0) {
                    configuredDurationMinutes = sumSectionMinutes;
                }
            }

            const configuredNegativeMarking = isTopicTest ? 0.0 : (test.negativeMarkingPerQuestion ?? test.stage?.negativeMarks ?? 0.33);
            const configuredMarksPerCorrect = isTopicTest ? 1.0 : (test.marksPerCorrect ?? test.stage?.marksPerQuestion ?? 1.0);

            // 3. RESUME VS RETAKE: Check if user has an unfinished, active attempt
            if (!forceNew) {
                const existingAttempt = await prisma.testAttempt.findFirst({
                    where: {
                        userId,
                        testId: test.id,
                        isCompleted: false,
                        status: 'IN_PROGRESS',
                    },
                    include: {
                        stage: {
                            include: {
                                sections: { orderBy: { order: 'asc' } },
                            },
                        },
                        answers: {
                            include: {
                                question: {
                                    include: { topic: true, subject: true, exam: true },
                                },
                            },
                            orderBy: { createdAt: 'asc' },
                        },
                    },
                    orderBy: { startedAt: 'desc' },
                });

                if (existingAttempt) {
                    const now = Date.now();
                    const hasExpired = existingAttempt.expiresAt && now >= existingAttempt.expiresAt.getTime();

                    if (hasExpired) {
                        // Immediately auto-finalize expired attempt. NEVER create a fresh deadline or new attempt!
                        const finalized = await TestController.internalFinalizeAttempt(existingAttempt.id, {
                            autoSubmitReason: 'TIME_EXPIRED',
                        });
                        res.status(200).json({
                            success: true,
                            isCompleted: true,
                            isExpired: true,
                            attemptId: existingAttempt.id,
                            message: 'Time is up. Your exam has been automatically submitted.',
                            score: finalized.score,
                            totalMarks: finalized.totalMarks,
                        });
                        return;
                    }

                    const isCompleteQuestionCount = existingAttempt.answers.length === configuredQuestionCount;
                    if (!isCompleteQuestionCount) {
                        // Incomplete question snapshot reset
                        await prisma.testAttempt.update({
                            where: { id: existingAttempt.id },
                            data: {
                                isCompleted: true,
                                status: 'TIMED_OUT',
                                autoSubmitReason: 'INCOMPLETE_ATTEMPT_RESET',
                            },
                        });
                    } else {
                        // Handle section progression catch-up if candidate was away during section transition
                        let currentSecId = existingAttempt.currentSectionId;
                        let currentSecIndex = existingAttempt.currentSectionIndex ?? 0;
                        let secExpiresAt = existingAttempt.sectionExpiresAt;
                        let sectionTimingData = existingAttempt.sectionTimingData;

                        if (isSectionTimed && existingAttempt.sectionTimingData && existingAttempt.stage?.sections) {
                            try {
                                const stageSecs = existingAttempt.stage.sections;
                                const timingList = JSON.parse(existingAttempt.sectionTimingData);

                                while (secExpiresAt && now >= secExpiresAt.getTime() && currentSecIndex < stageSecs.length - 1) {
                                    if (timingList[currentSecIndex]) {
                                        timingList[currentSecIndex].isSubmitted = true;
                                        timingList[currentSecIndex].isLocked = true;
                                    }
                                    currentSecIndex += 1;
                                    const nextSec = stageSecs[currentSecIndex];
                                    currentSecId = nextSec.id;
                                    const nextDurationMs = (nextSec.durationMinutes || 30) * 60 * 1000;
                                    const nextExpMs = Math.min(secExpiresAt.getTime() + nextDurationMs, existingAttempt.expiresAt.getTime());
                                    secExpiresAt = new Date(nextExpMs);
                                    if (timingList[currentSecIndex]) {
                                        timingList[currentSecIndex].startedAt = new Date(secExpiresAt.getTime() - nextDurationMs).toISOString();
                                        timingList[currentSecIndex].expiresAt = secExpiresAt.toISOString();
                                        timingList[currentSecIndex].isLocked = false;
                                    }
                                }

                                if (secExpiresAt && now >= secExpiresAt.getTime() && currentSecIndex >= stageSecs.length - 1) {
                                    // All section timers expired -> finalize entire exam
                                    const finalized = await TestController.internalFinalizeAttempt(existingAttempt.id, {
                                        autoSubmitReason: 'TIME_EXPIRED',
                                    });
                                    res.status(200).json({
                                        success: true,
                                        isCompleted: true,
                                        isExpired: true,
                                        attemptId: existingAttempt.id,
                                        message: 'Time is up. Your exam has been automatically submitted.',
                                        score: finalized.score,
                                        totalMarks: finalized.totalMarks,
                                    });
                                    return;
                                }

                                sectionTimingData = JSON.stringify(timingList);
                                await prisma.testAttempt.update({
                                    where: { id: existingAttempt.id },
                                    data: {
                                        currentSectionIndex: currentSecIndex,
                                        currentSectionId: currentSecId,
                                        sectionExpiresAt: secExpiresAt,
                                        sectionTimingData,
                                    },
                                });
                            } catch (secErr) {
                                console.warn('Section progression catchup error on resume:', secErr.message);
                            }
                        }

                        const remainingSeconds = existingAttempt.expiresAt
                            ? Math.max(0, Math.floor((existingAttempt.expiresAt.getTime() - now) / 1000))
                            : existingAttempt.durationSeconds;
                        const sectionRemainingSeconds = secExpiresAt
                            ? Math.max(0, Math.floor((secExpiresAt.getTime() - now) / 1000))
                            : remainingSeconds;

                        const resumedQuestions = existingAttempt.answers.map((ans) => {
                            const q = ans.question;
                            let resolvedSectionId = q.subjectId;
                            let resolvedSectionName = q.subject?.name || 'General';

                            if (isTopicTest) {
                                resolvedSectionId = test.topicId || q.topicId || 'sec-topic';
                                resolvedSectionName = test.topic?.name || 'Topic Test';
                            } else if (test.stage?.sections && test.stage.sections.length > 0) {
                                const matchedSec = test.stage.sections.find((s) =>
                                    s.subjectId === q.subjectId ||
                                    s.id === q.subjectId ||
                                    (s.name && q.subject?.name && (
                                        s.name.toLowerCase().includes(q.subject.name.toLowerCase()) ||
                                        q.subject.name.toLowerCase().includes(s.name.toLowerCase())
                                    ))
                                );
                                if (matchedSec) {
                                    resolvedSectionId = matchedSec.id;
                                    resolvedSectionName = matchedSec.name;
                                }
                            }

                            return {
                                id: q.id,
                                sectionId: resolvedSectionId,
                                sectionName: resolvedSectionName,
                                topicId: q.topicId,
                                topicName: q.topic?.name || 'General',
                                questionText: q.questionText,
                                questionType: q.questionType || (test.type === 'DESCRIPTIVE' ? 'DESCRIPTIVE_ESSAY' : 'OBJECTIVE_MCQ'),
                                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                                difficulty: q.difficulty,
                                examName: test.exam?.name || 'Exam',
                                subject: q.subject?.name || 'General',
                                source: q.source || 'VERIFIED',
                            };
                        });
                        let sections = [];
                        if (isTopicTest) {
                            const topicName = test.topic?.name || test.title.replace(' Practice Test', '');
                            sections = [
                                {
                                    id: test.topicId || 'sec-topic',
                                    name: topicName,
                                    questionsCount: 50,
                                    durationMinutes: 60,
                                    marksPerQuestion: 1.0,
                                    negativeMarks: 0.0,
                                },
                            ];
                        }
                        else if (test.stage && test.stage.sections.length > 0) {
                            sections = test.stage.sections.map((s) => ({
                                id: s.id,
                                name: s.name,
                                questionsCount: s.questionCount,
                                durationMinutes: s.durationMinutes,
                                marksPerQuestion: s.marksPerQuestion,
                                negativeMarks: s.negativeMarks,
                            }));
                        }
                        else {
                            const sectionMap = {};
                            for (const q of resumedQuestions) {
                                if (!sectionMap[q.sectionId]) {
                                    sectionMap[q.sectionId] = { id: q.sectionId, name: q.sectionName, questionsCount: 0, durationMinutes: null };
                                }
                                sectionMap[q.sectionId].questionsCount += 1;
                            }
                            sections = Object.values(sectionMap);
                        }

                        res.status(200).json({
                            success: true,
                            isResumed: true,
                            attemptId: existingAttempt.id,
                            attemptNumber: existingAttempt.attemptNumber,
                            startedAt: existingAttempt.startedAt.toISOString(),
                            expiresAt: existingAttempt.expiresAt?.toISOString(),
                            currentSectionId: currentSecId,
                            currentSectionIndex: currentSecIndex,
                            sectionExpiresAt: secExpiresAt?.toISOString() || null,
                            sectionTimingData,
                            serverTime: new Date().toISOString(),
                            durationSeconds: existingAttempt.durationSeconds,
                            remainingSeconds,
                            sectionRemainingSeconds,
                            tabSwitchCount: existingAttempt.tabSwitchCount || 0,
                            test: {
                                id: test.id,
                                title: test.title,
                                topicId: test.topicId,
                                topicName: test.topic?.name,
                                subjectId: test.subjectId,
                                subjectName: test.subject?.name,
                                stageId: test.stageId,
                                stageName: test.stage?.name,
                                durationMinutes: configuredDurationMinutes,
                                sectionTiming: isSectionTimed,
                                totalQuestions: resumedQuestions.length,
                                negativeMarkingPerQuestion: configuredNegativeMarking,
                                marksPerCorrect: configuredMarksPerCorrect,
                                sections,
                            },
                            questions: resumedQuestions,
                        });
                        return;
                    }
                }
            }



            // 4. NEW ATTEMPT CREATION: Calculate Attempt Number
            const previousAttemptsCount = await prisma.testAttempt.count({
                where: {
                    userId,
                    testId: test.id,
                },
            });
            const attemptNumber = previousAttemptsCount + 1;
            let durationSeconds = configuredDurationMinutes * 60;
            if (debugDurationSeconds && process.env.NODE_ENV !== 'production') {
                durationSeconds = Number(debugDurationSeconds);
            }
            const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

            // 5. UNIQUE QUESTION SELECTION ENGINE
            const questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
                userId,
                examId: test.examId,
                stageId: test.stageId,
                subjectId: test.subjectId || test.topic?.subjectId,
                topicId: test.topicId,
                testId: test.id,
                difficulty: test.difficulty,
                questionCount: configuredQuestionCount,
            });
            if (questions.length !== configuredQuestionCount) {
                throw new Error(`Unable to prepare complete test. Required exactly ${configuredQuestionCount} questions, but prepared ${questions.length}.`);
            }

            // 6. Section Timing Setup
            let initialSectionId = null;
            let initialSectionIndex = 0;
            let initialSectionExpiresAt = null;
            let initialSectionTimingData = null;

            if (isSectionTimed && test.stage?.sections && test.stage.sections.length > 0) {
                const stageSections = test.stage.sections;
                initialSectionId = stageSections[0].id;
                initialSectionIndex = 0;
                let sec0Duration = stageSections[0].durationMinutes || 30;
                let sec0DurationMs = sec0Duration * 60 * 1000;
                if (debugDurationSeconds && process.env.NODE_ENV !== 'production') {
                    sec0DurationMs = Math.max(1000, Math.floor((Number(debugDurationSeconds) * 1000) / stageSections.length));
                }
                initialSectionExpiresAt = new Date(startedAt.getTime() + sec0DurationMs);
                const timingList = stageSections.map((sec, idx) => ({
                    sectionId: sec.id,
                    sectionCode: sec.code,
                    sectionName: sec.name,
                    durationMinutes: sec.durationMinutes,
                    startedAt: idx === 0 ? startedAt.toISOString() : null,
                    expiresAt: idx === 0 ? initialSectionExpiresAt.toISOString() : null,
                    isSubmitted: false,
                    isLocked: idx !== 0,
                }));
                initialSectionTimingData = JSON.stringify(timingList);
            }

            // 7. TRANSACTION: Atomically create TestAttempt, initial Answers snapshot & QuestionHistory records
            const attempt = await prisma.$transaction(async (tx) => {
                const createdAttempt = await tx.testAttempt.create({
                    data: {
                        userId,
                        testId: test.id,
                        stageId: test.stageId,
                        subjectId: test.subjectId || test.topic?.subjectId,
                        topicId: test.topicId,
                        topicName: test.topic?.name,
                        subjectName: test.subject?.name || test.topic?.subject?.name,
                        attemptNumber,
                        testTitle: test.title,
                        examName: test.exam.name,
                        stageName: test.stage?.name,
                        isCompleted: false,
                        status: 'IN_PROGRESS',
                        startTime: startedAt,
                        startedAt,
                        expiresAt,
                        currentSectionId: initialSectionId,
                        currentSectionIndex: initialSectionIndex,
                        sectionExpiresAt: initialSectionExpiresAt,
                        sectionTimingData: initialSectionTimingData,
                        durationSeconds,
                        totalQuestions: questions.length,
                    },
                });

                // Create immutable question snapshot answers for this attempt and mapping
                for (let i = 0; i < questions.length; i++) {
                    const q = questions[i];
                    await tx.answer.create({
                        data: {
                            attemptId: createdAttempt.id,
                            questionId: q.id,
                            selectedOption: null,
                            status: 'NOT_VISITED',
                            isCorrect: false,
                            timeSpentSeconds: 0,
                        },
                    });
                    // Record question history for this student immediately
                    await tx.questionHistory.create({
                        data: {
                            userId,
                            questionId: q.id,
                            examId: test.examId,
                            stageId: test.stageId,
                            subjectId: test.subjectId || test.topic?.subjectId,
                            topicId: test.topicId || q.topicId,
                            testId: test.id,
                            attemptId: createdAttempt.id,
                            testAttemptId: createdAttempt.id,
                            selectedOption: null,
                            isCorrect: false,
                            timeSpentSeconds: 0,
                            shownAt: startedAt,
                        },
                    });
                }
                return createdAttempt;
            });

            // 8. SERVER-SIDE DATABASE RECORD VERIFICATION
            const verifiedSavedCount = await prisma.answer.count({
                where: { attemptId: attempt.id },
            });
            if (verifiedSavedCount !== configuredQuestionCount) {
                throw new Error(`Exam preparation failed database verification: Required ${configuredQuestionCount}, but saved ${verifiedSavedCount}.`);
            }

            // 9. Format sections
            let sections = [];
            if (isTopicTest) {
                const topicName = test.topic?.name || test.title.replace(' Practice Test', '');
                sections = [
                    {
                        id: test.topicId || 'sec-topic',
                        name: topicName,
                        questionsCount: 50,
                        durationMinutes: 60,
                        marksPerQuestion: 1.0,
                        negativeMarks: 0.0,
                    },
                ];
            }
            else if (test.stage && test.stage.sections.length > 0) {
                sections = test.stage.sections.map((s) => ({
                    id: s.id,
                    name: s.name,
                    questionsCount: s.questionCount,
                    durationMinutes: s.durationMinutes,
                    marksPerQuestion: s.marksPerQuestion,
                    negativeMarks: s.negativeMarks,
                }));
            }
            else {
                const sectionMap = {};
                for (const q of questions) {
                    if (!sectionMap[q.sectionId]) {
                        sectionMap[q.sectionId] = { id: q.sectionId, name: q.sectionName, questionsCount: 0, durationMinutes: null };
                    }
                    sectionMap[q.sectionId].questionsCount += 1;
                }
                sections = Object.values(sectionMap);
            }

            res.status(200).json({
                success: true,
                isResumed: false,
                attemptId: attempt.id,
                attemptNumber: attempt.attemptNumber,
                startedAt: startedAt.toISOString(),
                expiresAt: expiresAt.toISOString(),
                currentSectionId: attempt.currentSectionId || initialSectionId,
                currentSectionIndex: attempt.currentSectionIndex ?? initialSectionIndex,
                sectionExpiresAt: (attempt.sectionExpiresAt || initialSectionExpiresAt)?.toISOString() || null,
                sectionTimingData: attempt.sectionTimingData || initialSectionTimingData,
                serverTime: new Date().toISOString(),
                durationSeconds,
                remainingSeconds: durationSeconds,
                sectionRemainingSeconds: initialSectionExpiresAt ? Math.max(0, Math.floor((initialSectionExpiresAt.getTime() - Date.now()) / 1000)) : durationSeconds,
                tabSwitchCount: 0,
                test: {
                    id: test.id,
                    title: test.title,
                    topicId: test.topicId,
                    topicName: test.topic?.name,
                    subjectId: test.subjectId,
                    subjectName: test.subject?.name,
                    stageId: test.stageId,
                    stageName: test.stage?.name,
                    durationMinutes: configuredDurationMinutes,
                    sectionTiming: isSectionTimed,
                    totalQuestions: questions.length,
                    negativeMarkingPerQuestion: configuredNegativeMarking,
                    marksPerCorrect: configuredMarksPerCorrect,
                    sections,
                },
                questions,
            });

        }
        catch (error) {
            console.error('[TestController.startTest Error]:', error.message);
            res.status(500).json({ success: false, message: error.message || 'Failed to start test.' });
        }
    }
    static async autosaveAnswer(req, res) {
        try {
            const { attemptId } = req.params;
            const { questionId, selectedOption, textAnswer, status, timeSpentSeconds } = req.body;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const attempt = await prisma.testAttempt.findUnique({
                where: { id: attemptId },
            });
            if (!attempt || attempt.userId !== userId) {
                res.status(404).json({ success: false, message: 'Test attempt not found.' });
                return;
            }
            if (attempt.isCompleted) {
                res.status(400).json({ success: false, message: 'Test attempt is already completed.' });
                return;
            }
            const now = Date.now();
            if (attempt.expiresAt && now >= attempt.expiresAt.getTime()) {
                await TestController.internalFinalizeAttempt(attempt.id, { autoSubmitReason: 'TIME_EXPIRED' });
                res.status(403).json({ success: false, error: 'EXAM_TIMED_OUT', message: 'Test time has expired. Your exam has been automatically submitted.' });
                return;
            }
            if (attempt.sectionExpiresAt && now >= attempt.sectionExpiresAt.getTime()) {
                res.status(403).json({ success: false, error: 'SECTION_TIMED_OUT', message: 'Section time has expired. Cannot modify answers in an expired section.' });
                return;
            }
            if (attempt.sectionTimingData) {
                try {
                    const timingList = JSON.parse(attempt.sectionTimingData);
                    const qObj = await prisma.question.findUnique({
                        where: { id: questionId },
                        include: { subject: true },
                    });
                    if (qObj) {
                        const matchedSection = timingList.find((s) => s.sectionId === qObj.subjectId || s.sectionName === qObj.subject?.name);
                        if (matchedSection && (matchedSection.isSubmitted || matchedSection.isLocked)) {
                            res.status(403).json({ success: false, message: 'Cannot modify answers in a submitted or locked section.' });
                            return;
                        }
                    }
                } catch (secErr) {
                    // Ignore JSON parsing errors
                }
            }
            const hasContent = Boolean(selectedOption || (textAnswer && textAnswer.trim().length > 0));
            const answerStatus = (status || (hasContent ? 'ANSWERED' : 'NOT_VISITED')).toUpperCase();
            await prisma.answer.upsert({
                where: {
                    attemptId_questionId: {
                        attemptId,
                        questionId,
                    },
                },
                update: {
                    selectedOption: selectedOption || null,
                    textAnswer: textAnswer !== undefined ? textAnswer : undefined,
                    status: answerStatus,
                    timeSpentSeconds: timeSpentSeconds || 0,
                },
                create: {
                    attemptId,
                    questionId,
                    selectedOption: selectedOption || null,
                    textAnswer: textAnswer || null,
                    status: answerStatus,
                    timeSpentSeconds: timeSpentSeconds || 0,
                },
            });
            res.status(200).json({ success: true, message: 'Answer autosaved.' });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to autosave answer.' });
        }
    }
    static async recordTabSwitch(req, res) {
        try {
            const { attemptId } = req.params;
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const attempt = await prisma.testAttempt.findUnique({
                where: { id: attemptId },
            });
            if (!attempt || attempt.userId !== userId) {
                res.status(404).json({ success: false, message: 'Attempt not found.' });
                return;
            }
            if (attempt.isCompleted) {
                res.status(200).json({
                    success: true,
                    tabSwitchCount: attempt.tabSwitchCount || 0,
                    isCompleted: true,
                    shouldSubmit: false,
                    message: 'Attempt already finished.',
                });
                return;
            }
            const updated = await prisma.testAttempt.update({
                where: { id: attemptId },
                data: {
                    tabSwitchCount: { increment: 1 },
                },
            });
            const newCount = updated.tabSwitchCount || 1;
            const shouldSubmit = newCount >= 2;
            res.status(200).json({
                success: true,
                tabSwitchCount: newCount,
                shouldSubmit,
                message: shouldSubmit
                    ? 'Second tab switch detected. Auto-submitting attempt.'
                    : 'First tab switch recorded.',
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to record tab switch.' });
        }
    }
    static async getAttemptState(req, res) {
        try {
            const { attemptId } = req.params;
            const userId = req.user?.id;
            let attempt = await prisma.testAttempt.findUnique({
                where: { id: attemptId },
                include: {
                    answers: true,
                    stage: {
                        include: {
                            sections: {
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                    test: {
                        include: {
                            topic: true,
                            subject: true,
                            testQuestions: {
                                include: { question: { include: { topic: true, subject: true } } },
                                orderBy: { order: 'asc' },
                            },
                        },
                    },
                },
            });
            if (!attempt || attempt.userId !== userId) {
                res.status(404).json({ success: false, message: 'Attempt not found.' });
                return;
            }
            const now = Date.now();

            // If attempt has expired and is not yet marked completed, finalize it automatically
            if (!attempt.isCompleted && attempt.expiresAt && now >= attempt.expiresAt.getTime()) {
                const finalized = await TestController.internalFinalizeAttempt(attempt.id, { autoSubmitReason: 'TIME_EXPIRED' });
                res.status(200).json({
                    success: true,
                    isCompleted: true,
                    isExpired: true,
                    remainingSeconds: 0,
                    attempt: {
                        id: attempt.id,
                        testId: attempt.testId,
                        isCompleted: true,
                        isExpired: true,
                        status: 'TIMED_OUT',
                        autoSubmitReason: 'TIME_EXPIRED',
                        remainingSeconds: 0,
                        sectionRemainingSeconds: 0,
                        score: finalized.score,
                        totalMarks: finalized.totalMarks,
                        serverTime: new Date().toISOString(),
                    },
                });
                return;
            }

            // Section progression catch-up if section has expired while candidate was on attempt
            if (!attempt.isCompleted && attempt.sectionTimingData && attempt.stage?.sections && attempt.sectionExpiresAt && now >= attempt.sectionExpiresAt.getTime()) {
                try {
                    const stageSecs = attempt.stage.sections;
                    const timingList = JSON.parse(attempt.sectionTimingData);
                    let currentSecIndex = attempt.currentSectionIndex ?? 0;
                    let currentSecId = attempt.currentSectionId;
                    let secExpiresAt = attempt.sectionExpiresAt;

                    while (secExpiresAt && now >= secExpiresAt.getTime() && currentSecIndex < stageSecs.length - 1) {
                        if (timingList[currentSecIndex]) {
                            timingList[currentSecIndex].isSubmitted = true;
                            timingList[currentSecIndex].isLocked = true;
                        }
                        currentSecIndex += 1;
                        const nextSec = stageSecs[currentSecIndex];
                        currentSecId = nextSec.id;
                        const nextDurationMs = (nextSec.durationMinutes || 30) * 60 * 1000;
                        const nextExpMs = Math.min(secExpiresAt.getTime() + nextDurationMs, attempt.expiresAt.getTime());
                        secExpiresAt = new Date(nextExpMs);
                        if (timingList[currentSecIndex]) {
                            timingList[currentSecIndex].startedAt = new Date(secExpiresAt.getTime() - nextDurationMs).toISOString();
                            timingList[currentSecIndex].expiresAt = secExpiresAt.toISOString();
                            timingList[currentSecIndex].isLocked = false;
                        }
                    }

                    if (secExpiresAt && now >= secExpiresAt.getTime() && currentSecIndex >= stageSecs.length - 1) {
                        const finalized = await TestController.internalFinalizeAttempt(attempt.id, { autoSubmitReason: 'TIME_EXPIRED' });
                        res.status(200).json({
                            success: true,
                            isCompleted: true,
                            isExpired: true,
                            remainingSeconds: 0,
                            attempt: {
                                id: attempt.id,
                                testId: attempt.testId,
                                isCompleted: true,
                                isExpired: true,
                                status: 'TIMED_OUT',
                                autoSubmitReason: 'TIME_EXPIRED',
                                remainingSeconds: 0,
                                sectionRemainingSeconds: 0,
                                score: finalized.score,
                                totalMarks: finalized.totalMarks,
                                serverTime: new Date().toISOString(),
                            },
                        });
                        return;
                    }

                    attempt = await prisma.testAttempt.update({
                        where: { id: attempt.id },
                        data: {
                            currentSectionIndex: currentSecIndex,
                            currentSectionId: currentSecId,
                            sectionExpiresAt: secExpiresAt,
                            sectionTimingData: JSON.stringify(timingList),
                        },
                        include: {
                            answers: true,
                            stage: { include: { sections: { orderBy: { order: 'asc' } } } },
                            test: true,
                        },
                    });
                } catch (secErr) {
                    console.warn('Section progression catchup in getAttemptState:', secErr.message);
                }
            }

            let remainingSeconds = 0;
            if (attempt.expiresAt) {
                remainingSeconds = Math.max(0, Math.floor((attempt.expiresAt.getTime() - now) / 1000));
            }
            const savedAnswers = {};
            for (const ans of attempt.answers) {
                savedAnswers[ans.questionId] = {
                    selectedOption: ans.selectedOption,
                    textAnswer: ans.textAnswer,
                    status: ans.status.toLowerCase().replace(/_/g, '-'),
                    timeSpentSeconds: ans.timeSpentSeconds,
                };
            }
            res.status(200).json({
                success: true,
                isCompleted: attempt.isCompleted,
                isExpired: false,
                expiresAt: attempt.expiresAt?.toISOString() || null,
                serverTime: new Date().toISOString(),
                remainingSeconds,
                sectionRemainingSeconds: attempt.sectionExpiresAt
                    ? Math.max(0, Math.floor((attempt.sectionExpiresAt.getTime() - now) / 1000))
                    : remainingSeconds,
                savedAnswers,
                attempt: {
                    id: attempt.id,
                    testId: attempt.testId,
                    testTitle: attempt.testTitle,
                    examName: attempt.examName,
                    stageName: attempt.stageName,
                    topicId: attempt.topicId,
                    topicName: attempt.topicName,
                    isCompleted: attempt.isCompleted,
                    status: attempt.status,
                    sectionTiming: attempt.stage?.sectionTiming || false,
                    currentSectionId: attempt.currentSectionId,
                    currentSectionIndex: attempt.currentSectionIndex ?? 0,
                    sectionExpiresAt: attempt.sectionExpiresAt?.toISOString() || null,
                    sectionTimingData: attempt.sectionTimingData,
                    sectionRemainingSeconds: attempt.sectionExpiresAt
                        ? Math.max(0, Math.floor((attempt.sectionExpiresAt.getTime() - now) / 1000))
                        : remainingSeconds,
                    startedAt: attempt.startedAt?.toISOString() || attempt.startTime.toISOString(),
                    expiresAt: attempt.expiresAt?.toISOString() || null,
                    serverTime: new Date().toISOString(),
                    remainingSeconds,
                    durationSeconds: attempt.durationSeconds,
                    tabSwitchCount: attempt.tabSwitchCount || 0,
                    autoSubmitReason: attempt.autoSubmitReason || null,
                    savedAnswers,
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch attempt state.' });
        }
    }
    static async submitSection(req, res) {
        try {
            const { attemptId, id } = req.params;
            const targetAttemptId = attemptId || req.body?.attemptId;
            const { answers, timeSpentSeconds } = req.body || {};
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }

            const attempt = await prisma.testAttempt.findUnique({
                where: { id: targetAttemptId },
                include: {
                    stage: {
                        include: {
                            sections: { orderBy: { order: 'asc' } },
                        },
                    },
                    test: true,
                },
            });

            if (!attempt || attempt.userId !== userId) {
                res.status(404).json({ success: false, message: 'Attempt not found.' });
                return;
            }

            if (attempt.isCompleted) {
                res.status(200).json({ success: true, message: 'Exam is already completed.', isCompleted: true });
                return;
            }

            const now = Date.now();
            if (attempt.expiresAt && now >= attempt.expiresAt.getTime()) {
                const finalized = await TestController.internalFinalizeAttempt(attempt.id, { autoSubmitReason: 'TIME_EXPIRED' });
                res.status(200).json({
                    success: true,
                    isCompleted: true,
                    isExpired: true,
                    message: 'Time is up. Your exam has been automatically submitted.',
                    ...finalized,
                });
                return;
            }

            // Autosave any provided answers for this section ONLY if section has not expired
            const isSectionExpired = attempt.sectionExpiresAt && now >= attempt.sectionExpiresAt.getTime();
            if (!isSectionExpired && answers && typeof answers === 'object') {
                for (const [qId, aData] of Object.entries(answers)) {
                    const hasContent = Boolean(aData.selectedOption || (aData.textAnswer && aData.textAnswer.trim().length > 0));
                    const status = (aData.status || (hasContent ? 'ANSWERED' : 'NOT_VISITED')).toUpperCase().replace(/-/g, '_');
                    await prisma.answer.upsert({
                        where: { attemptId_questionId: { attemptId: attempt.id, questionId: qId } },
                        update: {
                            selectedOption: aData.selectedOption || null,
                            textAnswer: aData.textAnswer !== undefined ? aData.textAnswer : undefined,
                            status,
                            timeSpentSeconds: aData.timeSpentSeconds || 0,
                        },
                        create: {
                            attemptId: attempt.id,
                            questionId: qId,
                            selectedOption: aData.selectedOption || null,
                            textAnswer: aData.textAnswer || null,
                            status,
                            timeSpentSeconds: aData.timeSpentSeconds || 0,
                        },
                    });
                }
            }

            const sections = attempt.stage?.sections || [];
            const currentIndex = attempt.currentSectionIndex ?? 0;
            const nextIndex = currentIndex + 1;

            let timingList = [];
            try {
                timingList = attempt.sectionTimingData ? JSON.parse(attempt.sectionTimingData) : [];
            } catch (e) {
                timingList = [];
            }

            // Mark current section as submitted and locked
            if (timingList[currentIndex]) {
                timingList[currentIndex].isSubmitted = true;
                timingList[currentIndex].isLocked = true;
            }

            if (nextIndex < sections.length) {
                // Advance to next section
                const nextSec = sections[nextIndex];
                const nextDurationMs = (nextSec.durationMinutes || 30) * 60 * 1000;
                const nextExpiresAt = new Date(Math.min(now + nextDurationMs, attempt.expiresAt ? attempt.expiresAt.getTime() : now + nextDurationMs));
                if (timingList[nextIndex]) {
                    timingList[nextIndex].startedAt = new Date(now).toISOString();
                    timingList[nextIndex].expiresAt = nextExpiresAt.toISOString();
                    timingList[nextIndex].isLocked = false;
                }

                await prisma.testAttempt.update({
                    where: { id: attempt.id },
                    data: {
                        currentSectionIndex: nextIndex,
                        currentSectionId: nextSec.id,
                        sectionExpiresAt: nextExpiresAt,
                        sectionTimingData: JSON.stringify(timingList),
                    },
                });

                res.status(200).json({
                    success: true,
                    isLastSection: false,
                    currentSectionIndex: nextIndex,
                    currentSectionId: nextSec.id,
                    currentSectionName: nextSec.name,
                    sectionDurationMinutes: nextSec.durationMinutes,
                    sectionExpiresAt: nextExpiresAt.toISOString(),
                    sectionRemainingSeconds: Math.max(0, Math.floor((nextExpiresAt.getTime() - now) / 1000)),
                    serverTime: new Date(now).toISOString(),
                    message: `Section submitted. Advanced to ${nextSec.name}.`,
                });
            } else {
                // Last section submitted -> Trigger final test submission
                const finalized = await TestController.internalFinalizeAttempt(attempt.id, {
                    autoSubmitReason: 'FINAL_SECTION_SUBMITTED',
                    submissionReason: 'FINAL_SECTION_SUBMITTED',
                    timeSpentSeconds,
                });
                res.status(200).json({
                    success: true,
                    isLastSection: true,
                    isCompleted: true,
                    message: 'Final section submitted. Exam completed.',
                    ...finalized,
                });
            }
        } catch (error) {
            console.error('[submitSection Error]:', error.message);
            res.status(500).json({ success: false, message: error.message || 'Failed to submit section.' });
        }
    }

    /**
     * Authoritative, Idempotent Exam Finalization Engine
     * Enforces hard deadlines: any answers submitted after attempt expiry are strictly discarded.
     */
    static async internalFinalizeAttempt(attemptId, options = {}) {
        const {
            autoSubmitReason,
            submissionReason,
            timeSpentSeconds,
            answers,
            isTimedOut: callerTimedOut = false,
        } = options;

        let attempt = await prisma.testAttempt.findUnique({
            where: { id: attemptId },
            include: {
                stage: { include: { sections: { orderBy: { order: 'asc' } } } },
                test: true,
                answers: { include: { question: { include: { subject: true, topic: true } } } },
            },
        });

        if (!attempt) {
            throw new Error('Test attempt not found to finalize.');
        }

        // Idempotency: if already completed and has calculated scores, return existing results safely
        if (attempt.isCompleted && attempt.score !== null && attempt.subjectBreakdown !== null) {
            return {
                attemptId: attempt.id,
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                accuracy: attempt.accuracy,
                totalQuestions: attempt.totalQuestions,
                attemptedQuestions: attempt.attemptedQuestions,
                correctAnswers: attempt.correctAnswers,
                incorrectAnswers: attempt.incorrectAnswers,
                skippedQuestions: attempt.skippedQuestions,
                status: attempt.status,
                autoSubmitReason: attempt.autoSubmitReason,
                isCompleted: true,
            };
        }

        const now = Date.now();
        const isTimedOut = callerTimedOut || (attempt.expiresAt && now >= attempt.expiresAt.getTime());

        // HARD DEADLINE ENFORCEMENT: If attempt time expired, client-submitted answers are REJECTED!
        // Only answers saved up to the deadline in the PostgreSQL database are evaluated.
        if (!isTimedOut && answers && typeof answers === 'object') {
            for (const [qId, aData] of Object.entries(answers)) {
                if (!aData) continue;
                const hasContent = Boolean(aData.selectedOption || (aData.textAnswer && aData.textAnswer.trim().length > 0));
                const status = (aData.status || (hasContent ? 'ANSWERED' : 'NOT_VISITED')).toUpperCase().replace(/-/g, '_');
                await prisma.answer.upsert({
                    where: { attemptId_questionId: { attemptId: attempt.id, questionId: qId } },
                    update: {
                        selectedOption: aData.selectedOption || null,
                        textAnswer: aData.textAnswer !== undefined ? aData.textAnswer : undefined,
                        status,
                        timeSpentSeconds: aData.timeSpentSeconds || 0,
                    },
                    create: {
                        attemptId: attempt.id,
                        questionId: qId,
                        selectedOption: aData.selectedOption || null,
                        textAnswer: aData.textAnswer || null,
                        status,
                        timeSpentSeconds: aData.timeSpentSeconds || 0,
                    },
                });
            }

            // Reload attempt with upserted answers
            attempt = await prisma.testAttempt.findUnique({
                where: { id: attemptId },
                include: {
                    stage: { include: { sections: { orderBy: { order: 'asc' } } } },
                    test: true,
                    answers: { include: { question: { include: { subject: true, topic: true } } } },
                },
            });
        }

        // Check if this is a standalone 1-question pure descriptive exam (e.g. APPSC Qualifying Essay)
        const isPureDescriptiveTest = (attempt.test?.type === 'DESCRIPTIVE' ||
            attempt.test?.slug?.includes('essay') ||
            attempt.test?.slug?.includes('qualifying-essay')) &&
            attempt.answers.length <= 2 &&
            attempt.answers.every((a) => a.question.questionType === 'DESCRIPTIVE_ESSAY');

        if (isPureDescriptiveTest) {
            let attemptedCount = 0;
            let totalAiScore = 0;
            let evaluationFeedback = '';

            for (const ansRecord of attempt.answers) {
                const textAnswer = ansRecord.textAnswer || '';
                const qTime = ansRecord.timeSpentSeconds || 0;
                const hasSubmittedText = textAnswer && textAnswer.trim().length > 0;

                let rubricRelevance = 0;
                let rubricStructure = 0;
                let rubricLanguage = 0;
                let qScore = 0;
                let notes = '';

                if (hasSubmittedText) {
                    attemptedCount++;
                    const wordCount = textAnswer.trim().split(/\s+/).filter(Boolean).length;
                    if (wordCount >= 250) {
                        const lengthRatio = Math.min(1.0, wordCount / 400);
                        rubricRelevance = Math.round((14 + 5 * lengthRatio) * 10) / 10;
                        rubricStructure = Math.round((10 + 4.5 * lengthRatio) * 10) / 10;
                        rubricLanguage = Math.round((10 + 4.5 * lengthRatio) * 10) / 10;
                    } else if (wordCount >= 80) {
                        rubricRelevance = Math.round((wordCount / 250 * 14) * 10) / 10;
                        rubricStructure = Math.round((wordCount / 250 * 10) * 10) / 10;
                        rubricLanguage = Math.round((wordCount / 250 * 10) * 10) / 10;
                    } else {
                        rubricRelevance = 4.0;
                        rubricStructure = 3.0;
                        rubricLanguage = 3.0;
                    }

                    qScore = Math.min(50.0, Math.round((rubricRelevance + rubricStructure + rubricLanguage) * 10) / 10);
                    notes = `AI-Generated Estimate (Qualifying Component — Subject to Official Rules)\n` +
                        `• Word Count: ${wordCount} words\n` +
                        `• Relevance & Forest/Environmental Knowledge: ${rubricRelevance} / 20\n` +
                        `• Structure, Argumentation & Flow: ${rubricStructure} / 15\n` +
                        `• Language, Expression & Terminology: ${rubricLanguage} / 15\n` +
                        `• Total Estimated Score: ${qScore} / 50\n` +
                        `Note: Official qualifying threshold and final marks are subject exclusively to APPSC evaluation rules.`;
                } else {
                    notes = 'AI-Generated Estimate: No descriptive answer provided. Score: 0 / 50.';
                }

                totalAiScore = qScore;
                evaluationFeedback = notes;

                await prisma.answer.update({
                    where: { id: ansRecord.id },
                    data: {
                        textAnswer,
                        status: hasSubmittedText ? 'ANSWERED' : 'SKIPPED',
                        isCorrect: false,
                        aiScore: qScore,
                        evaluationNotes: notes,
                        timeSpentSeconds: qTime,
                    },
                });
            }

            const finalReason = autoSubmitReason || submissionReason || (isTimedOut ? 'TIME_EXPIRED' : 'MANUAL');
            const finalStatus = (isTimedOut || finalReason === 'TIME_EXPIRED') ? 'TIMED_OUT' : 'COMPLETED';

            const updatedAttempt = await prisma.testAttempt.update({
                where: { id: attempt.id },
                data: {
                    isCompleted: true,
                    status: finalStatus,
                    autoSubmitReason: finalReason,
                    endTime: new Date(),
                    submittedAt: new Date(),
                    durationSeconds: timeSpentSeconds || attempt.durationSeconds || 2700,
                    totalQuestions: 1,
                    attemptedQuestions: attemptedCount,
                    correctAnswers: attemptedCount,
                    incorrectAnswers: 0,
                    skippedQuestions: attemptedCount > 0 ? 0 : 1,
                    score: totalAiScore,
                    totalMarks: 50.0,
                    accuracy: attemptedCount > 0 ? Math.round((totalAiScore / 50) * 100) : 0,
                    subjectBreakdown: JSON.stringify({
                        essay: {
                            name: 'Qualifying Essay (Environmental & Forest Subjects)',
                            total: 1,
                            attempted: attemptedCount,
                            marks: totalAiScore,
                            maxMarks: 50,
                        },
                    }),
                },
            });

            return {
                isDescriptive: true,
                attemptId: updatedAttempt.id,
                score: totalAiScore,
                totalMarks: 50.0,
                accuracy: updatedAttempt.accuracy,
                totalQuestions: 1,
                attemptedQuestions: attemptedCount,
                correctAnswers: attemptedCount,
                incorrectAnswers: 0,
                skippedQuestions: attemptedCount > 0 ? 0 : 1,
                status: finalStatus,
                autoSubmitReason: finalReason,
                evaluationNotes: evaluationFeedback,
                qualifyingNotice: 'Qualifying Component — Subject to Official Evaluation Rules',
            };
        }

        // COMPREHENSIVE SECTION-WISE SCORING ENGINE (IBPS PO Mains & Composite Exams)
        const stageSections = attempt.stage?.sections || [];
        const sectionById = {};
        const sectionBySubjectId = {};
        const sectionByName = {};

        for (const sec of stageSections) {
            sectionById[sec.id] = sec;
            if (sec.subjectId) sectionBySubjectId[sec.subjectId] = sec;
            sectionByName[sec.name.toLowerCase()] = sec;
        }

        const subjectBreakdown = {};
        const topicBreakdown = {};
        const difficultyBreakdown = {
            EASY: { total: 0, attempted: 0, correct: 0, wrong: 0 },
            MEDIUM: { total: 0, attempted: 0, correct: 0, wrong: 0 },
            HARD: { total: 0, attempted: 0, correct: 0, wrong: 0 },
        };

        // Pre-populate sections in subjectBreakdown
        for (const sec of stageSections) {
            subjectBreakdown[sec.id] = {
                sectionId: sec.id,
                sectionCode: sec.code,
                name: sec.name,
                total: 0,
                attempted: 0,
                correct: 0,
                wrong: 0,
                skipped: 0,
                marks: 0.0,
                maxMarks: sec.totalMarks || (sec.questionCount * sec.marksPerQuestion),
                marksPerQuestion: sec.marksPerQuestion,
                negativeMarks: sec.negativeMarks,
                questionType: sec.questionType,
            };
        }

        const isTopicTest = attempt.test?.type === 'TOPIC_TEST' || Boolean(attempt.topicId);
        const fallbackMarksPerCorrect = isTopicTest ? 1.0 : (attempt.test?.marksPerCorrect || attempt.stage?.marksPerQuestion || 1.0);
        const fallbackNegativeMarks = isTopicTest ? 0.0 : (attempt.test?.negativeMarkingPerQuestion ?? attempt.stage?.negativeMarks ?? 0.25);

        let totalQuestions = attempt.answers.length;
        let attemptedQuestions = 0;
        let correctAnswers = 0;
        let incorrectAnswers = 0;
        let skippedQuestions = 0;
        let totalExamScore = 0;
        let totalExamMaxMarks = 0;

        for (const ansRecord of attempt.answers) {
            const q = ansRecord.question;
            const selectedOption = ansRecord.selectedOption || null;
            const textAnswer = ansRecord.textAnswer || '';
            const qTime = ansRecord.timeSpentSeconds || 0;

            let matchedSection = sectionById[q.subjectId] ||
                sectionBySubjectId[q.subjectId] ||
                sectionByName[q.subject?.name?.toLowerCase()] ||
                null;

            const sectionKey = matchedSection ? matchedSection.id : q.subjectId;
            if (!subjectBreakdown[sectionKey]) {
                subjectBreakdown[sectionKey] = {
                    sectionId: sectionKey,
                    name: q.subject?.name || 'Section',
                    total: 0,
                    attempted: 0,
                    correct: 0,
                    wrong: 0,
                    skipped: 0,
                    marks: 0.0,
                    maxMarks: matchedSection ? matchedSection.totalMarks : 0,
                    marksPerQuestion: matchedSection ? matchedSection.marksPerQuestion : fallbackMarksPerCorrect,
                    negativeMarks: matchedSection ? matchedSection.negativeMarks : fallbackNegativeMarks,
                    questionType: matchedSection?.questionType || q.questionType || 'OBJECTIVE_MCQ',
                };
            }

            const secData = subjectBreakdown[sectionKey];
            secData.total += 1;

            if (!topicBreakdown[q.topicId]) {
                topicBreakdown[q.topicId] = { total: 0, attempted: 0, correct: 0, wrong: 0, skipped: 0, name: q.topic.name, subjectName: q.subject.name };
            }
            topicBreakdown[q.topicId].total += 1;

            const diffKey = (q.difficulty || 'MEDIUM').toUpperCase();
            if (difficultyBreakdown[diffKey]) {
                difficultyBreakdown[diffKey].total += 1;
            }

            const isDescriptiveQuestion = q.questionType === 'DESCRIPTIVE_ESSAY' ||
                matchedSection?.questionType === 'DESCRIPTIVE_ESSAY' ||
                matchedSection?.code === 'DESCRIPTIVE_ENGLISH';

            if (isDescriptiveQuestion) {
                const maxPromptMarks = matchedSection?.marksPerQuestion || 12.5;
                const hasText = textAnswer && textAnswer.trim().length > 0;
                let qScore = 0;
                let rubricNotes = '';

                if (hasText) {
                    attemptedQuestions += 1;
                    secData.attempted += 1;
                    const words = textAnswer.trim().split(/\s+/).filter(Boolean).length;
                    const isLetter = q.questionText.toLowerCase().includes('letter');

                    let rContent = 0;
                    let rFormat = 0;
                    let rLang = 0;

                    if (words >= 150) {
                        const ratio = Math.min(1.0, words / 220);
                        rContent = Math.round((maxPromptMarks * 0.40 * (0.8 + 0.2 * ratio)) * 10) / 10;
                        rFormat = Math.round((maxPromptMarks * 0.30 * (0.8 + 0.2 * ratio)) * 10) / 10;
                        rLang = Math.round((maxPromptMarks * 0.30 * (0.8 + 0.2 * ratio)) * 10) / 10;
                    } else if (words >= 50) {
                        const ratio = words / 150;
                        rContent = Math.round((maxPromptMarks * 0.40 * ratio * 0.8) * 10) / 10;
                        rFormat = Math.round((maxPromptMarks * 0.30 * ratio * 0.8) * 10) / 10;
                        rLang = Math.round((maxPromptMarks * 0.30 * ratio * 0.8) * 10) / 10;
                    } else {
                        rContent = 1.0;
                        rFormat = 1.0;
                        rLang = 1.0;
                    }

                    qScore = Math.min(maxPromptMarks, Math.round((rContent + rFormat + rLang) * 10) / 10);
                    rubricNotes = `AI-Generated Diagnostic Estimate (${isLetter ? 'Letter Writing' : 'Essay Writing'} — Transparent Rubric)\n` +
                        `• Word Count: ${words} words\n` +
                        `• Content & Relevance: ${rContent} / ${(maxPromptMarks * 0.4).toFixed(1)}\n` +
                        `• Format & Structure: ${rFormat} / ${(maxPromptMarks * 0.3).toFixed(1)}\n` +
                        `• Language & Grammar: ${rLang} / ${(maxPromptMarks * 0.3).toFixed(1)}\n` +
                        `• Estimated Score: ${qScore} / ${maxPromptMarks}\n` +
                        `Note: AI score is a diagnostic estimate based on transparent rubric; not an official IBPS score.`;
                } else {
                    skippedQuestions += 1;
                    secData.skipped += 1;
                    rubricNotes = 'AI-Generated Estimate: No written response provided. Score: 0.0.';
                }

                secData.marks += qScore;
                totalExamScore += qScore;

                await prisma.answer.update({
                    where: { id: ansRecord.id },
                    data: {
                        textAnswer,
                        status: hasText ? 'ANSWERED' : 'SKIPPED',
                        isCorrect: false,
                        aiScore: qScore,
                        evaluationNotes: rubricNotes,
                        timeSpentSeconds: qTime,
                    },
                });
            } else {
                const marksPerCorrect = matchedSection ? matchedSection.marksPerQuestion : fallbackMarksPerCorrect;
                const negativeMarks = matchedSection ? matchedSection.negativeMarks : fallbackNegativeMarks;
                let isCorrect = false;

                if (selectedOption && selectedOption === q.correctOption) {
                    isCorrect = true;
                    attemptedQuestions += 1;
                    correctAnswers += 1;
                    secData.attempted += 1;
                    secData.correct += 1;
                    secData.marks += marksPerCorrect;
                    totalExamScore += marksPerCorrect;

                    topicBreakdown[q.topicId].attempted += 1;
                    topicBreakdown[q.topicId].correct += 1;
                    if (difficultyBreakdown[diffKey]) {
                        difficultyBreakdown[diffKey].attempted += 1;
                        difficultyBreakdown[diffKey].correct += 1;
                    }
                } else if (selectedOption && selectedOption !== q.correctOption) {
                    attemptedQuestions += 1;
                    incorrectAnswers += 1;
                    secData.attempted += 1;
                    secData.wrong += 1;
                    secData.marks -= negativeMarks;
                    totalExamScore -= negativeMarks;

                    topicBreakdown[q.topicId].attempted += 1;
                    topicBreakdown[q.topicId].wrong += 1;
                    if (difficultyBreakdown[diffKey]) {
                        difficultyBreakdown[diffKey].attempted += 1;
                        difficultyBreakdown[diffKey].wrong += 1;
                    }
                } else {
                    skippedQuestions += 1;
                    secData.skipped += 1;
                    topicBreakdown[q.topicId].skipped += 1;
                }

                const ansStatus = selectedOption
                    ? 'ANSWERED'
                    : (ansRecord.status && ansRecord.status !== 'ANSWERED' ? ansRecord.status : 'NOT_ANSWERED');
                await prisma.answer.update({
                    where: { id: ansRecord.id },
                    data: {
                        selectedOption,
                        status: ansStatus,
                        isCorrect,
                        timeSpentSeconds: qTime,
                    },
                });

                await prisma.questionHistory.updateMany({
                    where: {
                        userId: attempt.userId,
                        attemptId: attempt.id,
                        questionId: q.id,
                    },
                    data: {
                        selectedOption,
                        isCorrect,
                        timeSpentSeconds: qTime,
                    },
                });
            }
        }

        for (const secKey of Object.keys(subjectBreakdown)) {
            const s = subjectBreakdown[secKey];
            s.marks = Math.max(0, Math.round(s.marks * 100) / 100);
            totalExamMaxMarks += (s.maxMarks || (s.total * (s.marksPerQuestion || 1.0)));
        }

        const finalExamScore = Math.max(0, Math.round(totalExamScore * 100) / 100);
        const overallMaxMarks = attempt.stage?.totalMarks || (totalExamMaxMarks > 0 ? totalExamMaxMarks : totalQuestions * 1.0);
        const accuracy = attemptedQuestions > 0 ? Math.round((correctAnswers / attemptedQuestions) * 1000) / 10 : 0;
        const finalReason = autoSubmitReason || submissionReason || (isTimedOut ? 'TIME_EXPIRED' : 'MANUAL');
        const finalStatus = (isTimedOut || finalReason === 'TIME_EXPIRED') ? 'TIMED_OUT' : 'COMPLETED';

        const updatedAttempt = await prisma.testAttempt.update({
            where: { id: attempt.id },
            data: {
                isCompleted: true,
                status: finalStatus,
                autoSubmitReason: finalReason,
                endTime: new Date(),
                submittedAt: new Date(),
                durationSeconds: timeSpentSeconds || attempt.durationSeconds || Math.round((Date.now() - attempt.startedAt.getTime()) / 1000),
                totalQuestions,
                attemptedQuestions,
                correctAnswers,
                incorrectAnswers,
                skippedQuestions,
                score: finalExamScore,
                totalMarks: overallMaxMarks,
                accuracy,
                subjectBreakdown: JSON.stringify(subjectBreakdown),
                topicBreakdown: JSON.stringify(topicBreakdown),
                difficultyBreakdown: JSON.stringify(difficultyBreakdown),
            },
        });

        AdaptiveEngine.updateTopicPerformanceAfterAttempt(attempt.userId, updatedAttempt.id).catch((err) => {
            console.warn('Error updating student topic performances:', err.message);
        });
        AIService.analyzeStudentPerformance(attempt.userId, updatedAttempt.id).catch((err) => {
            console.warn('Error generating AI analysis report:', err.message);
        });
        RecommendationService.generateActiveRecommendation(attempt.userId, updatedAttempt.id).catch((err) => {
            console.warn('Error generating recommendation:', err.message);
        });

        return {
            attemptId: updatedAttempt.id,
            score: finalExamScore,
            totalMarks: overallMaxMarks,
            accuracy,
            totalQuestions,
            attemptedQuestions,
            correctAnswers,
            incorrectAnswers,
            skippedQuestions,
            status: finalStatus,
            autoSubmitReason: finalReason,
            isCompleted: true,
        };
    }

    static async submitTest(req, res) {
        try {
            const { id: testId } = req.params;
            const { attemptId, answers, timeSpentSeconds, autoSubmitReason, submissionReason } = req.body || {};
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }

            // 1. Resolve test to get canonical test.id
            let resolvedTest = await prisma.test.findFirst({
                where: { OR: [{ id: testId }, { slug: testId }] },
            });
            if (!resolvedTest) {
                const norm = testId.toLowerCase().replace(/[^a-z0-9]/g, '');
                const allTests = await prisma.test.findMany();
                resolvedTest = allTests.find((t) => t.id.toLowerCase().replace(/[^a-z0-9]/g, '') === norm || (t.slug && t.slug.toLowerCase().replace(/[^a-z0-9]/g, '') === norm));
            }
            const actualTestId = resolvedTest ? resolvedTest.id : testId;

            let targetAttemptId = null;

            // 2. Validate attempt ownership and handle idempotency if already submitted
            if (attemptId) {
                const requestedAttempt = await prisma.testAttempt.findUnique({
                    where: { id: attemptId },
                });
                if (requestedAttempt && requestedAttempt.userId === userId) {
                    if (requestedAttempt.isCompleted) {
                        return res.status(200).json({
                            success: true,
                            message: 'Test already submitted.',
                            attemptId: requestedAttempt.id,
                            score: requestedAttempt.score,
                            totalMarks: requestedAttempt.totalMarks,
                            accuracy: requestedAttempt.accuracy,
                            totalQuestions: requestedAttempt.totalQuestions,
                            correctAnswers: requestedAttempt.correctAnswers,
                            incorrectAnswers: requestedAttempt.incorrectAnswers,
                            skippedQuestions: requestedAttempt.skippedQuestions,
                            autoSubmitReason: requestedAttempt.autoSubmitReason,
                            status: requestedAttempt.status,
                            isCompleted: true,
                        });
                    }
                    targetAttemptId = requestedAttempt.id;
                }
            }

            // 3. Fallback to active uncompleted attempt for this student and test
            if (!targetAttemptId) {
                const activeAttempt = await prisma.testAttempt.findFirst({
                    where: {
                        userId,
                        testId: actualTestId,
                        isCompleted: false,
                    },
                    orderBy: { startedAt: 'desc' },
                });
                if (activeAttempt) {
                    targetAttemptId = activeAttempt.id;
                } else {
                    return res.status(404).json({ success: false, message: 'Active test attempt not found to submit.' });
                }
            }

            const result = await TestController.internalFinalizeAttempt(targetAttemptId, {
                autoSubmitReason,
                submissionReason,
                timeSpentSeconds,
                answers,
            });

            res.status(200).json({
                success: true,
                message: result.status === 'TIMED_OUT'
                    ? 'Time is up. Your exam has been automatically submitted.'
                    : 'Test submitted and evaluated successfully.',
                ...result,
            });
        }
        catch (error) {
            console.error('[TestController.submitTest Error]:', error);
            res.status(500).json({ success: false, message: error.message || 'Failed to submit test.' });
        }
    }
}
