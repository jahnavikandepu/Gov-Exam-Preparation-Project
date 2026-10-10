import { prisma } from '../src/config/db.js';
import { QuestionSelectionService } from '../src/services/question/questionSelectionService.js';
import { TestController } from '../src/controllers/testController.js';

async function runVerification() {
    console.log('========================================================================');
    console.log('🧪 VERIFYING IBPS PO ONLINE MAIN EXAMINATION EXACT PATTERN (13 TESTS) 🧪');
    console.log('========================================================================\n');

    let allPassed = true;
    const testResults = [];

    function recordResult(num, description, passed, details) {
        testResults.push({ num, description, passed, details });
        console.log(`[TEST ${num}] ${passed ? '✅ PASS' : '❌ FAIL'}: ${description}`);
        if (details) console.log(`   Details: ${details}\n`);
        if (!passed) allPassed = false;
    }

    try {
        // Find IBPS PO Exam & Mains Test
        const exam = await prisma.exam.findUnique({
            where: { code: 'IBPS_PO' },
            include: {
                stages: {
                    where: { code: 'MAINS' },
                    include: { sections: { orderBy: { order: 'asc' } } },
                },
                tests: { where: { slug: 'ibps-po-mains-mock-01' } },
            },
        });

        if (!exam) throw new Error('IBPS PO Exam not found.');
        const mainsStage = exam.stages[0];
        const mainsTest = exam.tests[0];
        const sections = mainsStage.sections;

        // Find or create test user
        let user = await prisma.user.findFirst({
            where: { email: 'student.ibps.verify@govprep.internal' },
        });
        if (!user) {
            user = await prisma.user.create({
                data: {
                    email: 'student.ibps.verify@govprep.internal',
                    name: 'IBPS PO Test Candidate',
                    password: 'dummy_hash_for_test',
                    role: 'STUDENT',
                },
            });
        }

        // Clean up previous verification attempts and history for clean test run
        await prisma.questionHistory.deleteMany({
            where: { userId: user.id },
        });
        await prisma.testAttempt.deleteMany({
            where: { userId: user.id },
        });

        // -------------------------------------------------------------
        // RUN ATTEMPT 1 QUESTION SELECTION
        // -------------------------------------------------------------
        console.log('--- Generating Attempt 1 Question Set ---');
        const attempt1Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
            userId: user.id,
            examId: exam.id,
            stageId: mainsStage.id,
            testId: mainsTest.id,
            difficulty: 'HARD',
            questionCount: 157,
        });

        // Group by section
        const sec1Qs = attempt1Questions.filter((q) => q.sectionName === 'Reasoning & Computer Aptitude');
        const sec2Qs = attempt1Questions.filter((q) => q.sectionName === 'General / Economy / Banking Awareness');
        const sec3Qs = attempt1Questions.filter((q) => q.sectionName === 'English Language');
        const sec4Qs = attempt1Questions.filter((q) => q.sectionName === 'Data Analysis & Interpretation');
        const sec5Qs = attempt1Questions.filter((q) => q.sectionName?.includes('Descriptive'));

        // TEST 1: Reasoning & Computer Aptitude returns exactly 45 questions
        recordResult(
            1,
            'Reasoning & Computer Aptitude returns exactly 45 questions',
            sec1Qs.length === 45,
            `Returned: ${sec1Qs.length} questions (Expected: 45)`
        );

        // TEST 2: General / Economy / Banking Awareness returns exactly 40 questions
        recordResult(
            2,
            'General / Economy / Banking Awareness returns exactly 40 questions',
            sec2Qs.length === 40,
            `Returned: ${sec2Qs.length} questions (Expected: 40)`
        );

        // TEST 3: English Language returns exactly 35 questions
        recordResult(
            3,
            'English Language returns exactly 35 questions',
            sec3Qs.length === 35,
            `Returned: ${sec3Qs.length} questions (Expected: 35)`
        );

        // TEST 4: Data Analysis & Interpretation returns exactly 35 questions
        recordResult(
            4,
            'Data Analysis & Interpretation returns exactly 35 questions',
            sec4Qs.length === 35,
            `Returned: ${sec4Qs.length} questions (Expected: 35)`
        );

        // TEST 5: Descriptive Paper contains exactly two prompts
        const isDescriptiveTypes = sec5Qs.every((q) => q.questionType === 'DESCRIPTIVE_ESSAY' && Array.isArray(q.options) && q.options.length === 0);
        recordResult(
            5,
            'Descriptive Paper contains exactly two prompts (Essay & Letter)',
            sec5Qs.length === 2 && isDescriptiveTypes,
            `Returned: ${sec5Qs.length} prompts (Expected: 2), Type: ${sec5Qs.map(q => q.questionType).join(', ')}`
        );

        // TEST 6: Each section uses its configured duration (60, 35, 40, 45, 30 mins)
        const expectedDurations = [60, 35, 40, 45, 30];
        const actualDurations = sections.map((s) => s.durationMinutes);
        const durationsMatch = expectedDurations.every((d, i) => actualDurations[i] === d);
        recordResult(
            6,
            'Each section uses its configured duration (60, 35, 40, 45, 30 mins = 210 mins total)',
            durationsMatch,
            sections.map((s) => `${s.name}: ${s.durationMinutes}m`).join(' | ')
        );

        // TEST 7: The four objective sections have the configured maximum marks (60, 40, 40, 60) and Descriptive (25)
        const expectedMarks = [60.0, 40.0, 40.0, 60.0, 25.0];
        const actualMarks = sections.map((s) => Number(s.totalMarks));
        const marksMatch = expectedMarks.every((m, i) => actualMarks[i] === m);
        const totalMarksSum = actualMarks.reduce((a, b) => a + b, 0);
        recordResult(
            7,
            'Sections have configured maximum marks (60, 40, 40, 60, 25 = 225M total)',
            marksMatch && totalMarksSum === 225.0,
            sections.map((s) => `${s.name}: ${s.totalMarks}M`).join(' | ') + ` => Total: ${totalMarksSum}M`
        );

        // Simulate creating Attempt 1 in DB via TestController.startTest
        console.log('--- Launching Attempt 1 via TestController.startTest ---');
        let startResData = null;
        const mockReqStart = {
            params: { id: mainsTest.id },
            body: { forceNew: true },
            user: { id: user.id },
        };
        const mockResStart = {
            status: () => mockResStart,
            json: (data) => { startResData = data; return data; },
        };
        await TestController.startTest(mockReqStart, mockResStart);

        const attempt1Id = startResData.attemptId;
        const attempt1SavedQIds = new Set(startResData.questions.map((q) => q.id));

        // -------------------------------------------------------------
        // TEST 8: A new attempt uses a different question set when sufficient alternatives exist
        // -------------------------------------------------------------
        console.log('--- Launching Attempt 2 (Retake) via TestController.startTest ---');
        let startRes2Data = null;
        const mockReqStart2 = {
            params: { id: mainsTest.id },
            body: { forceNew: true, retake: true },
            user: { id: user.id },
        };
        const mockResStart2 = {
            status: () => mockResStart2,
            json: (data) => { startRes2Data = data; return data; },
        };
        await TestController.startTest(mockReqStart2, mockResStart2);

        const attempt2Questions = startRes2Data.questions;
        const attempt2QIds = new Set(attempt2Questions.map((q) => q.id));

        // Check intersection of questions between Attempt 1 and Attempt 2
        const overlappingQIds = [...attempt1SavedQIds].filter((id) => attempt2QIds.has(id));
        const overlapCount = overlappingQIds.length;
        const uniquenessPassed = overlapCount === 0 && attempt2Questions.length === 157;

        recordResult(
            8,
            'A new attempt uses a different question set when sufficient alternatives exist',
            uniquenessPassed,
            `Attempt 1: ${attempt1SavedQIds.size} Qs, Attempt 2: ${attempt2QIds.size} Qs. Overlap: ${overlapCount} questions (Expected: 0)`
        );

        // -------------------------------------------------------------
        // TEST 9: Refreshing an active section preserves saved answers and its deadline
        // -------------------------------------------------------------
        console.log('--- Testing Page Refresh & Autosave Persistence ---');
        // Autosave an answer in Section 1 for Attempt 1
        const testQ1 = startResData.questions[0];
        const testAnsOption = 'B';
        await prisma.answer.update({
            where: { attemptId_questionId: { attemptId: attempt1Id, questionId: testQ1.id } },
            data: { selectedOption: testAnsOption, status: 'ANSWERED', timeSpentSeconds: 45 },
        });

        // Query state as if browser reloaded
        let resumeState = null;
        const mockReqResume = {
            params: { attemptId: attempt1Id },
            user: { id: user.id },
        };
        const mockResResume = {
            status: () => mockResResume,
            json: (data) => { resumeState = data; return data; },
        };
        await TestController.getAttemptState(mockReqResume, mockResResume);

        const savedAnsOnReload = resumeState?.attempt?.savedAnswers?.[testQ1.id];
        const reloadDeadline = resumeState?.attempt?.sectionExpiresAt;
        const originalSectionExpiresAt = startResData.sectionExpiresAt;

        const refreshPassed = savedAnsOnReload?.selectedOption === testAnsOption &&
            Boolean(reloadDeadline) &&
            Math.abs(new Date(reloadDeadline).getTime() - new Date(originalSectionExpiresAt).getTime()) < 2000;

        recordResult(
            9,
            'Refreshing an active section preserves saved answers and its deadline',
            refreshPassed,
            `Saved Answer: ${savedAnsOnReload?.selectedOption} (Expected: ${testAnsOption}), Section Deadline: ${reloadDeadline}`
        );

        // -------------------------------------------------------------
        // TEST 10: Scoring and negative marking are applied correctly
        // -------------------------------------------------------------
        console.log('--- Testing Section-Specific Scoring & Negative Marking ---');
        // Let's create a controlled submission for Attempt 1 with:
        // Section 1 (Reasoning, +1.5, -0.375): 10 correct (+15.0), 2 wrong (-0.75) => 14.25
        // Section 2 (Banking, +1.2, -0.30): 20 correct (+24.0), 4 wrong (-1.20) => 22.80
        // Section 3 (English, +0.5, -0.125): 10 correct (+5.0), 4 wrong (-0.50) => 4.50
        // Section 4 (Quant, +1.5, -0.375): 10 correct (+15.0), 0 wrong (0.0) => 15.00
        // Total Objective Score = 14.25 + 22.80 + 4.50 + 15.00 = 56.55

        const submissionAnswers = {};
        const qList = startResData.questions;

        // Fetch correct answers from DB
        const dbQuestions = await prisma.question.findMany({
            where: { id: { in: qList.map(q => q.id) } },
        });
        const qMap = new Map(dbQuestions.map(q => [q.id, q]));

        // Setup Sec 1: 10 correct, 2 wrong
        const s1Questions = qList.filter(q => q.sectionName === 'Reasoning & Computer Aptitude');
        for (let i = 0; i < 10; i++) {
            const dbQ = qMap.get(s1Questions[i].id);
            submissionAnswers[dbQ.id] = { selectedOption: dbQ.correctOption, status: 'ANSWERED', timeSpentSeconds: 30 };
        }
        for (let i = 10; i < 12; i++) {
            const dbQ = qMap.get(s1Questions[i].id);
            const wrongOpt = dbQ.correctOption === 'A' ? 'B' : 'A';
            submissionAnswers[dbQ.id] = { selectedOption: wrongOpt, status: 'ANSWERED', timeSpentSeconds: 30 };
        }

        // Setup Sec 2: 20 correct, 4 wrong
        const s2Questions = qList.filter(q => q.sectionName === 'General / Economy / Banking Awareness');
        for (let i = 0; i < 20; i++) {
            const dbQ = qMap.get(s2Questions[i].id);
            submissionAnswers[dbQ.id] = { selectedOption: dbQ.correctOption, status: 'ANSWERED', timeSpentSeconds: 20 };
        }
        for (let i = 20; i < 24; i++) {
            const dbQ = qMap.get(s2Questions[i].id);
            const wrongOpt = dbQ.correctOption === 'A' ? 'B' : 'A';
            submissionAnswers[dbQ.id] = { selectedOption: wrongOpt, status: 'ANSWERED', timeSpentSeconds: 20 };
        }

        // Setup Sec 3: 10 correct, 4 wrong
        const s3Questions = qList.filter(q => q.sectionName === 'English Language');
        for (let i = 0; i < 10; i++) {
            const dbQ = qMap.get(s3Questions[i].id);
            submissionAnswers[dbQ.id] = { selectedOption: dbQ.correctOption, status: 'ANSWERED', timeSpentSeconds: 25 };
        }
        for (let i = 10; i < 14; i++) {
            const dbQ = qMap.get(s3Questions[i].id);
            const wrongOpt = dbQ.correctOption === 'A' ? 'B' : 'A';
            submissionAnswers[dbQ.id] = { selectedOption: wrongOpt, status: 'ANSWERED', timeSpentSeconds: 25 };
        }

        // Setup Sec 4: 10 correct, 0 wrong
        const s4Questions = qList.filter(q => q.sectionName === 'Data Analysis & Interpretation');
        for (let i = 0; i < 10; i++) {
            const dbQ = qMap.get(s4Questions[i].id);
            submissionAnswers[dbQ.id] = { selectedOption: dbQ.correctOption, status: 'ANSWERED', timeSpentSeconds: 35 };
        }

        // Setup Sec 5 (Descriptive): 2 written responses
        const s5Questions = qList.filter(q => q.sectionName?.includes('Descriptive'));
        submissionAnswers[s5Questions[0].id] = {
            textAnswer: 'To The Branch Manager, State Bank of India. Respected Sir, I am writing to request a new contactless EMV credit card after noticing an unauthorized debit alert. My savings account number is 1234567890. I have immediately blocked the compromised card via net banking.',
            timeSpentSeconds: 400,
        };
        submissionAnswers[s5Questions[1].id] = {
            textAnswer: 'Central Bank Digital Currency (CBDC) vs Cryptocurrencies represents a major shift in sovereign financial systems. The Reserve Bank of India has introduced the digital rupee (e₹) as legal tender backed by sovereign reserves. Unlike volatile private cryptocurrencies, CBDC provides settlement finality, eliminates counterparty credit risk, and enhances financial inclusion.',
            timeSpentSeconds: 600,
        };

        // Submit Attempt 1
        let submitRes = null;
        const mockReqSubmit = {
            params: { id: mainsTest.id },
            body: {
                attemptId: attempt1Id,
                answers: submissionAnswers,
                timeSpentSeconds: 5400,
                submissionReason: 'MANUAL',
            },
            user: { id: user.id },
        };
        const mockResSubmit = {
            status: () => mockResSubmit,
            json: (data) => { submitRes = data; return data; },
        };
        await TestController.submitTest(mockReqSubmit, mockResSubmit);

        // Fetch evaluated attempt record from DB
        const evaluatedAttempt = await prisma.testAttempt.findUnique({
            where: { id: attempt1Id },
            include: { answers: true },
        });

        const breakdown = JSON.parse(evaluatedAttempt.subjectBreakdown);
        const sec1Res = Object.values(breakdown).find(s => s.name === 'Reasoning & Computer Aptitude');
        const sec2Res = Object.values(breakdown).find(s => s.name === 'General / Economy / Banking Awareness');
        const sec3Res = Object.values(breakdown).find(s => s.name === 'English Language');
        const sec4Res = Object.values(breakdown).find(s => s.name === 'Data Analysis & Interpretation');
        const sec5Res = Object.values(breakdown).find(s => s.name?.includes('Descriptive'));

        // Verify objective section scores
        // Sec 1 (Reasoning, 45 Qs, 60 M => 1.333/Q): 10 correct (+13.33), 2 wrong (-0.50) => 12.83
        // Sec 2 (Banking, 40 Qs, 40 M => 1.0/Q): 20 correct (+20.0), 4 wrong (-1.00) => 19.00
        // Sec 3 (English, 35 Qs, 40 M => 1.143/Q): 10 correct (+11.43), 4 wrong (-1.00) => 10.43
        // Sec 4 (Quant, 35 Qs, 60 M => 1.714/Q): 10 correct (+17.14), 0 wrong (0.00) => 17.14
        const expSec1 = 10 * (60.0 / 45.0) - 2 * 0.25;
        const expSec2 = 20 * 1.0 - 4 * 0.25;
        const expSec3 = 10 * (40.0 / 35.0) - 4 * 0.25;
        const expSec4 = 10 * (60.0 / 35.0) - 0 * 0.25;

        const sec1Correct = Math.abs(sec1Res?.marks - expSec1) < 0.05;
        const sec2Correct = Math.abs(sec2Res?.marks - expSec2) < 0.05;
        const sec3Correct = Math.abs(sec3Res?.marks - expSec3) < 0.05;
        const sec4Correct = Math.abs(sec4Res?.marks - expSec4) < 0.05;

        const scoringPassed = sec1Correct && sec2Correct && sec3Correct && sec4Correct;

        recordResult(
            10,
            'Scoring and negative marking are applied correctly with section-specific weights and 0.25 penalty',
            scoringPassed,
            `Sec 1: ${sec1Res?.marks?.toFixed(2)} (exp ${expSec1.toFixed(2)}) | Sec 2: ${sec2Res?.marks?.toFixed(2)} (exp ${expSec2.toFixed(2)}) | Sec 3: ${sec3Res?.marks?.toFixed(2)} (exp ${expSec3.toFixed(2)}) | Sec 4: ${sec4Res?.marks?.toFixed(2)} (exp ${expSec4.toFixed(2)})`
        );

        // -------------------------------------------------------------
        // TEST 11: Descriptive answers are saved and are not scored as MCQs
        // -------------------------------------------------------------
        const descAnswers = evaluatedAttempt.answers.filter(a =>
            a.questionId === s5Questions[0].id || a.questionId === s5Questions[1].id
        );
        const descSaved = descAnswers.length === 2 &&
            descAnswers.every(a => a.textAnswer && a.textAnswer.length > 50 && a.isCorrect === false && a.aiScore > 0);
        const descScore = sec5Res?.marks;
        const descMaxMarks = sec5Res?.maxMarks;

        recordResult(
            11,
            'Descriptive answers are saved and are evaluated via transparent rubric up to 25 marks (not MCQs)',
            descSaved && descScore <= 25.0 && descMaxMarks === 25.0,
            `Descriptive Score: ${descScore} / ${descMaxMarks}, Evaluated via transparent rubric, isCorrect: false`
        );

        // -------------------------------------------------------------
        // TEST 12: Results are persisted in PostgreSQL
        // -------------------------------------------------------------
        const dbAttemptCheck = await prisma.testAttempt.findUnique({
            where: { id: attempt1Id },
        });
        const ansCountCheck = await prisma.answer.count({
            where: { attemptId: attempt1Id },
        });
        const histCountCheck = await prisma.questionHistory.count({
            where: { attemptId: attempt1Id },
        });

        const persistencePassed = dbAttemptCheck.isCompleted &&
            dbAttemptCheck.score > 0 &&
            dbAttemptCheck.totalMarks === 225.0 &&
            ansCountCheck === 157 &&
            histCountCheck === 157;

        recordResult(
            12,
            'Results are persisted in PostgreSQL (TestAttempt, Answers, QuestionHistory)',
            persistencePassed,
            `Attempt Status: ${dbAttemptCheck.status}, Final Score: ${dbAttemptCheck.score} / ${dbAttemptCheck.totalMarks}, Answers: ${ansCountCheck}/157, History: ${histCountCheck}/157`
        );

        // -------------------------------------------------------------
        // TEST 13: Other exam patterns remain unchanged
        // -------------------------------------------------------------
        console.log('--- Verifying Unchanged Exams (RRB NTPC, APPSC FBO & ABO) ---');
        const rrbExam = await prisma.exam.findUnique({
            where: { code: 'RRB_NTPC' },
            include: { stages: true },
        });
        const appscExam = await prisma.exam.findUnique({
            where: { code: 'APPSC_FBO_ABO' },
            include: { stages: true },
        });

        const rrbStage = rrbExam?.stages?.find(s => s.code === 'CBT_1');
        const appscStage = appscExam?.stages?.find(s => s.code === 'MAINS');

        const rrbUnchanged = rrbExam && rrbStage && rrbStage.totalQuestions === 100 && rrbStage.durationMinutes === 90;
        const appscUnchanged = appscExam && appscStage && appscStage.totalMarks === 250 && appscStage.totalQuestions === 201;

        recordResult(
            13,
            'Other exam patterns remain unchanged (RRB NTPC & APPSC FBO & ABO)',
            rrbUnchanged && appscUnchanged,
            `RRB NTPC CBT-1: ${rrbStage?.totalQuestions} Qs / ${rrbStage?.durationMinutes}m. APPSC FBO & ABO Mains: ${appscStage?.totalMarks} Marks.`
        );

    } catch (err) {
        console.error('Fatal error during verification:', err);
        allPassed = false;
    }

    console.log('\n========================================================================');
    console.log('📋 SUMMARY OF ALL 13 TEST RESULTS');
    console.log('========================================================================');
    for (const r of testResults) {
        console.log(`[TEST ${String(r.num).padStart(2, '0')}] ${r.passed ? '✅ PASS' : '❌ FAIL'}: ${r.description}`);
        console.log(`          ↳ ${r.details}`);
    }
    console.log('========================================================================');
    console.log(`FINAL RESULT: ${allPassed ? '🎉 ALL 13 TESTS PASSED PERFECTLY!' : '❌ SOME TESTS FAILED'}`);
    console.log('========================================================================\n');

    process.exit(allPassed ? 0 : 1);
}

runVerification()
    .catch((err) => {
        console.error('Verification script crashed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
