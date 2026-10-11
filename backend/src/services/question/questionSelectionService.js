import { prisma } from '../../config/db.js';
import { GeminiQuestionService } from '../ai/geminiQuestionService.js';
import { ExamQuestionGenerator } from './examQuestionGenerator.js';
import { generateQuestionHash } from '../../utils/questionHash.js';
export class QuestionSelectionService {
    /**
     * Retrieves unique questions for a student's attempt across topic tests and full mocks.
     * Excludes previously seen questions per student to guarantee retake uniqueness (Attempt 1 ∩ Attempt 2 = 0).
     * Generates missing questions with Gemini / calibrated engine and saves them to PostgreSQL.
     * Strictly guarantees exactly 50 questions for topic tests.
     */
    static async getUniqueQuestionsForAttempt(params) {
        let { userId, examId, stageId, subjectId, topicId, difficulty = 'MEDIUM', questionCount } = params;
        let targetTest = null;
        if (params.testId) {
            targetTest = await prisma.test.findUnique({
                where: { id: params.testId },
                include: { stage: true, exam: true, subject: true, topic: true },
            });
            if (targetTest) {
                examId = examId || targetTest.examId;
                stageId = stageId || targetTest.stageId;
                subjectId = subjectId || targetTest.subjectId || targetTest.topic?.subjectId;
                topicId = topicId || targetTest.topicId;
                if (!questionCount) {
                    questionCount = targetTest.totalQuestions || (targetTest.type === 'TOPIC_TEST' ? 50 : 100);
                }
            }
        }
        const isDescriptive = targetTest?.type === 'DESCRIPTIVE' ||
            targetTest?.slug?.includes('essay') ||
            targetTest?.slug?.includes('qualifying-essay') ||
            (questionCount === 1 && targetTest?.exam?.slug === 'appsc-fbo-abo');

        if (isDescriptive) {
            return this.getUniqueQuestionsForDescriptiveEssay({
                userId,
                examId,
                testId: targetTest?.id || params.testId,
                targetTest,
            });
        }

        const isTopicTest = targetTest?.type === 'TOPIC_TEST' || Boolean(topicId);
        if (isTopicTest) {
            return this.getUniqueQuestionsForTopicTest({
                userId,
                examId,
                testId: targetTest?.id || params.testId,
                subjectId,
                topicId,
                difficulty,
                targetTest,
            });
        }
        return this.getUniqueQuestionsForFullMock({
            userId,
            examId,
            stageId,
            testId: targetTest?.id || params.testId,
            difficulty,
            questionCount: questionCount || 100,
            targetTest,
        });
    }

    /**
     * Dedicated Question Selection Pipeline for Descriptive Essay Component (1 Question, 45 Minutes, 50 Marks).
     * Retrieves unique environmental & forest descriptive prompts avoiding recently seen prompts per student.
     */
    static async getUniqueQuestionsForDescriptiveEssay(params) {
        const { userId, examId, testId, targetTest } = params;
        const resolvedExamId = examId || targetTest?.examId;

        // 1. Fetch all descriptive questions for this exam
        const candidateQuestions = await prisma.question.findMany({
            where: {
                examId: resolvedExamId,
                OR: [
                    { questionType: 'DESCRIPTIVE_ESSAY' },
                    { subject: { slug: 'appsc-qualifying-essay' } },
                    { subject: { name: { contains: 'Essay', mode: 'insensitive' } } },
                ],
                status: 'PUBLISHED',
            },
            include: { subject: true, topic: true, exam: true },
        });

        if (candidateQuestions.length === 0) {
            throw new Error('No descriptive essay prompts found for this examination.');
        }

        // 2. Fetch prompts seen by this candidate to avoid repetition on retakes
        const seenHistories = await prisma.questionHistory.findMany({
            where: {
                userId,
                questionId: { in: candidateQuestions.map((q) => q.id) },
            },
            select: { questionId: true },
        });
        const pastAnswers = await prisma.answer.findMany({
            where: {
                attempt: { userId },
                questionId: { in: candidateQuestions.map((q) => q.id) },
            },
            select: { questionId: true },
        });

        const seenIds = new Set([
            ...seenHistories.map((h) => h.questionId),
            ...pastAnswers.map((a) => a.questionId),
        ]);

        const unseenQuestions = candidateQuestions.filter((q) => !seenIds.has(q.id));
        let selectedQuestion = null;

        if (unseenQuestions.length > 0) {
            const shuffled = this.shuffleArray(unseenQuestions);
            selectedQuestion = shuffled[0];
        } else {
            // If all prompts were already seen, randomize across all prompts
            const shuffled = this.shuffleArray(candidateQuestions);
            selectedQuestion = shuffled[0];
        }

        return [{
            id: selectedQuestion.id,
            sectionId: selectedQuestion.subjectId,
            sectionName: selectedQuestion.subject?.name || 'Qualifying Essay',
            topicId: selectedQuestion.topicId,
            topicName: selectedQuestion.topic?.name || 'Environmental & Forestry Essay Topics',
            questionText: selectedQuestion.questionText,
            questionType: 'DESCRIPTIVE_ESSAY',
            options: [],
            correctOption: 'N/A',
            explanation: selectedQuestion.explanation || 'Official qualifying essay prompt on environmental and forest subjects.',
            difficulty: selectedQuestion.difficulty,
            examName: selectedQuestion.exam?.name || 'APPSC FBO & ABO',
            subject: selectedQuestion.subject?.name || 'Qualifying Essay',
            source: selectedQuestion.source || 'OFFICIAL_BLUEPRINT',
        }];
    }
    /**
     * Dedicated Question Selection Pipeline for Topic Practice Tests (50 Questions, 60 Minutes, 0 Negative Marking).
     */
    static async getUniqueQuestionsForTopicTest(params) {
        const { userId, examId, testId, difficulty, targetTest } = params;
        let { subjectId, topicId } = params;
        const REQUIRED_COUNT = 50;
        // 1. Fetch Topic & Subject info
        let topicRecord = null;
        if (topicId) {
            topicRecord = await prisma.topic.findUnique({
                where: { id: topicId },
                include: { subject: { include: { exam: true } } },
            });
        }
        if (!topicRecord && targetTest?.topicId) {
            topicRecord = await prisma.topic.findUnique({
                where: { id: targetTest.topicId },
                include: { subject: { include: { exam: true } } },
            });
        }
        if (!topicRecord) {
            throw new Error(`Topic test requires a valid topic ID.`);
        }
        topicId = topicRecord.id;
        subjectId = topicRecord.subjectId;
        const resolvedExamId = topicRecord.subject?.examId || examId;
        const examRecord = topicRecord.subject?.exam || (await prisma.exam.findUnique({ where: { id: resolvedExamId } }));
        if (!examRecord) {
            throw new Error(`Exam not found for topic '${topicRecord.name}'.`);
        }
        // 2. Fetch all questions seen by this user for this topic/test to guarantee 100% uniqueness on retakes
        const seenHistories = await prisma.questionHistory.findMany({
            where: {
                userId,
                OR: [
                    { topicId },
                    { testId },
                    { question: { topicId } },
                ],
            },
            select: {
                questionId: true,
                question: {
                    select: {
                        questionText: true,
                        questionHash: true,
                    },
                },
            },
        });
        const pastAttemptAnswers = await prisma.answer.findMany({
            where: {
                attempt: {
                    userId,
                    OR: [
                        { topicId },
                        { testId },
                    ],
                },
            },
            select: { questionId: true },
        });
        const seenQuestionIds = new Set([
            ...seenHistories.map((h) => h.questionId),
            ...pastAttemptAnswers.map((a) => a.questionId),
        ]);
        const seenQuestionTexts = seenHistories
            .map((h) => h.question?.questionText)
            .filter((t) => Boolean(t));
        const seenQuestionHashes = new Set(seenHistories
            .map((h) => h.question?.questionHash)
            .filter((h) => Boolean(h)));
        const chosenQuestions = [];
        const chosenQuestionIds = new Set();
        const chosenHashes = new Set();
        let verifiedCount = 0;
        let aiDbCount = 0;
        let newlyGeneratedCount = 0;
        // 3. Step 1: Select Unused Verified Questions from Database for this Topic
        const unusedVerified = await prisma.question.findMany({
            where: {
                topicId,
                status: 'PUBLISHED',
                source: { not: 'AI_GENERATED' },
                id: { notIn: Array.from(seenQuestionIds) },
            },
            include: { subject: true, topic: true, exam: true },
        });
        const shuffledVerified = this.shuffleArray(unusedVerified);
        for (const q of shuffledVerified) {
            if (chosenQuestions.length < REQUIRED_COUNT && !chosenQuestionIds.has(q.id)) {
                const qHash = q.questionHash || generateQuestionHash(q.questionText, q.options);
                if (!chosenHashes.has(qHash)) {
                    chosenQuestions.push(q);
                    chosenQuestionIds.add(q.id);
                    chosenHashes.add(qHash);
                    seenQuestionIds.add(q.id);
                    verifiedCount++;
                }
            }
        }
        // 4. Step 2: Select Unused previously saved AI Questions from Database for this Topic
        if (chosenQuestions.length < REQUIRED_COUNT) {
            const unusedAi = await prisma.question.findMany({
                where: {
                    topicId,
                    status: 'PUBLISHED',
                    source: 'AI_GENERATED',
                    id: { notIn: Array.from(seenQuestionIds) },
                },
                include: { subject: true, topic: true, exam: true },
            });
            const shuffledAi = this.shuffleArray(unusedAi);
            for (const q of shuffledAi) {
                if (chosenQuestions.length < REQUIRED_COUNT && !chosenQuestionIds.has(q.id)) {
                    const qHash = q.questionHash || generateQuestionHash(q.questionText, q.options);
                    if (!chosenHashes.has(qHash)) {
                        chosenQuestions.push(q);
                        chosenQuestionIds.add(q.id);
                        chosenHashes.add(qHash);
                        seenQuestionIds.add(q.id);
                        aiDbCount++;
                    }
                }
            }
        }
        // 5. Step 3: Dynamically Generate Missing Questions via Gemini (and save to PostgreSQL)
        let shortfall = REQUIRED_COUNT - chosenQuestions.length;
        if (shortfall > 0) {
            console.log(`[QuestionSelectionService] Generating ${shortfall} questions for Topic '${topicRecord.name}' via Gemini...`);
            try {
                const generatedResults = await GeminiQuestionService.generateQuestions({
                    examName: examRecord.name,
                    examSlug: examRecord.slug,
                    subjectName: topicRecord.subject.name,
                    topicName: topicRecord.name,
                    difficulty: difficulty || 'MEDIUM',
                    questionCount: shortfall,
                    excludedQuestions: seenQuestionTexts.slice(-30),
                    excludedHashes: new Set([...seenQuestionHashes, ...chosenHashes]),
                });
                for (const genQ of generatedResults) {
                    if (chosenQuestions.length >= REQUIRED_COUNT)
                        break;
                    const qHash = genQ.questionHash || generateQuestionHash(genQ.questionText, genQ.options);
                    if (chosenHashes.has(qHash) || seenQuestionHashes.has(qHash))
                        continue;
                    // Save validated question to PostgreSQL
                    const createdQuestion = await prisma.question.create({
                        data: {
                            examId: resolvedExamId,
                            subjectId: topicRecord.subjectId,
                            topicId: topicRecord.id,
                            questionText: genQ.questionText,
                            options: JSON.stringify(genQ.options),
                            correctOption: genQ.correctOption,
                            explanation: genQ.explanation,
                            difficulty: genQ.difficulty,
                            subtopic: genQ.subtopic || topicRecord.name,
                            status: 'PUBLISHED',
                            source: 'AI_GENERATED',
                            generationModel: genQ.generationModel || 'gemini-3.5-flash-lite',
                            generationPromptVersion: genQ.generationPromptVersion || 'v2.1',
                            questionHash: qHash,
                        },
                        include: { subject: true, topic: true, exam: true },
                    });
                    chosenQuestions.push(createdQuestion);
                    chosenQuestionIds.add(createdQuestion.id);
                    chosenHashes.add(qHash);
                    seenQuestionIds.add(createdQuestion.id);
                    seenQuestionHashes.add(qHash);
                    newlyGeneratedCount++;
                }
            }
            catch (geminiError) {
                console.warn(`[QuestionSelectionService] Gemini dynamic question generation notice for Topic ${topicRecord.name}:`, geminiError.message);
            }
        }
        // 6. Step 4: Calibrated Fallback Loop to ensure exactly 50 questions are always generated
        let fallbackRetries = 0;
        while (chosenQuestions.length < REQUIRED_COUNT && fallbackRetries < 30) {
            fallbackRetries++;
            const remainingShortfall = REQUIRED_COUNT - chosenQuestions.length;
            const extraCalibrated = ExamQuestionGenerator.generateBatch({
                examName: examRecord.name,
                sectionName: topicRecord.subject.name,
                subjectName: topicRecord.subject.name,
                topicName: topicRecord.name,
                difficulty: difficulty || 'MEDIUM',
                count: remainingShortfall + 10,
                excludedHashes: new Set([...seenQuestionHashes, ...chosenHashes]),
            });
            for (const genQ of extraCalibrated) {
                if (chosenQuestions.length >= REQUIRED_COUNT)
                    break;
                const qHash = genQ.questionHash || generateQuestionHash(genQ.questionText, genQ.options);
                if (chosenHashes.has(qHash) || seenQuestionHashes.has(qHash))
                    continue;
                const createdQuestion = await prisma.question.create({
                    data: {
                        examId: resolvedExamId,
                        subjectId: topicRecord.subjectId,
                        topicId: topicRecord.id,
                        questionText: genQ.questionText,
                        options: JSON.stringify(genQ.options),
                        correctOption: genQ.correctOption,
                        explanation: genQ.explanation,
                        difficulty: genQ.difficulty,
                        subtopic: genQ.subtopic || topicRecord.name,
                        status: 'PUBLISHED',
                        source: 'AI_GENERATED',
                        generationModel: 'gemini-calibrated-engine',
                        generationPromptVersion: 'govprep-v2.1',
                        questionHash: qHash,
                    },
                    include: { subject: true, topic: true, exam: true },
                });
                chosenQuestions.push(createdQuestion);
                chosenQuestionIds.add(createdQuestion.id);
                chosenHashes.add(qHash);
                seenQuestionIds.add(createdQuestion.id);
                seenQuestionHashes.add(qHash);
                newlyGeneratedCount++;
            }
        }
        // 7. Strict 50-question requirement verification
        if (chosenQuestions.length !== REQUIRED_COUNT) {
            throw new Error(`Unable to prepare 50 questions for topic '${topicRecord.name}'. Required: 50, Prepared: ${chosenQuestions.length}.`);
        }
        console.log('\n====================================');
        console.log(`TOPIC TEST QUESTION PREPARATION`);
        console.log(`Exam: ${examRecord.name}`);
        console.log(`Topic: ${topicRecord.name}`);
        console.log(`Verified Unused: ${verifiedCount}`);
        console.log(`AI DB Unused: ${aiDbCount}`);
        console.log(`Newly Generated & Saved: ${newlyGeneratedCount}`);
        console.log(`Total Selected: ${chosenQuestions.length} / 50`);
        console.log('====================================\n');
        // 8. Map to return format
        return chosenQuestions.map((q) => {
            const parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
            return {
                id: q.id,
                sectionId: topicRecord.id,
                sectionName: topicRecord.name,
                topicId: q.topicId,
                topicName: q.topic?.name || topicRecord.name,
                questionText: q.questionText,
                options: parsedOptions,
                difficulty: q.difficulty,
                examName: examRecord.name,
                subject: topicRecord.subject.name,
                source: q.source || 'VERIFIED',
            };
        });
    }
    /**
     * Full Exam Mock Test Question Selection Pipeline (Multi-Section / Official Exam Blueprint).
     */
    static async getUniqueQuestionsForFullMock(params) {
        const { userId, examId, stageId, difficulty, questionCount, targetTest, testId } = params;
        let effectiveTest = targetTest;
        if (!effectiveTest && testId) {
            effectiveTest = await prisma.test.findUnique({ where: { id: testId } });
        }
        const exam = await prisma.exam.findUnique({
            where: { id: examId },
            include: {
                subjects: {
                    include: { topics: true },
                    orderBy: { order: 'asc' },
                },
            },
        });
        if (!exam) {
            throw new Error(`Exam not found for ID '${examId}'.`);
        }
        const stage = stageId
            ? await prisma.examStage.findUnique({
                where: { id: stageId },
                include: {
                    sections: {
                        include: { subject: { include: { topics: true } } },
                        orderBy: { order: 'asc' },
                    },
                },
            })
            : null;
        // Fetch student's seen question history for this exam/stage
        const seenHistories = await prisma.questionHistory.findMany({
            where: {
                userId,
                ...(examId ? { examId } : {}),
                ...(stageId ? { stageId } : {}),
            },
            select: {
                questionId: true,
                question: {
                    select: {
                        questionText: true,
                        questionHash: true,
                    },
                },
            },
        });
        const pastAttemptAnswers = await prisma.answer.findMany({
            where: {
                attempt: {
                    userId,
                    ...(stageId ? { stageId } : {}),
                },
            },
            select: { questionId: true },
        });
        const seenQuestionIds = new Set([
            ...seenHistories.map((h) => h.questionId),
            ...pastAttemptAnswers.map((a) => a.questionId),
        ]);
        const seenQuestionTexts = seenHistories
            .map((h) => h.question?.questionText)
            .filter((t) => Boolean(t));
        const seenQuestionHashes = new Set(seenHistories
            .map((h) => h.question?.questionHash)
            .filter((h) => Boolean(h)));
        const selectedQuestions = [];
        const chosenQuestionIds = new Set();
        const chosenHashes = new Set();
        const sectionGoals = [];
        if (stage && stage.sections && stage.sections.length > 0) {
            let activeSections = stage.sections;
            if (effectiveTest?.slug?.includes('paper-1')) {
                const p1 = stage.sections.filter((s) => s.code === 'PAPER_1' || s.name.toLowerCase().includes('paper 1'));
                if (p1.length > 0) activeSections = p1;
            } else if (effectiveTest?.slug?.includes('paper-2')) {
                const p2 = stage.sections.filter((s) => s.code === 'PAPER_2' || s.name.toLowerCase().includes('paper 2'));
                if (p2.length > 0) activeSections = p2;
            } else if (effectiveTest?.subjectId) {
                const matched = stage.sections.filter((s) => s.subjectId === effectiveTest.subjectId);
                if (matched.length > 0) activeSections = matched;
            }

            for (const sec of activeSections) {
                let matchedSubject = sec.subject;
                if (!matchedSubject) {
                    matchedSubject = exam.subjects.find((s) => s.name.toLowerCase().includes(sec.name.toLowerCase()) ||
                        sec.name.toLowerCase().includes(s.name.toLowerCase())) || exam.subjects[0];
                }
                const targetCount = (activeSections.length === 1 && targetTest?.totalQuestions)
                    ? targetTest.totalQuestions
                    : (sec.questionCount || 25);
                sectionGoals.push({
                    sectionId: sec.id,
                    sectionCode: sec.code,
                    sectionName: sec.name,
                    questionType: sec.questionType || 'OBJECTIVE_MCQ',
                    subjectId: matchedSubject ? matchedSubject.id : exam.subjects[0]?.id || '',
                    subjectName: sec.name,
                    targetCount,
                    topics: matchedSubject ? matchedSubject.topics : [],
                });
            }
        }
        else if (exam.subjects.length > 0) {
            const totalGoal = stage?.totalQuestions || exam.totalQuestions || questionCount || 100;
            const perSubjectCount = Math.floor(totalGoal / exam.subjects.length);
            const remainder = totalGoal % exam.subjects.length;
            exam.subjects.forEach((subj, idx) => {
                sectionGoals.push({
                    sectionId: subj.id,
                    sectionCode: `SEC_${idx + 1}`,
                    sectionName: subj.name,
                    questionType: 'OBJECTIVE_MCQ',
                    subjectId: subj.id,
                    subjectName: subj.name,
                    targetCount: perSubjectCount + (idx < remainder ? 1 : 0),
                    topics: subj.topics,
                });
            });
        }
        const totalRequiredQuestions = sectionGoals.reduce((sum, g) => sum + g.targetCount, 0);
        for (const goal of sectionGoals) {
            const neededCount = goal.targetCount;
            const sectionChosen = [];
            const isDescriptiveSection = goal.questionType === 'DESCRIPTIVE_ESSAY' ||
                goal.sectionCode === 'DESCRIPTIVE_ENGLISH' ||
                goal.sectionName.toLowerCase().includes('descriptive');

            if (isDescriptiveSection) {
                // SPECIALIZED SELECTION FOR DESCRIPTIVE ENGLISH (1 Letter + 1 Essay)
                const descQuestions = await prisma.question.findMany({
                    where: {
                        examId,
                        questionType: 'DESCRIPTIVE_ESSAY',
                        status: 'PUBLISHED',
                    },
                    include: { subject: true, topic: true, exam: true },
                });

                // Prioritize 1 letter prompt and 1 essay prompt
                const letterPrompts = descQuestions.filter((q) =>
                    q.topic?.slug === 'letter-writing' ||
                    q.questionText.toLowerCase().includes('letter') ||
                    q.topic?.name.toLowerCase().includes('letter')
                );
                const essayPrompts = descQuestions.filter((q) =>
                    q.topic?.slug === 'essay-writing' ||
                    q.questionText.toLowerCase().includes('essay') ||
                    q.topic?.name.toLowerCase().includes('essay')
                );

                // Unseen letter prompts
                const unseenLetters = letterPrompts.filter((q) => !seenQuestionIds.has(q.id));
                const chosenLetter = unseenLetters.length > 0
                    ? this.shuffleArray(unseenLetters)[0]
                    : this.shuffleArray(letterPrompts)[0] || descQuestions[0];

                if (chosenLetter && !chosenQuestionIds.has(chosenLetter.id)) {
                    sectionChosen.push(chosenLetter);
                    chosenQuestionIds.add(chosenLetter.id);
                    seenQuestionIds.add(chosenLetter.id);
                }

                // Unseen essay prompts
                const unseenEssays = essayPrompts.filter((q) => !seenQuestionIds.has(q.id) && !chosenQuestionIds.has(q.id));
                const chosenEssay = unseenEssays.length > 0
                    ? this.shuffleArray(unseenEssays)[0]
                    : this.shuffleArray(essayPrompts.filter((q) => !chosenQuestionIds.has(q.id)))[0] || descQuestions.find((q) => !chosenQuestionIds.has(q.id));

                if (chosenEssay && !chosenQuestionIds.has(chosenEssay.id)) {
                    sectionChosen.push(chosenEssay);
                    chosenQuestionIds.add(chosenEssay.id);
                    seenQuestionIds.add(chosenEssay.id);
                }

                // If still needed, fill from remaining descriptive prompts
                if (sectionChosen.length < neededCount) {
                    for (const q of this.shuffleArray(descQuestions)) {
                        if (sectionChosen.length >= neededCount) break;
                        if (!chosenQuestionIds.has(q.id)) {
                            sectionChosen.push(q);
                            chosenQuestionIds.add(q.id);
                            seenQuestionIds.add(q.id);
                        }
                    }
                }
            } else {
                // OBJECTIVE MCQ SELECTION PIPELINE
                const searchTerms = [goal.sectionName, goal.subjectName].filter(Boolean);
                const subjectWhere = {
                    OR: [
                        ...(goal.subjectId ? [{ subjectId: goal.subjectId }] : []),
                        ...searchTerms.map((term) => ({
                            subject: { name: { contains: term, mode: 'insensitive' } },
                        })),
                    ],
                };
                // Query Unused Verified Questions from Database (Exclude descriptive prompts)
                const unusedVerified = await prisma.question.findMany({
                    where: {
                        examId,
                        ...subjectWhere,
                        questionType: { not: 'DESCRIPTIVE_ESSAY' },
                        status: 'PUBLISHED',
                        source: { not: 'AI_GENERATED' },
                        id: { notIn: Array.from(seenQuestionIds) },
                    },
                    include: { subject: true, topic: true, exam: true },
                });
                const shuffledVerified = this.shuffleArray(unusedVerified);
                for (const q of shuffledVerified) {
                    if (sectionChosen.length < neededCount && !chosenQuestionIds.has(q.id)) {
                        const qHash = q.questionHash || generateQuestionHash(q.questionText, q.options);
                        if (!chosenHashes.has(qHash)) {
                            sectionChosen.push(q);
                            chosenQuestionIds.add(q.id);
                            chosenHashes.add(qHash);
                            seenQuestionIds.add(q.id);
                        }
                    }
                }
                // Query Unused AI-Generated Questions from Database
                if (sectionChosen.length < neededCount) {
                    const unusedAi = await prisma.question.findMany({
                        where: {
                            examId,
                            ...subjectWhere,
                            questionType: { not: 'DESCRIPTIVE_ESSAY' },
                            status: 'PUBLISHED',
                            source: 'AI_GENERATED',
                            id: { notIn: Array.from(seenQuestionIds) },
                        },
                        include: { subject: true, topic: true, exam: true },
                    });
                    const shuffledAi = this.shuffleArray(unusedAi);
                    for (const q of shuffledAi) {
                        if (sectionChosen.length < neededCount && !chosenQuestionIds.has(q.id)) {
                            const qHash = q.questionHash || generateQuestionHash(q.questionText, q.options);
                            if (!chosenHashes.has(qHash)) {
                                sectionChosen.push(q);
                                chosenQuestionIds.add(q.id);
                                chosenHashes.add(qHash);
                                seenQuestionIds.add(q.id);
                            }
                        }
                    }
                }
            }
            // Dynamically Generate Missing Questions via Gemini
            const shortfall = neededCount - sectionChosen.length;
            if (shortfall > 0) {
                try {
                    const primaryTopic = goal.topics[0]?.name || 'Core Fundamentals';
                    const generatedResults = await GeminiQuestionService.generateQuestions({
                        examName: exam.name,
                        examSlug: exam.slug,
                        subjectName: goal.subjectName,
                        topicName: primaryTopic,
                        difficulty: difficulty || 'MEDIUM',
                        questionCount: shortfall,
                        excludedQuestions: seenQuestionTexts.slice(-30),
                        excludedHashes: new Set([...seenQuestionHashes, ...chosenHashes]),
                    });
                    for (const genQ of generatedResults) {
                        if (sectionChosen.length >= neededCount)
                            break;
                        const qHash = genQ.questionHash || generateQuestionHash(genQ.questionText, genQ.options);
                        if (chosenHashes.has(qHash))
                            continue;
                        const topicRecord = goal.topics.find((t) => t.name.toLowerCase() === (genQ.subtopic || '').toLowerCase()) || goal.topics[0];
                        let topicIdToUse = topicRecord?.id;
                        if (!topicIdToUse) {
                            const existingTopic = await prisma.topic.findFirst({
                                where: { subjectId: goal.subjectId },
                            });
                            topicIdToUse = existingTopic?.id || (await prisma.topic.create({
                                data: {
                                    subjectId: goal.subjectId,
                                    name: genQ.subtopic || 'General',
                                    slug: `${goal.subjectName.toLowerCase().replace(/\s+/g, '-')}-topic-${Date.now()}`,
                                },
                            })).id;
                        }
                        const createdQuestion = await prisma.question.create({
                            data: {
                                examId,
                                subjectId: goal.subjectId,
                                topicId: topicIdToUse,
                                questionText: genQ.questionText,
                                options: JSON.stringify(genQ.options),
                                correctOption: genQ.correctOption,
                                explanation: genQ.explanation,
                                difficulty: genQ.difficulty,
                                subtopic: genQ.subtopic || 'Core Subject',
                                status: 'PUBLISHED',
                                source: 'AI_GENERATED',
                                generationModel: genQ.generationModel || 'gemini-3.5-flash-lite',
                                generationPromptVersion: genQ.generationPromptVersion || 'v2.1',
                                questionHash: qHash,
                            },
                            include: { subject: true, topic: true, exam: true },
                        });
                        sectionChosen.push(createdQuestion);
                        chosenQuestionIds.add(createdQuestion.id);
                        chosenHashes.add(qHash);
                        seenQuestionIds.add(createdQuestion.id);
                        seenQuestionHashes.add(qHash);
                    }
                }
                catch (geminiError) {
                    console.warn(`[QuestionSelectionService] Gemini dynamic question generation notice:`, geminiError.message);
                }
            }
            // Fallback Loop
            let genRetries = 0;
            while (sectionChosen.length < neededCount && genRetries < 25) {
                genRetries++;
                const remainingShortfall = neededCount - sectionChosen.length;
                const extraCalibrated = ExamQuestionGenerator.generateBatch({
                    examName: exam.name,
                    sectionName: goal.sectionName,
                    subjectName: goal.subjectName,
                    topicName: goal.topics[0]?.name || 'Fundamentals',
                    difficulty: difficulty || 'MEDIUM',
                    count: remainingShortfall + 10,
                    excludedHashes: new Set([...seenQuestionHashes, ...chosenHashes]),
                });
                for (const genQ of extraCalibrated) {
                    if (sectionChosen.length >= neededCount)
                        break;
                    const qHash = genQ.questionHash || generateQuestionHash(genQ.questionText, genQ.options);
                    if (chosenHashes.has(qHash))
                        continue;
                    let topicIdToUse = goal.topics[0]?.id;
                    if (!topicIdToUse) {
                        const existingTopic = await prisma.topic.findFirst({
                            where: { subjectId: goal.subjectId },
                        });
                        topicIdToUse = existingTopic?.id || (await prisma.topic.create({
                            data: {
                                subjectId: goal.subjectId,
                                name: genQ.subtopic || 'General',
                                slug: `${goal.subjectName.toLowerCase().replace(/\s+/g, '-')}-core-${Date.now()}`,
                            },
                        })).id;
                    }
                    const createdQuestion = await prisma.question.create({
                        data: {
                            examId,
                            subjectId: goal.subjectId,
                            topicId: topicIdToUse,
                            questionText: genQ.questionText,
                            options: JSON.stringify(genQ.options),
                            correctOption: genQ.correctOption,
                            explanation: genQ.explanation,
                            difficulty: genQ.difficulty,
                            subtopic: genQ.subtopic,
                            status: 'PUBLISHED',
                            source: 'AI_GENERATED',
                            generationModel: 'gemini-calibrated-engine',
                            generationPromptVersion: 'govprep-v2.1',
                            questionHash: qHash,
                        },
                        include: { subject: true, topic: true, exam: true },
                    });
                    sectionChosen.push(createdQuestion);
                    chosenQuestionIds.add(createdQuestion.id);
                    chosenHashes.add(qHash);
                    seenQuestionIds.add(createdQuestion.id);
                    seenQuestionHashes.add(qHash);
                }
            }
            if (sectionChosen.length < neededCount) {
                throw new Error(`Unable to fulfill required question count for section '${goal.sectionName}'. Required: ${neededCount}, Prepared: ${sectionChosen.length}.`);
            }
            for (const q of sectionChosen) {
                const parsedOptions = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
                selectedQuestions.push({
                    id: q.id,
                    sectionId: goal.sectionId,
                    sectionName: goal.sectionName,
                    topicId: q.topicId,
                    topicName: q.topic?.name || 'General',
                    questionText: q.questionText,
                    options: parsedOptions,
                    difficulty: q.difficulty,
                    questionType: q.questionType || 'OBJECTIVE_MCQ',
                    examName: exam.name,
                    subject: goal.subjectName,
                    source: q.source || 'VERIFIED',
                });
            }
        }
        if (selectedQuestions.length !== totalRequiredQuestions) {
            throw new Error(`Unable to prepare the complete exam. Required: ${totalRequiredQuestions} questions, Available: ${selectedQuestions.length}.`);
        }
        return selectedQuestions;
    }
    /**
     * Fisher-Yates array shuffling utility.
     */
    static shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    }
}
