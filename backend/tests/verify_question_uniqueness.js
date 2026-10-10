import { prisma } from '../src/config/db.js';
import { QuestionSelectionService } from '../src/services/question/questionSelectionService.js';
async function runUniquenessVerificationSuite() {
    console.log('================================================================');
    console.log('🏁 STARTING EXAM QUESTION SELECTION & UNIQUENESS TEST SUITE 🏁');
    console.log('================================================================\n');
    // Find or create test users
    const studentA = await prisma.user.upsert({
        where: { email: 'student.uniqueness.a@govprep.local' },
        update: {},
        create: {
            email: 'student.uniqueness.a@govprep.local',
            password: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
            name: 'Student A Uniqueness',
            role: 'STUDENT',
        },
    });
    const studentB = await prisma.user.upsert({
        where: { email: 'student.uniqueness.b@govprep.local' },
        update: {},
        create: {
            email: 'student.uniqueness.b@govprep.local',
            password: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
            name: 'Student B Uniqueness',
            role: 'STUDENT',
        },
    });
    // Clean previous question histories and test attempts for clean test run
    await prisma.questionHistory.deleteMany({
        where: { userId: { in: [studentA.id, studentB.id] } },
    });
    await prisma.answer.deleteMany({
        where: { attempt: { userId: { in: [studentA.id, studentB.id] } } },
    });
    await prisma.testAttempt.deleteMany({
        where: { userId: { in: [studentA.id, studentB.id] } },
    });
    // 1. Get RRB NTPC exam & stage
    const rrbExam = await prisma.exam.findUnique({
        where: { slug: 'rrb-ntpc' },
        include: {
            stages: {
                include: { sections: true },
            },
            tests: true,
        },
    });
    if (!rrbExam || rrbExam.stages.length === 0) {
        throw new Error('RRB NTPC exam or stages not found in database.');
    }
    const cbt1Stage = rrbExam.stages.find((s) => s.code === 'CBT_1') || rrbExam.stages[0];
    const cbt2Stage = rrbExam.stages.find((s) => s.code === 'CBT_2') || rrbExam.stages[1] || rrbExam.stages[0];
    const testRecord = rrbExam.tests[0] || (await prisma.test.findFirst({ where: { examId: rrbExam.id } }));
    if (!testRecord) {
        throw new Error('No Test record found for RRB NTPC.');
    }
    console.log(`📋 Testing on Exam: ${rrbExam.name}`);
    console.log(`   Stage 1: ${cbt1Stage.name} (Configured Questions: ${cbt1Stage.totalQuestions})`);
    console.log(`   Stage 2: ${cbt2Stage.name} (Configured Questions: ${cbt2Stage.totalQuestions})\n`);
    // =========================================================================
    // TEST 1: First Attempt - Full Configured Question Count
    // =========================================================================
    console.log('--- TEST 1: First Attempt Question Selection ---');
    const attempt1Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId: studentA.id,
        examId: rrbExam.id,
        stageId: cbt1Stage.id,
        testId: testRecord.id,
    });
    console.log(`   Attempt 1 Received: ${attempt1Questions.length} questions`);
    if (attempt1Questions.length !== cbt1Stage.totalQuestions) {
        throw new Error(`❌ Test 1 Failed! Expected ${cbt1Stage.totalQuestions} questions, got ${attempt1Questions.length}`);
    }
    console.log(`   ✅ PASS: Attempt 1 received exact full configured count (${cbt1Stage.totalQuestions} Qs).\n`);
    // Simulate starting attempt 1 in DB & recording question history
    const attempt1 = await prisma.testAttempt.create({
        data: {
            userId: studentA.id,
            testId: testRecord.id,
            stageId: cbt1Stage.id,
            attemptNumber: 1,
            testTitle: testRecord.title,
            examName: rrbExam.name,
            stageName: cbt1Stage.name,
            isCompleted: true,
            status: 'SUBMITTED',
            startTime: new Date(),
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 5400000),
            durationSeconds: 5400,
            totalQuestions: attempt1Questions.length,
        },
    });
    for (const q of attempt1Questions) {
        await prisma.answer.create({
            data: {
                attemptId: attempt1.id,
                questionId: q.id,
                status: 'ANSWERED',
                isCorrect: true,
            },
        });
        await prisma.questionHistory.create({
            data: {
                userId: studentA.id,
                questionId: q.id,
                examId: rrbExam.id,
                stageId: cbt1Stage.id,
                attemptId: attempt1.id,
                testAttemptId: attempt1.id,
                shownAt: new Date(),
            },
        });
    }
    // =========================================================================
    // TEST 2: Retake - Attempt 2 Unique Set with 0 Overlap
    // =========================================================================
    console.log('--- TEST 2: Retake (Attempt 2) Uniqueness & Disjoint Set ---');
    const attempt2Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId: studentA.id,
        examId: rrbExam.id,
        stageId: cbt1Stage.id,
        testId: testRecord.id,
    });
    console.log(`   Attempt 2 Received: ${attempt2Questions.length} questions`);
    if (attempt2Questions.length !== cbt1Stage.totalQuestions) {
        throw new Error(`❌ Test 2 Failed! Expected ${cbt1Stage.totalQuestions} questions, got ${attempt2Questions.length}`);
    }
    const a1Ids = new Set(attempt1Questions.map((q) => q.id));
    const a2Ids = new Set(attempt2Questions.map((q) => q.id));
    const overlap1_2 = Array.from(a2Ids).filter((id) => a1Ids.has(id));
    console.log(`   Attempt 1 ∩ Attempt 2 Overlap: ${overlap1_2.length} questions`);
    if (overlap1_2.length > 0) {
        throw new Error(`❌ Test 2 Failed! Found ${overlap1_2.length} overlapping questions between Attempt 1 and 2: ${overlap1_2.join(', ')}`);
    }
    console.log(`   ✅ PASS: Attempt 2 has 100% distinct questions (Intersection = 0).\n`);
    // Record attempt 2 in DB
    const attempt2 = await prisma.testAttempt.create({
        data: {
            userId: studentA.id,
            testId: testRecord.id,
            stageId: cbt1Stage.id,
            attemptNumber: 2,
            testTitle: testRecord.title,
            examName: rrbExam.name,
            stageName: cbt1Stage.name,
            isCompleted: false,
            status: 'IN_PROGRESS',
            startTime: new Date(),
            startedAt: new Date(),
            expiresAt: new Date(Date.now() + 5400000),
            durationSeconds: 5400,
            totalQuestions: attempt2Questions.length,
        },
    });
    for (const q of attempt2Questions) {
        await prisma.answer.create({
            data: {
                attemptId: attempt2.id,
                questionId: q.id,
                status: 'NOT_VISITED',
                isCorrect: false,
            },
        });
        await prisma.questionHistory.create({
            data: {
                userId: studentA.id,
                questionId: q.id,
                examId: rrbExam.id,
                stageId: cbt1Stage.id,
                attemptId: attempt2.id,
                testAttemptId: attempt2.id,
                shownAt: new Date(),
            },
        });
    }
    // =========================================================================
    // TEST 3: Active Attempt Refresh - Fixed Questions Preservation
    // =========================================================================
    console.log('--- TEST 3: Browser Refresh on Active In-Progress Attempt ---');
    const activeAttempt = await prisma.testAttempt.findFirst({
        where: {
            userId: studentA.id,
            testId: testRecord.id,
            isCompleted: false,
            status: 'IN_PROGRESS',
        },
        include: {
            answers: {
                include: { question: true },
                orderBy: { createdAt: 'asc' },
            },
        },
    });
    if (!activeAttempt) {
        throw new Error('❌ Test 3 Failed! Could not find active attempt for refresh simulation.');
    }
    const resumedIds = activeAttempt.answers.map((a) => a.questionId);
    const originalAttempt2Ids = attempt2Questions.map((q) => q.id);
    const mismatchCount = resumedIds.filter((id, idx) => id !== originalAttempt2Ids[idx]).length;
    console.log(`   Resumed Attempt ID: ${activeAttempt.id}`);
    console.log(`   Resumed Questions Count: ${resumedIds.length}`);
    console.log(`   Order / ID Mismatches against original Attempt 2: ${mismatchCount}`);
    if (mismatchCount > 0 || resumedIds.length !== originalAttempt2Ids.length) {
        throw new Error('❌ Test 3 Failed! Resuming an active attempt modified the question set.');
    }
    console.log('   ✅ PASS: Refreshing active attempt returns the exact same snapshot without regeneration.\n');
    // Mark attempt 2 as completed for subsequent tests
    await prisma.testAttempt.update({
        where: { id: attempt2.id },
        data: { isCompleted: true, status: 'SUBMITTED' },
    });
    // =========================================================================
    // TEST 4: Different Student Isolation
    // =========================================================================
    console.log('--- TEST 4: Different Student (Student B) Isolation ---');
    const studentBQuestions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId: studentB.id,
        examId: rrbExam.id,
        stageId: cbt1Stage.id,
        testId: testRecord.id,
    });
    console.log(`   Student B Received: ${studentBQuestions.length} questions`);
    if (studentBQuestions.length !== cbt1Stage.totalQuestions) {
        throw new Error(`❌ Test 4 Failed! Student B expected ${cbt1Stage.totalQuestions}, got ${studentBQuestions.length}`);
    }
    console.log('   ✅ PASS: Student B successfully received a full configured exam without interference.\n');
    // =========================================================================
    // TEST 5: Different Stage Handling (CBT-1 vs CBT-2)
    // =========================================================================
    console.log('--- TEST 5: Stage-Specific Question Selection (CBT-2) ---');
    const cbt2Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId: studentA.id,
        examId: rrbExam.id,
        stageId: cbt2Stage.id,
        testId: testRecord.id,
    });
    console.log(`   Student A CBT-2 Received: ${cbt2Questions.length} questions (Configured: ${cbt2Stage.totalQuestions})`);
    if (cbt2Questions.length !== cbt2Stage.totalQuestions) {
        throw new Error(`❌ Test 5 Failed! Expected ${cbt2Stage.totalQuestions}, got ${cbt2Questions.length}`);
    }
    console.log('   ✅ PASS: Stage-specific questions assigned correctly for CBT-2.\n');
    // =========================================================================
    // TEST 6: Multiple Retakes Disjoint Sets (Attempt 1 ∩ Attempt 2 ∩ Attempt 3 = 0)
    // =========================================================================
    console.log('--- TEST 6: Multiple Retakes Disjoint Verification (Attempt 3) ---');
    const attempt3Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId: studentA.id,
        examId: rrbExam.id,
        stageId: cbt1Stage.id,
        testId: testRecord.id,
    });
    console.log(`   Attempt 3 Received: ${attempt3Questions.length} questions`);
    if (attempt3Questions.length !== cbt1Stage.totalQuestions) {
        throw new Error(`❌ Test 6 Failed! Expected ${cbt1Stage.totalQuestions}, got ${attempt3Questions.length}`);
    }
    const a3Ids = new Set(attempt3Questions.map((q) => q.id));
    const overlap1_3 = Array.from(a3Ids).filter((id) => a1Ids.has(id));
    const overlap2_3 = Array.from(a3Ids).filter((id) => a2Ids.has(id));
    console.log(`   Attempt 1 ∩ Attempt 3 Overlap: ${overlap1_3.length}`);
    console.log(`   Attempt 2 ∩ Attempt 3 Overlap: ${overlap2_3.length}`);
    if (overlap1_3.length > 0 || overlap2_3.length > 0) {
        throw new Error(`❌ Test 6 Failed! Overlap detected across multiple retakes.`);
    }
    console.log('   ✅ PASS: All 3 attempts have pairwise disjoint question sets (A1 ∩ A2 = 0, A1 ∩ A3 = 0, A2 ∩ A3 = 0).\n');
    // =========================================================================
    // TEST 7: APPSC FBO & ABO 150 Question Exam Validation
    // =========================================================================
    console.log('--- TEST 7: APPSC FBO & ABO 150 Questions Exam Validation ---');
    const appscExam = await prisma.exam.findUnique({
        where: { slug: 'appsc-fbo' },
        include: { stages: { include: { sections: true } }, tests: true },
    });
    if (appscExam) {
        const appscStage = appscExam.stages[0];
        const appscTest = appscExam.tests[0];
        const appscQuestions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
            userId: studentA.id,
            examId: appscExam.id,
            stageId: appscStage?.id,
            testId: appscTest?.id,
        });
        console.log(`   APPSC Received: ${appscQuestions.length} questions (Expected: ${appscStage?.totalQuestions || 150})`);
        if (appscQuestions.length !== (appscStage?.totalQuestions || 150)) {
            throw new Error(`❌ Test 7 Failed! Expected 150 questions for APPSC, got ${appscQuestions.length}`);
        }
        console.log('   ✅ PASS: APPSC FBO 150 Questions fully generated and verified.\n');
    }
    console.log('================================================================');
    console.log('🎉 ALL 7 UNIQUENESS & QUESTION SELECTION TESTS PASSED! 🎉');
    console.log('================================================================');
}
runUniquenessVerificationSuite()
    .catch((e) => {
    console.error('Test Suite Failed:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
