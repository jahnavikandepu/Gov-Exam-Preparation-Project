import { PrismaClient } from '@prisma/client';
import { QuestionSelectionService } from '../services/question/questionSelectionService.js';
const prisma = new PrismaClient();
async function runTests() {
    console.log('====================================================');
    console.log('STARTING GOVPREP FULL EXAM SUITE VERIFICATION');
    console.log('====================================================\n');
    // Find or create test user
    let user = await prisma.user.findFirst({ where: { role: 'STUDENT' } });
    if (!user) {
        user = await prisma.user.create({
            data: {
                email: 'test_student_verification@govprep.com',
                name: 'Test Verification Student',
                password: 'password123',
                role: 'STUDENT',
                targetExam: 'RRB_NTPC',
            },
        });
    }
    // Clear previous test question history for clean test runs if needed
    await prisma.questionHistory.deleteMany({ where: { userId: user.id } });
    await prisma.testAttempt.deleteMany({ where: { userId: user.id } });
    const testCases = [
        {
            name: 'Test 1: RRB NTPC CBT-1',
            examCode: 'RRB_NTPC',
            stageCode: 'CBT_1',
            stageName: 'CBT-1',
            expectedTotal: 100,
            expectedDuration: 90,
            expectedNegMark: 0.33,
            expectedSections: [
                { name: 'General Awareness', count: 40 },
                { name: 'Mathematics', count: 30 },
                { name: 'General Intelligence & Reasoning', count: 30 },
            ],
        },
        {
            name: 'Test 2: RRB NTPC CBT-2',
            examCode: 'RRB_NTPC',
            stageCode: 'CBT_2',
            stageName: 'CBT-2',
            expectedTotal: 120,
            expectedDuration: 90,
            expectedNegMark: 0.33,
            expectedSections: [
                { name: 'General Awareness', count: 50 },
                { name: 'Mathematics', count: 35 },
                { name: 'General Intelligence & Reasoning', count: 35 },
            ],
        },
        {
            name: 'Test 3: RRB JE CBT-1',
            examCode: 'RRB_JE',
            stageCode: 'CBT_1',
            stageName: 'CBT-1',
            expectedTotal: 100,
            expectedDuration: 90,
            expectedNegMark: 0.33,
            expectedSections: [
                { name: 'Mathematics', count: 30 },
                { name: 'General Intelligence & Reasoning', count: 25 },
                { name: 'General Awareness', count: 15 },
                { name: 'General Science', count: 30 },
            ],
        },
        {
            name: 'Test 4: RRB JE CBT-2',
            examCode: 'RRB_JE',
            stageCode: 'CBT_2',
            stageName: 'CBT-2',
            expectedTotal: 150,
            expectedDuration: 120,
            expectedNegMark: 0.33,
            expectedSections: [
                { name: 'General Awareness', count: 15 },
                { name: 'Physics & Chemistry', count: 15 },
                { name: 'Basics of Computers & Applications', count: 10 },
                { name: 'Basics of Environment & Pollution Control', count: 10 },
                { name: 'Technical Abilities (Civil / Electrical / Electronics / Mechanical)', count: 100 },
            ],
        },
        {
            name: 'Test 5: RRB Group D',
            examCode: 'RRB_GROUP_D',
            stageCode: 'CBT',
            stageName: 'CBT',
            expectedTotal: 100,
            expectedDuration: 90,
            expectedNegMark: 0.33,
            expectedSections: [
                { name: 'General Science', count: 25 },
                { name: 'Mathematics', count: 25 },
                { name: 'General Intelligence & Reasoning', count: 30 },
                { name: 'General Awareness & Current Affairs', count: 20 },
            ],
        },
        {
            name: 'Test 6: IBPS PO Prelims',
            examCode: 'IBPS_PO',
            stageCode: 'PRELIMS',
            stageName: 'Prelims',
            expectedTotal: 100,
            expectedDuration: 60,
            expectedNegMark: 0.25,
            expectedSections: [
                { name: 'English Language', count: 30 },
                { name: 'Quantitative Aptitude', count: 35 },
                { name: 'Reasoning Ability', count: 35 },
            ],
        },
        {
            name: 'Test 7: APPSC FBO & ABO',
            examCode: 'APPSC_FBO_ABO',
            stageCode: 'SCREENING',
            stageName: 'Screening Test',
            expectedTotal: 150,
            expectedDuration: 150,
            expectedNegMark: 0.33,
            expectedSections: [
                { name: 'Part A: General Studies & Mental Ability', count: 75 },
                { name: 'Part B: General Science & General Mathematics', count: 75 },
            ],
        },
    ];
    let allPassed = true;
    const failedTests = [];
    for (const tc of testCases) {
        console.log(`\n----------------------------------------------------`);
        console.log(`RUNNING: ${tc.name}`);
        console.log(`----------------------------------------------------`);
        const exam = await prisma.exam.findUnique({
            where: { code: tc.examCode },
            include: {
                stages: {
                    include: {
                        sections: true,
                    },
                },
            },
        });
        if (!exam) {
            console.error(`❌ Exam ${tc.examCode} not found in database!`);
            allPassed = false;
            continue;
        }
        const stage = exam.stages.find((s) => s.code === tc.stageCode || s.name === tc.stageName) || exam.stages[0];
        if (!stage) {
            console.error(`❌ Stage ${tc.stageName} not found for exam ${tc.examCode}!`);
            allPassed = false;
            continue;
        }
        console.log(`Configured Exam: ${exam.name} (${exam.code})`);
        console.log(`Configured Stage: ${stage.name}`);
        console.log(`Configured Total Questions: ${stage.totalQuestions} (Expected: ${tc.expectedTotal})`);
        console.log(`Configured Duration: ${stage.durationMinutes} mins (Expected: ${tc.expectedDuration})`);
        console.log(`Configured Negative Marks: ${stage.negativeMarks} (Expected: ${tc.expectedNegMark})`);
        let tcPassed = true;
        if (stage.totalQuestions !== tc.expectedTotal) {
            console.error(`❌ Total Questions mismatch! Got ${stage.totalQuestions}, expected ${tc.expectedTotal}`);
            allPassed = false;
            tcPassed = false;
        }
        if (stage.durationMinutes !== tc.expectedDuration) {
            console.error(`❌ Duration mismatch! Got ${stage.durationMinutes}, expected ${tc.expectedDuration}`);
            allPassed = false;
            tcPassed = false;
        }
        // Now test QuestionSelectionService
        const questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
            userId: user.id,
            examId: exam.id,
            stageId: stage.id,
            devTestMode: false,
        });
        console.log(`Selected Questions Count: ${questions.length}`);
        if (questions.length !== tc.expectedTotal) {
            console.error(`❌ Selected questions count mismatch! Got ${questions.length}, expected ${tc.expectedTotal}`);
            allPassed = false;
            tcPassed = false;
        }
        else {
            console.log(`✅ Total question count verified: ${questions.length} / ${tc.expectedTotal}`);
        }
        // Check section distribution
        const sectionCounts = {};
        const seenIds = new Set();
        let hasDuplicate = false;
        for (const q of questions) {
            if (seenIds.has(q.id)) {
                hasDuplicate = true;
            }
            seenIds.add(q.id);
            const secName = q.sectionName || 'Unknown';
            sectionCounts[secName] = (sectionCounts[secName] || 0) + 1;
        }
        if (hasDuplicate) {
            console.error(`❌ Duplicate questions found in single attempt!`);
            allPassed = false;
            tcPassed = false;
        }
        else {
            console.log(`✅ All ${questions.length} questions are completely unique.`);
        }
        console.log('Section-wise Question Breakdown:');
        for (const expSec of tc.expectedSections) {
            const actualCount = sectionCounts[expSec.name] || 0;
            console.log(`  - ${expSec.name}: ${actualCount} / ${expSec.count} required`);
            if (actualCount !== expSec.count) {
                console.error(`    ❌ Section count mismatch for ${expSec.name}`);
                allPassed = false;
                tcPassed = false;
            }
        }
        if (!tcPassed) {
            failedTests.push(tc.name);
        }
    }
    // TEST 8: Uniqueness & Retake Test (Attempt 1 vs Attempt 2 for RRB NTPC CBT-1)
    console.log(`\n====================================================`);
    console.log(`TEST 8: RETAKE & UNIQUENESS TEST (Attempt 1 vs Attempt 2)`);
    console.log(`====================================================`);
    const rrbExam = await prisma.exam.findUnique({
        where: { code: 'RRB_NTPC' },
        include: { stages: { include: { sections: true } } },
    });
    const cbt1Stage = rrbExam.stages.find((s) => s.name.includes('CBT-1'));
    // Select Attempt 1
    const attempt1Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId: user.id,
        examId: rrbExam.id,
        stageId: cbt1Stage.id,
        devTestMode: false,
    });
    // Record questions in history as shown
    for (const q of attempt1Questions) {
        await prisma.questionHistory.create({
            data: {
                userId: user.id,
                questionId: q.id,
                examId: rrbExam.id,
                stageId: cbt1Stage.id,
                attemptId: 'test_attempt_1',
            },
        });
    }
    console.log(`Attempt 1 generated: ${attempt1Questions.length} questions`);
    // Select Attempt 2
    const attempt2Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId: user.id,
        examId: rrbExam.id,
        stageId: cbt1Stage.id,
        devTestMode: false,
    });
    console.log(`Attempt 2 generated: ${attempt2Questions.length} questions`);
    const attempt1Ids = new Set(attempt1Questions.map((q) => q.id));
    const overlap = attempt2Questions.filter((q) => attempt1Ids.has(q.id));
    console.log(`Overlap between Attempt 1 and Attempt 2: ${overlap.length} questions`);
    if (overlap.length === 0) {
        console.log(`✅ Attempt 2 contains 100% NEW unique questions not in Attempt 1!`);
    }
    else {
        console.error(`❌ Found ${overlap.length} repeating questions in Attempt 2!`);
        allPassed = false;
        failedTests.push('Test 8: Retake & Uniqueness');
    }
    // TEST 9: Development Test Mode (4 Questions)
    console.log(`\n====================================================`);
    console.log(`TEST 9: DEVELOPMENT TEST MODE (devTestMode === true)`);
    console.log(`====================================================`);
    const devTestQuestions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId: user.id,
        examId: rrbExam.id,
        stageId: cbt1Stage.id,
        devTestMode: true,
    });
    console.log(`Dev Test Mode Questions Count: ${devTestQuestions.length}`);
    if (devTestQuestions.length === 4) {
        console.log(`✅ Dev Test Mode successfully generated exactly 4 questions.`);
    }
    else {
        console.error(`❌ Dev Test Mode expected 4 questions, got ${devTestQuestions.length}`);
        allPassed = false;
        failedTests.push('Test 9: Development Test Mode');
    }
    console.log(`\n====================================================`);
    if (failedTests.length === 0) {
        console.log(`🎉 ALL TESTS PASSED SUCCESSFULLY! FULL EXAM SYSTEM VERIFIED.`);
    }
    else {
        console.log(`⚠️ THE FOLLOWING TESTS FAILED: ${failedTests.join(', ')}`);
    }
    console.log(`====================================================\n`);
    await prisma.$disconnect();
}
runTests().catch((err) => {
    console.error('Test execution failed:', err);
    prisma.$disconnect();
    process.exit(1);
});
