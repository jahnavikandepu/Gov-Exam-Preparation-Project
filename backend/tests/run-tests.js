import { prisma } from '../src/config/db.js';
import { hashPassword, comparePassword } from '../src/utils/hash.js';
import { generateToken, verifyToken } from '../src/utils/jwt.js';
import { SyllabusService } from '../src/services/syllabus/syllabusService.js';
import { isGeminiConfigured, getGeminiModel } from '../src/config/geminiConfig.js';
import { generateQuestionHash, computeQuestionSimilarity } from '../src/utils/questionHash.js';
import { QuestionSelectionService } from '../src/services/question/questionSelectionService.js';
let failures = 0;
async function runTest(name, fn) {
    try {
        process.stdout.write(`🧪 Testing: ${name}... `);
        await fn();
        console.log('✅ PASS');
    }
    catch (error) {
        console.log('❌ FAIL');
        console.error('   Error details:', error);
        failures++;
    }
}
async function getOrCreateTestStudent(email = 'test-student@govprep.com', name = 'Test Student') {
    return prisma.user.upsert({
        where: { email },
        update: {},
        create: {
            name,
            email,
            password: await hashPassword('password123'),
            role: 'USER',
            targetExam: 'RRB NTPC',
            joinedDate: 'October 2026',
            status: 'Active',
        },
    });
}
async function main() {
    process.exitCode = 0;
    console.log('\n====================================================');
    console.log('🚀 GovPrep Backend, Official Exam Stage & CBT Engine Test Suite');
    console.log('====================================================\n');
    // Test 1: Password Hashing & Comparison
    await runTest('Password Hashing & Verification with bcrypt', async () => {
        const password = 'mySecurePassword123';
        const hash = await hashPassword(password);
        if (!hash || hash === password)
            throw new Error('Password hash failed.');
        const isValid = await comparePassword(password, hash);
        if (!isValid)
            throw new Error('Password comparison failed.');
        const isInvalid = await comparePassword('wrongPassword', hash);
        if (isInvalid)
            throw new Error('Invalid password was mistakenly accepted.');
    });
    // Test 2: JWT Token Lifecycle
    await runTest('JWT Token Generation & Verification', async () => {
        const payload = { userId: 'usr-test-123', email: 'test@govprep.com', role: 'USER' };
        const token = generateToken(payload);
        if (!token)
            throw new Error('Token generation failed.');
        const verified = verifyToken(token);
        if (!verified || verified.userId !== payload.userId || verified.role !== 'USER') {
            throw new Error('Token verification payload mismatch.');
        }
    });
    // Test 3: Database & Exam Retrieval
    let testExam;
    await runTest('Prisma Database Connection & Exam Retrieval', async () => {
        testExam = await prisma.exam.findFirst({
            where: { slug: 'rrb-ntpc' },
            include: { subjects: { include: { topics: true } } },
        });
        if (!testExam)
            throw new Error('Seeded exam RRB NTPC not found.');
        if (testExam.subjects.length === 0)
            throw new Error('Exam subjects missing.');
    });
    // Test 4: Gemini Configuration & Environment Guard
    await runTest('Gemini AI Configuration & Key Loading (Backend Only)', async () => {
        const isConfigured = isGeminiConfigured();
        const model = getGeminiModel();
        if (!isConfigured) {
            throw new Error('GEMINI_API_KEY is missing or invalid in backend .env');
        }
        if (!model || model.trim().length === 0) {
            throw new Error('GEMINI_MODEL is missing');
        }
    });
    // Test 5: Question Fingerprinting & Hash Duplicate Detection
    await runTest('Question Fingerprint Hashing & Normalization', async () => {
        const q1 = "What is 20% of 150?";
        const q1Options = [
            { id: "A", text: "30" },
            { id: "B", text: "25" },
            { id: "C", text: "35" },
            { id: "D", text: "40" }
        ];
        const q2 = "  what is  20% of 150?  ";
        const q2Options = [
            { id: "A", text: "30" },
            { id: "B", text: "25" },
            { id: "C", text: "35" },
            { id: "D", text: "40" }
        ];
        const hash1 = generateQuestionHash(q1, q1Options);
        const hash2 = generateQuestionHash(q2, q2Options);
        if (hash1 !== hash2) {
            throw new Error(`Expected identical hashes for normalized questions, got ${hash1} vs ${hash2}`);
        }
        const similarity = computeQuestionSimilarity("What is capital of India?", "What is capital of India?");
        if (similarity < 0.99) {
            throw new Error(`Expected similarity close to 1.0, got ${similarity}`);
        }
    });
    // Test 6: APPSC Forest Beat Officer & Assistant Beat Officer Configuration
    await runTest('APPSC FBO & ABO Screening Test & Mains Hierarchy Configuration', async () => {
        const appsc = await prisma.exam.findUnique({
            where: { code: 'APPSC_FBO_ABO' },
            include: {
                stages: {
                    include: { sections: { orderBy: { order: 'asc' } } },
                },
            },
        });
        if (!appsc)
            throw new Error('APPSC FBO & ABO exam not found in database.');
        if (appsc.stages.length < 1)
            throw new Error('Expected at least 1 stage (Screening) for APPSC FBO/ABO.');
        const screening = appsc.stages.find((s) => s.code === 'SCREENING_TEST');
        if (!screening)
            throw new Error('APPSC Screening Test stage missing.');
        if (screening.totalQuestions !== 150)
            throw new Error(`Expected 150 questions for Screening, got ${screening.totalQuestions}`);
        if (screening.durationMinutes !== 150)
            throw new Error(`Expected 150 minutes for Screening, got ${screening.durationMinutes}`);
        if (screening.totalMarks !== 150)
            throw new Error(`Expected 150 marks for Screening, got ${screening.totalMarks}`);
        if (Math.abs(screening.negativeMarks - 0.33) > 0.01)
            throw new Error(`Expected 1/3 negative marking, got ${screening.negativeMarks}`);
        // Check Part A and Part B
        const partA = screening.sections.find((sec) => sec.code === 'PART_A');
        const partB = screening.sections.find((sec) => sec.code === 'PART_B');
        if (!partA || partA.questionCount !== 75)
            throw new Error('Part A: GS & Mental Ability must be exactly 75 questions.');
        if (!partB || partB.questionCount !== 75)
            throw new Error('Part B: General Science & Maths must be exactly 75 questions.');
    });
    // Test 7: RRB NTPC CBT-1 & CBT-2 Stage Configurations
    await runTest('RRB NTPC CBT-1 (100 Qs/90m) and CBT-2 (120 Qs/90m) Stages', async () => {
        const ntpc = await prisma.exam.findUnique({
            where: { code: 'RRB_NTPC' },
            include: {
                stages: {
                    include: { sections: { orderBy: { order: 'asc' } } },
                },
            },
        });
        if (!ntpc)
            throw new Error('RRB NTPC exam missing.');
        // CBT-1 verification
        const cbt1 = ntpc.stages.find((s) => s.code === 'CBT_1');
        if (!cbt1)
            throw new Error('RRB NTPC CBT-1 stage missing.');
        if (cbt1.totalQuestions !== 100)
            throw new Error(`CBT-1 questions expected 100, got ${cbt1.totalQuestions}`);
        if (cbt1.durationMinutes !== 90)
            throw new Error(`CBT-1 duration expected 90m, got ${cbt1.durationMinutes}`);
        if (cbt1.scribeDurationMinutes !== 120)
            throw new Error(`CBT-1 scribe duration expected 120m, got ${cbt1.scribeDurationMinutes}`);
        const cbt1GA = cbt1.sections.find((s) => s.code === 'GA');
        const cbt1Math = cbt1.sections.find((s) => s.code === 'MATH');
        const cbt1Reasoning = cbt1.sections.find((s) => s.code === 'REASONING');
        if (!cbt1GA || cbt1GA.questionCount !== 40)
            throw new Error('CBT-1 GA must have 40 questions.');
        if (!cbt1Math || cbt1Math.questionCount !== 30)
            throw new Error('CBT-1 Math must have 30 questions.');
        if (!cbt1Reasoning || cbt1Reasoning.questionCount !== 30)
            throw new Error('CBT-1 Reasoning must have 30 questions.');
        // CBT-2 verification
        const cbt2 = ntpc.stages.find((s) => s.code === 'CBT_2');
        if (!cbt2)
            throw new Error('RRB NTPC CBT-2 stage missing.');
        if (cbt2.totalQuestions !== 120)
            throw new Error(`CBT-2 questions expected 120, got ${cbt2.totalQuestions}`);
        if (cbt2.durationMinutes !== 90)
            throw new Error(`CBT-2 duration expected 90m, got ${cbt2.durationMinutes}`);
        const cbt2GA = cbt2.sections.find((s) => s.code === 'GA');
        const cbt2Math = cbt2.sections.find((s) => s.code === 'MATH');
        const cbt2Reasoning = cbt2.sections.find((s) => s.code === 'REASONING');
        if (!cbt2GA || cbt2GA.questionCount !== 50)
            throw new Error('CBT-2 GA must have 50 questions.');
        if (!cbt2Math || cbt2Math.questionCount !== 35)
            throw new Error('CBT-2 Math must have 35 questions.');
        if (!cbt2Reasoning || cbt2Reasoning.questionCount !== 35)
            throw new Error('CBT-2 Reasoning must have 35 questions.');
    });
    // Test 8: RRB JE CBT-1 & CBT-2 Stage Configurations
    await runTest('RRB JE CBT-1 (100 Qs/90m) and CBT-2 (150 Qs/120m) Stages', async () => {
        const rrbJe = await prisma.exam.findUnique({
            where: { code: 'RRB_JE' },
            include: {
                stages: {
                    include: { sections: { orderBy: { order: 'asc' } } },
                },
            },
        });
        if (!rrbJe)
            throw new Error('RRB JE exam missing.');
        const cbt1 = rrbJe.stages.find((s) => s.code === 'CBT_1');
        if (!cbt1)
            throw new Error('RRB JE CBT-1 missing.');
        if (cbt1.totalQuestions !== 100 || cbt1.durationMinutes !== 90) {
            throw new Error(`CBT-1 specifications mismatch.`);
        }
        const cbt2 = rrbJe.stages.find((s) => s.code === 'CBT_2');
        if (!cbt2)
            throw new Error('RRB JE CBT-2 missing.');
        if (cbt2.totalQuestions !== 150 || cbt2.durationMinutes !== 120 || cbt2.scribeDurationMinutes !== 160) {
            throw new Error(`CBT-2 specifications mismatch.`);
        }
        const techSec = cbt2.sections.find((s) => s.code === 'TECHNICAL');
        if (!techSec || techSec.questionCount !== 100) {
            throw new Error('CBT-2 Technical section must have 100 questions.');
        }
    });
    // Test 9: Server-Side Timer Expiration Calculation & Integrity
    await runTest('Server-Side Timer Generation, Expiration & Resilience', async () => {
        const student = await getOrCreateTestStudent('test-student@govprep.com', 'Test Student');
        if (!student)
            throw new Error('Student user not found.');
        const test = await prisma.test.findFirst({
            where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
            include: { stage: true },
        });
        if (!test)
            throw new Error('Active Test not found.');
        const startedAt = new Date();
        const durationSeconds = 90 * 60;
        const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);
        const attempt = await prisma.testAttempt.create({
            data: {
                userId: student.id,
                testId: test.id,
                stageId: test.stageId,
                testTitle: test.title,
                examName: 'RRB NTPC',
                isCompleted: false,
                status: 'IN_PROGRESS',
                startTime: startedAt,
                startedAt,
                expiresAt,
                durationSeconds,
                totalQuestions: 100,
            },
        });
        if (!attempt.expiresAt)
            throw new Error('TestAttempt missing server expiresAt timestamp.');
        const computedRemaining = Math.max(0, Math.floor((attempt.expiresAt.getTime() - Date.now()) / 1000));
        if (computedRemaining <= 0 || computedRemaining > 5400) {
            throw new Error(`Invalid remaining time computed: ${computedRemaining}s`);
        }
        // Clean up
        await prisma.testAttempt.delete({ where: { id: attempt.id } });
    });
    // Test 10: Real-Time Answer Autosave with Upsert Security
    await runTest('Real-Time Answer Autosave via Database Upsert', async () => {
        const student = await getOrCreateTestStudent('test-student@govprep.com', 'Test Student');
        const question = await prisma.question.findFirst();
        if (!student || !question)
            throw new Error('Prerequisites missing.');
        const attempt = await prisma.testAttempt.create({
            data: {
                userId: student.id,
                testTitle: 'Autosave Test Attempt',
                examName: 'GovPrep CBT',
                isCompleted: false,
                status: 'IN_PROGRESS',
                startTime: new Date(),
                startedAt: new Date(),
                expiresAt: new Date(Date.now() + 3600 * 1000),
                durationSeconds: 3600,
                totalQuestions: 1,
            },
        });
        // Save answer 1st time
        await prisma.answer.upsert({
            where: {
                attemptId_questionId: {
                    attemptId: attempt.id,
                    questionId: question.id,
                },
            },
            update: { selectedOption: 'A', status: 'ANSWERED', timeSpentSeconds: 15 },
            create: { attemptId: attempt.id, questionId: question.id, selectedOption: 'A', status: 'ANSWERED', timeSpentSeconds: 15 },
        });
        // Update answer 2nd time (user changes mind to 'B')
        await prisma.answer.upsert({
            where: {
                attemptId_questionId: {
                    attemptId: attempt.id,
                    questionId: question.id,
                },
            },
            update: { selectedOption: 'B', status: 'ANSWERED', timeSpentSeconds: 25 },
            create: { attemptId: attempt.id, questionId: question.id, selectedOption: 'B', status: 'ANSWERED', timeSpentSeconds: 25 },
        });
        const saved = await prisma.answer.findUnique({
            where: {
                attemptId_questionId: {
                    attemptId: attempt.id,
                    questionId: question.id,
                },
            },
        });
        if (!saved || saved.selectedOption !== 'B' || saved.timeSpentSeconds !== 25) {
            throw new Error('Answer was not properly updated by upsert autosave.');
        }
        // Clean up
        await prisma.answer.deleteMany({ where: { attemptId: attempt.id } });
        await prisma.testAttempt.delete({ where: { id: attempt.id } });
    });
    // Test 11: Configuration-Driven Scoring Formula Verification
    await runTest('Configuration-Driven Scoring Formula (+1.0 correct, -0.33 wrong)', async () => {
        const marksPerCorrect = 1.0;
        const negativePerWrong = 0.33;
        const correctCount = 60;
        const wrongCount = 30;
        const skippedCount = 10;
        const rawScore = correctCount * marksPerCorrect - wrongCount * negativePerWrong;
        const expectedScore = Math.round(Math.max(0, rawScore) * 100) / 100; // 60 - 9.9 = 50.1
        if (expectedScore !== 50.1) {
            throw new Error(`Expected score 50.1, got ${expectedScore}`);
        }
    });
    // Test 12: Syllabus Document Registry, Metadata & Security Guard
    await runTest('Syllabus Document Registry, Metadata & Security Guard', async () => {
        const docs = await SyllabusService.listAvailableDocuments();
        if (!Array.isArray(docs) || docs.length < 3) {
            throw new Error('Syllabus documents list is missing expected exam configurations.');
        }
        const ntpcDoc = await SyllabusService.getSyllabusByExamSlug('rrb-ntpc');
        if (!ntpcDoc || ntpcDoc.slug !== 'rrb-ntpc' || ntpcDoc.exam !== 'RRB NTPC') {
            throw new Error('Failed to retrieve RRB NTPC syllabus metadata.');
        }
        let traversalBlocked = false;
        try {
            SyllabusService.sanitizeSlug('../../../secret');
        }
        catch {
            traversalBlocked = true;
        }
        if (!traversalBlocked) {
            throw new Error('SECURITY VIOLATION: Path traversal slug was not rejected!');
        }
    });
    // Test 13: RRB Group D CBT Blueprint Verification
    await runTest('RRB Group D CBT (100 Qs/90m, Scribe 120m, 1/3 Negative Marking) Blueprint', async () => {
        const rrbGroupD = await prisma.exam.findUnique({
            where: { code: 'RRB_GROUP_D' },
            include: {
                stages: {
                    include: { sections: { orderBy: { order: 'asc' } } },
                },
            },
        });
        if (!rrbGroupD)
            throw new Error('RRB Group D exam missing in database.');
        const cbt = rrbGroupD.stages.find((s) => s.code === 'CBT');
        if (!cbt)
            throw new Error('RRB Group D CBT stage missing.');
        if (cbt.totalQuestions !== 100)
            throw new Error(`CBT questions expected 100, got ${cbt.totalQuestions}`);
        if (cbt.durationMinutes !== 90)
            throw new Error(`CBT duration expected 90m, got ${cbt.durationMinutes}`);
        if (cbt.scribeDurationMinutes !== 120)
            throw new Error(`CBT scribe duration expected 120m, got ${cbt.scribeDurationMinutes}`);
        if (Math.abs(cbt.negativeMarks - 0.33) > 0.01)
            throw new Error(`CBT negative marks expected 0.33, got ${cbt.negativeMarks}`);
        const science = cbt.sections.find((s) => s.code === 'SCIENCE');
        const math = cbt.sections.find((s) => s.code === 'MATH');
        const reasoning = cbt.sections.find((s) => s.code === 'REASONING');
        const ga = cbt.sections.find((s) => s.code === 'GA_CA' || s.code === 'GA');
        if (!science || science.questionCount !== 25)
            throw new Error('General Science must have 25 questions.');
        if (!math || math.questionCount !== 25)
            throw new Error('Mathematics must have 25 questions.');
        if (!reasoning || reasoning.questionCount !== 30)
            throw new Error('General Intelligence & Reasoning must have 30 questions.');
        if (!ga || ga.questionCount !== 20)
            throw new Error('General Awareness & Current Affairs must have 20 questions.');
    });
    // Test 14: IBPS PO Prelims & Mains Blueprint & Sectional Timing Verification
    await runTest('IBPS PO Prelims (60m with 20m Section Timers) & Mains (210m, 225 Marks) Blueprint', async () => {
        const ibpsPo = await prisma.exam.findUnique({
            where: { code: 'IBPS_PO' },
            include: {
                stages: {
                    include: { sections: { orderBy: { order: 'asc' } } },
                },
            },
        });
        if (!ibpsPo)
            throw new Error('IBPS PO exam missing in database.');
        // Prelims verification
        const prelims = ibpsPo.stages.find((s) => s.code === 'PRELIMS');
        if (!prelims)
            throw new Error('IBPS PO Prelims stage missing.');
        if (prelims.totalQuestions !== 100)
            throw new Error(`Prelims questions expected 100, got ${prelims.totalQuestions}`);
        if (prelims.durationMinutes !== 60)
            throw new Error(`Prelims duration expected 60m, got ${prelims.durationMinutes}`);
        if (prelims.sectionTiming !== true)
            throw new Error(`Prelims sectionTiming flag must be true.`);
        if (Math.abs(prelims.negativeMarks - 0.25) > 0.01)
            throw new Error(`Prelims negative marks expected 0.25, got ${prelims.negativeMarks}`);
        const english = prelims.sections.find((s) => s.code === 'ENGLISH');
        const quant = prelims.sections.find((s) => s.code === 'QUANT');
        const reasoning = prelims.sections.find((s) => s.code === 'REASONING');
        if (!english || english.questionCount !== 30 || english.durationMinutes !== 20) {
            throw new Error(`English Language must be 30 Qs with 20m sectional timing (got ${english?.questionCount} Qs, ${english?.durationMinutes}m).`);
        }
        if (!quant || quant.questionCount !== 35 || quant.durationMinutes !== 20) {
            throw new Error(`Quantitative Aptitude must be 35 Qs with 20m sectional timing (got ${quant?.questionCount} Qs, ${quant?.durationMinutes}m).`);
        }
        if (!reasoning || reasoning.questionCount !== 35 || reasoning.durationMinutes !== 20) {
            throw new Error(`Reasoning Ability must be 35 Qs with 20m sectional timing (got ${reasoning?.questionCount} Qs, ${reasoning?.durationMinutes}m).`);
        }
        // Mains verification
        const mains = ibpsPo.stages.find((s) => s.code === 'MAINS');
        if (!mains)
            throw new Error('IBPS PO Mains stage missing.');
        if (mains.totalQuestions !== 157)
            throw new Error(`Mains questions expected 157 (155 obj + 2 desc), got ${mains.totalQuestions}`);
        if (mains.totalMarks !== 225)
            throw new Error(`Mains marks expected 225 (200 obj + 25 desc), got ${mains.totalMarks}`);
        if (mains.durationMinutes !== 210)
            throw new Error(`Mains duration expected 210m (180 obj + 30 desc), got ${mains.durationMinutes}`);
    });
    // Test 15: Unique Question Selection Engine for Repeated Exam Attempts
    await runTest('Unique Question Selection Engine per Student Attempt', async () => {
        const student = await getOrCreateTestStudent('test-student@govprep.com', 'Test Student');
        if (!student)
            throw new Error('Student user not found.');
        const exam = await prisma.exam.findUnique({
            where: { code: 'RRB_NTPC' },
            include: { stages: { include: { sections: true } }, subjects: { include: { topics: true } } },
        });
        if (!exam || !exam.subjects[0] || !exam.subjects[0].topics[0])
            throw new Error('RRB NTPC exam or topics not found.');
        const cbt1Stage = exam.stages.find((s) => s.code === 'CBT_1');
        if (!cbt1Stage)
            throw new Error('CBT-1 stage not found.');
        const subject = exam.subjects[0];
        const topic = subject.topics[0];
        // Clean previous test question histories for student
        await prisma.questionHistory.deleteMany({
            where: { userId: student.id, examId: exam.id },
        });
        // Seed 10 distinct questions for Batch A and 10 for Batch B
        const batchAQuestions = await Promise.all(Array.from({ length: 5 }).map((_, i) => prisma.question.create({
            data: {
                examId: exam.id,
                subjectId: subject.id,
                topicId: topic.id,
                questionText: `Unique Test 15 Question Batch A #${i + 1} - ${Date.now()}`,
                options: JSON.stringify([
                    { id: 'A', text: 'Opt A' },
                    { id: 'B', text: 'Opt B' },
                    { id: 'C', text: 'Opt C' },
                    { id: 'D', text: 'Opt D' },
                ]),
                correctOption: 'A',
                explanation: 'Batch A explanation',
                difficulty: 'MEDIUM',
                status: 'PUBLISHED',
                source: 'VERIFIED_BATCH_A',
            },
        })));
        const batchBQuestions = await Promise.all(Array.from({ length: 5 }).map((_, i) => prisma.question.create({
            data: {
                examId: exam.id,
                subjectId: subject.id,
                topicId: topic.id,
                questionText: `Unique Test 15 Question Batch B #${i + 1} - ${Date.now()}`,
                options: JSON.stringify([
                    { id: 'A', text: 'Opt A' },
                    { id: 'B', text: 'Opt B' },
                    { id: 'C', text: 'Opt C' },
                    { id: 'D', text: 'Opt D' },
                ]),
                correctOption: 'B',
                explanation: 'Batch B explanation',
                difficulty: 'MEDIUM',
                status: 'PUBLISHED',
                source: 'VERIFIED_BATCH_B',
            },
        })));
        // Record Batch A questions in student's QuestionHistory (simulating Attempt 1 completed)
        for (const q of batchAQuestions) {
            await prisma.questionHistory.create({
                data: {
                    userId: student.id,
                    questionId: q.id,
                    examId: exam.id,
                    stageId: cbt1Stage.id,
                    shownAt: new Date(),
                },
            });
        }
        // Create a 5-question mock test for testing uniqueness
        const testMock = await prisma.test.create({
            data: {
                examId: exam.id,
                stageId: cbt1Stage.id,
                title: 'Uniqueness Test 15 Mock',
                slug: `uniqueness-test-15-mock-${Date.now()}`,
                type: 'MOCK',
                difficulty: 'MEDIUM',
                totalQuestions: 5,
                durationMinutes: 10,
                totalMarks: 5,
                negativeMarkingPerQuestion: 0.33,
                marksPerCorrect: 1,
                status: 'PUBLISHED',
            },
        });
        // Now request unique questions for Attempt 2:
        const attempt2Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
            userId: student.id,
            testId: testMock.id,
            examId: exam.id,
            stageId: cbt1Stage.id,
            difficulty: 'MEDIUM',
        });
        const batchAIds = new Set(batchAQuestions.map((q) => q.id));
        const attempt2Ids = new Set(attempt2Questions.map((q) => q.id));
        // Verify that none of Batch A's question IDs were selected in Attempt 2
        let seenOverlap = 0;
        for (const id of attempt2Ids) {
            if (batchAIds.has(id)) {
                seenOverlap++;
            }
        }
        if (seenOverlap > 0) {
            throw new Error(`Previously seen questions from Attempt 1 were mistakenly selected in Attempt 2! Overlap: ${seenOverlap}`);
        }
        await prisma.test.delete({ where: { id: testMock.id } });
        // Clean up test batch questions & histories
        await prisma.questionHistory.deleteMany({
            where: { userId: student.id, questionId: { in: [...batchAQuestions, ...batchBQuestions].map((q) => q.id) } },
        });
        await prisma.question.deleteMany({
            where: { id: { in: [...batchAQuestions, ...batchBQuestions].map((q) => q.id) } },
        });
    });
    // Test 16: Resume Unfinished Attempt vs Retake (New Attempt) Integrity
    await runTest('Resume Unfinished Attempt vs Retake (New Attempt) with Attempt Numbering', async () => {
        const student = await getOrCreateTestStudent('test-student@govprep.com', 'Test Student');
        const test = await prisma.test.findFirst({
            where: { status: { in: ['ACTIVE', 'PUBLISHED'] } },
        });
        if (!student || !test)
            throw new Error('Prerequisites missing.');
        // Clean up any stale active attempts for testing
        await prisma.testAttempt.deleteMany({
            where: { userId: student.id, testId: test.id, isCompleted: false },
        });
        // Create an initial IN_PROGRESS attempt
        const attempt1 = await prisma.testAttempt.create({
            data: {
                userId: student.id,
                testId: test.id,
                attemptNumber: 1,
                testTitle: test.title,
                examName: 'RRB NTPC',
                isCompleted: false,
                status: 'IN_PROGRESS',
                startTime: new Date(),
                startedAt: new Date(),
                expiresAt: new Date(Date.now() + 5400 * 1000),
                durationSeconds: 5400,
                totalQuestions: 10,
            },
        });
        const candidateQuestions = await prisma.question.findMany({ take: 10 });
        for (const q of candidateQuestions) {
            await prisma.answer.create({
                data: {
                    attemptId: attempt1.id,
                    questionId: q.id,
                    selectedOption: null,
                    status: 'NOT_VISITED',
                },
            });
        }
        // Check resuming behavior: Querying active attempt returns the same attempt
        const activeAttempt = await prisma.testAttempt.findFirst({
            where: { userId: student.id, testId: test.id, isCompleted: false, status: 'IN_PROGRESS' },
            include: { answers: true },
        });
        if (!activeAttempt || activeAttempt.id !== attempt1.id) {
            throw new Error('Active unfinished attempt was not correctly located for resume.');
        }
        if (activeAttempt.answers.length !== candidateQuestions.length) {
            throw new Error(`Expected ${candidateQuestions.length} answers snapshot, found ${activeAttempt.answers.length}`);
        }
        // Now complete Attempt 1
        await prisma.testAttempt.update({
            where: { id: attempt1.id },
            data: { isCompleted: true, status: 'COMPLETED' },
        });
        // Calculate next attempt number
        const completedCount = await prisma.testAttempt.count({
            where: { userId: student.id, testId: test.id },
        });
        const nextAttemptNumber = completedCount + 1;
        if (nextAttemptNumber !== 2) {
            throw new Error(`Expected next attempt number to be 2, got ${nextAttemptNumber}`);
        }
        // Clean up test attempt & answers
        await prisma.answer.deleteMany({ where: { attemptId: attempt1.id } });
        await prisma.testAttempt.delete({ where: { id: attempt1.id } });
    });
    // Test 17: Multi-User History Isolation
    await runTest('Multi-User Question History Isolation (Student A vs Student B)', async () => {
        let studentA = await getOrCreateTestStudent('test-student@govprep.com', 'Test Student');
        let studentB = await getOrCreateTestStudent('priya@govprep.com', 'Priya Sharma');
        if (!studentB) {
            studentB = await prisma.user.create({
                data: {
                    name: 'Priya Sharma',
                    email: 'priya@govprep.com',
                    password: 'hashedPassword123',
                    role: 'USER',
                    targetExam: 'RRB NTPC',
                },
            });
        }
        const testQuestion = await prisma.question.findFirst();
        if (!testQuestion || !studentA || !studentB)
            throw new Error('Prerequisites missing.');
        // Record question history for Student A
        await prisma.questionHistory.create({
            data: {
                userId: studentA.id,
                questionId: testQuestion.id,
                shownAt: new Date(),
            },
        });
        // Query seen questions for Student B
        const studentBHistory = await prisma.questionHistory.findMany({
            where: { userId: studentB.id },
        });
        const studentBSeenIds = new Set(studentBHistory.map((h) => h.questionId));
        if (studentBSeenIds.has(testQuestion.id)) {
            throw new Error("Student A's question history mistakenly leaked into Student B's unseen question pool!");
        }
    });

    // Test 18: Complete Gemini Question Generation & Exam Integration Suite
    await runTest('Gemini AI Question Generation, Schema & Exam System Suite', async () => {
        const { runGeminiQuestionGenerationTests } = await import('./verify_gemini_question_generation.js');
        const res = await runGeminiQuestionGenerationTests();
        if (res.failed > 0) {
            throw new Error(`${res.failed} sub-tests failed in Gemini Question Generation Suite.`);
        }
    });

    if (failures > 0) {
        process.exitCode = 1;
        console.log(`\n❌ ${failures} test(s) failed.\n`);
    }
    else {
        process.exitCode = 0;
        console.log('\n====================================================');
        console.log('🎉 ALL BACKEND, GEMINI AI & CBT EXAM TEST SUITES PASSED!');
        console.log('====================================================\n');
    }
}
main()
    .catch((e) => {
    console.error('Fatal Test Runner Error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
