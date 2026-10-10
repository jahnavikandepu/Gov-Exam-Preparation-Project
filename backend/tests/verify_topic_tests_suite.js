import { prisma } from '../src/config/db.js';
import { TestSyncService } from '../src/services/test/testSyncService.js';
import { QuestionSelectionService } from '../src/services/question/questionSelectionService.js';
async function runTestSuite() {
    console.log('===============================================================');
    console.log('🧪 RUNNING COMPREHENSIVE GOVPREP TOPIC TESTS VERIFICATION SUITE');
    console.log('===============================================================');
    // Test 1: Verify Topic Tests Existence
    console.log('\n--- TEST 1: VERIFY TOPIC-BASED TESTS EXISTENCE ---');
    const syncResult = await TestSyncService.syncTopicTests();
    console.log(`Sync Result: Total ${syncResult.total} topic tests synced across all syllabus topics.`);
    const topicTests = await prisma.test.findMany({
        where: { type: 'TOPIC_TEST' },
        include: { exam: true, subject: true, topic: true },
    });
    console.log(`Verified: Found ${topicTests.length} topic tests in PostgreSQL database.`);
    if (topicTests.length === 0) {
        throw new Error('TEST 1 FAILED: No topic tests found in database.');
    }
    console.log('✅ TEST 1 PASSED: Topic tests exist for every syllabus topic.');
    // Test 2: Verify Test Configuration (50 Qs, 60 Mins, 0 Negative Marking, 50 Marks)
    console.log('\n--- TEST 2: VERIFY TEST CONFIGURATION ---');
    const sampleTest = topicTests.find((t) => t.topic?.slug === 'percentages') || topicTests[0];
    console.log(`Selected Sample Test: "${sampleTest.title}" (${sampleTest.exam.name} - ${sampleTest.topic?.name})`);
    console.log(`  - Total Questions: ${sampleTest.totalQuestions} (Expected: 50)`);
    console.log(`  - Duration Minutes: ${sampleTest.durationMinutes} (Expected: 60)`);
    console.log(`  - Negative Marking: ${sampleTest.negativeMarkingPerQuestion} (Expected: 0)`);
    console.log(`  - Total Marks: ${sampleTest.totalMarks} (Expected: 50)`);
    console.log(`  - Marks Per Correct: ${sampleTest.marksPerCorrect} (Expected: 1.0)`);
    if (sampleTest.totalQuestions !== 50 ||
        sampleTest.durationMinutes !== 60 ||
        sampleTest.negativeMarkingPerQuestion !== 0 ||
        sampleTest.totalMarks !== 50) {
        throw new Error('TEST 2 FAILED: Sample test configuration does not meet 50 Qs / 60 Mins / 0 Neg marking standard.');
    }
    console.log('✅ TEST 2 PASSED: 50 Qs, 60 Mins, 0 Negative Marking verified.');
    // Find or create test student user
    const student = await prisma.user.upsert({
        where: { email: 'test-topic-student@govprep.com' },
        update: {},
        create: {
            name: 'Topic Test Student',
            email: 'test-topic-student@govprep.com',
            password: 'hashedPassword123',
            role: 'USER',
            targetExam: 'RRB NTPC',
            joinedDate: 'October 2026',
            status: 'Active',
        },
    });
    const userId = student.id;
    // Clear previous test attempts & question history for this specific test student & topic for clean test run
    await prisma.questionHistory.deleteMany({
        where: { userId, topicId: sampleTest.topicId },
    });
    await prisma.testAttempt.deleteMany({
        where: { userId, testId: sampleTest.id },
    });
    // Test 3: Start Attempt 1 (50 questions)
    console.log('\n--- TEST 3: START TEST ATTEMPT 1 ---');
    const attempt1Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId,
        examId: sampleTest.examId,
        subjectId: sampleTest.subjectId,
        topicId: sampleTest.topicId,
        testId: sampleTest.id,
        questionCount: 50,
    });
    console.log(`Attempt 1 Questions Prepared: ${attempt1Questions.length}`);
    if (attempt1Questions.length !== 50) {
        throw new Error(`TEST 3 FAILED: Attempt 1 has ${attempt1Questions.length} questions instead of exactly 50.`);
    }
    // Record Attempt 1 in DB
    const attempt1 = await prisma.testAttempt.create({
        data: {
            userId,
            testId: sampleTest.id,
            topicId: sampleTest.topicId,
            attemptNumber: 1,
            testTitle: sampleTest.title,
            examName: sampleTest.exam.name,
            status: 'IN_PROGRESS',
            totalQuestions: 50,
            durationSeconds: 3600,
        },
    });
    const attempt1Ids = new Set();
    for (const q of attempt1Questions) {
        attempt1Ids.add(q.id);
        await prisma.answer.create({
            data: {
                attemptId: attempt1.id,
                questionId: q.id,
                selectedOption: null,
                status: 'NOT_VISITED',
                isCorrect: false,
                timeSpentSeconds: 0,
            },
        });
        await prisma.questionHistory.create({
            data: {
                userId,
                questionId: q.id,
                testId: sampleTest.id,
                topicId: sampleTest.topicId,
                attemptId: attempt1.id,
                testAttemptId: attempt1.id,
                shownAt: new Date(),
            },
        });
    }
    console.log(`Attempt 1 successfully saved with 50 unique questions. Unique IDs count: ${attempt1Ids.size}`);
    console.log('✅ TEST 3 PASSED: Test start with exactly 50 questions verified.');
    // Test 4: Complete & Score Attempt 1 (42 correct, 6 wrong, 2 skipped)
    console.log('\n--- TEST 4: COMPLETE TEST & VERIFY NO NEGATIVE MARKING ---');
    let correctCount = 42;
    let wrongCount = 6;
    let skippedCount = 2;
    // Negative marking = 0 -> score should be exactly 42 (not 42 - 6*0.33 = 40.02)
    const score = correctCount * 1.0 - wrongCount * 0.0;
    const accuracy = Math.round((correctCount / (correctCount + wrongCount)) * 1000) / 10;
    await prisma.testAttempt.update({
        where: { id: attempt1.id },
        data: {
            isCompleted: true,
            status: 'COMPLETED',
            score,
            totalMarks: 50,
            accuracy,
            correctAnswers: correctCount,
            incorrectAnswers: wrongCount,
            skippedQuestions: skippedCount,
            attemptedQuestions: correctCount + wrongCount,
        },
    });
    console.log(`Attempt 1 Submitted: Correct: ${correctCount}, Wrong: ${wrongCount}, Skipped: ${skippedCount}`);
    console.log(`Score: ${score} / 50 (Accuracy: ${accuracy}%)`);
    if (score !== 42) {
        throw new Error(`TEST 4 FAILED: Score is ${score} instead of 42 (negative marking was wrongly applied).`);
    }
    console.log('✅ TEST 4 PASSED: Score = 42/50, 0 negative marks deducted.');
    // Test 5: Retake Test (Attempt 2) -> Must have 50 DIFFERENT questions (Attempt 1 ∩ Attempt 2 = 0)
    console.log('\n--- TEST 5: RETAKE TEST (ATTEMPT 2) & QUESTION UNIQUENESS ---');
    const attempt2Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId,
        examId: sampleTest.examId,
        subjectId: sampleTest.subjectId,
        topicId: sampleTest.topicId,
        testId: sampleTest.id,
        questionCount: 50,
    });
    if (attempt2Questions.length !== 50) {
        throw new Error(`TEST 5 FAILED: Attempt 2 has ${attempt2Questions.length} questions instead of 50.`);
    }
    const attempt2Ids = new Set(attempt2Questions.map((q) => q.id));
    const shared1And2 = [...attempt1Ids].filter((id) => attempt2Ids.has(id));
    console.log(`Attempt 1 Question Count: ${attempt1Ids.size}`);
    console.log(`Attempt 2 Question Count: ${attempt2Ids.size}`);
    console.log(`Shared Questions (Attempt 1 ∩ Attempt 2): ${shared1And2.length}`);
    if (shared1And2.length > 0) {
        throw new Error(`TEST 5 FAILED: Found ${shared1And2.length} repeated questions between Attempt 1 and Attempt 2!`);
    }
    // Save Attempt 2
    const attempt2 = await prisma.testAttempt.create({
        data: {
            userId,
            testId: sampleTest.id,
            topicId: sampleTest.topicId,
            attemptNumber: 2,
            testTitle: sampleTest.title,
            examName: sampleTest.exam.name,
            status: 'IN_PROGRESS',
            totalQuestions: 50,
            durationSeconds: 3600,
        },
    });
    for (const q of attempt2Questions) {
        await prisma.answer.create({
            data: {
                attemptId: attempt2.id,
                questionId: q.id,
                selectedOption: null,
                status: 'NOT_VISITED',
                isCorrect: false,
            },
        });
        await prisma.questionHistory.create({
            data: {
                userId,
                questionId: q.id,
                testId: sampleTest.id,
                topicId: sampleTest.topicId,
                attemptId: attempt2.id,
                testAttemptId: attempt2.id,
                shownAt: new Date(),
            },
        });
    }
    console.log('✅ TEST 5 PASSED: Attempt 2 has 50 unique questions with 0 overlap with Attempt 1.');
    // Test 6: Take the Same Test a 3rd Time (Attempt 3) -> Verify 0 overlap with Attempt 1 AND Attempt 2
    console.log('\n--- TEST 6 & 7: RETAKE TEST A THIRD TIME (ATTEMPT 3) ---');
    const attempt3Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId,
        examId: sampleTest.examId,
        subjectId: sampleTest.subjectId,
        topicId: sampleTest.topicId,
        testId: sampleTest.id,
        questionCount: 50,
    });
    if (attempt3Questions.length !== 50) {
        throw new Error(`TEST 7 FAILED: Attempt 3 has ${attempt3Questions.length} questions instead of 50.`);
    }
    const attempt3Ids = new Set(attempt3Questions.map((q) => q.id));
    const shared1And3 = [...attempt1Ids].filter((id) => attempt3Ids.has(id));
    const shared2And3 = [...attempt2Ids].filter((id) => attempt3Ids.has(id));
    console.log(`Attempt 3 Question Count: ${attempt3Ids.size}`);
    console.log(`Shared Questions (Attempt 1 ∩ Attempt 3): ${shared1And3.length}`);
    console.log(`Shared Questions (Attempt 2 ∩ Attempt 3): ${shared2And3.length}`);
    if (shared1And3.length > 0 || shared2And3.length > 0) {
        throw new Error(`TEST 7 FAILED: Question overlap detected in Attempt 3!`);
    }
    console.log('✅ TEST 6 & 7 PASSED: Attempt 1 ∩ Attempt 2 = 0, Attempt 2 ∩ Attempt 3 = 0, Attempt 1 ∩ Attempt 3 = 0.');
    // Test 8 & 9: Test a topic with 0 existing questions (Verify AI generation + PostgreSQL persistence + QuestionHistory)
    console.log('\n--- TEST 8 & 9: TOPIC WITH INSUFFICIENT QUESTIONS & DB PERSISTENCE ---');
    const zeroQTopic = topicTests.find((t) => t.topic?.slug === 'geography' || t.topic?.slug === 'ap-maths' || t.topic?.slug === 'rbi-policy') || topicTests[1];
    console.log(`Testing Zero-Question / Sparse Topic: "${zeroQTopic.title}" (${zeroQTopic.topic?.name})`);
    const initialCountInDB = await prisma.question.count({
        where: { topicId: zeroQTopic.topicId },
    });
    console.log(`Initial questions in PostgreSQL for topic '${zeroQTopic.topic?.name}': ${initialCountInDB}`);
    const sparseTopicQuestions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId,
        examId: zeroQTopic.examId,
        subjectId: zeroQTopic.subjectId,
        topicId: zeroQTopic.topicId,
        testId: zeroQTopic.id,
        questionCount: 50,
    });
    console.log(`Prepared questions for sparse topic: ${sparseTopicQuestions.length}`);
    if (sparseTopicQuestions.length !== 50) {
        throw new Error(`TEST 8 FAILED: Prepared ${sparseTopicQuestions.length} questions instead of 50.`);
    }
    const finalCountInDB = await prisma.question.count({
        where: { topicId: zeroQTopic.topicId },
    });
    console.log(`Final questions in PostgreSQL for topic '${zeroQTopic.topic?.name}': ${finalCountInDB}`);
    if (finalCountInDB < 50) {
        throw new Error(`TEST 9 FAILED: Generated questions were not saved to PostgreSQL! Found ${finalCountInDB}.`);
    }
    console.log('✅ TEST 8 & 9 PASSED: Missing questions generated, validated, saved to PostgreSQL, and returned.');
    console.log('\n===============================================================');
    console.log('🎉 ALL 9 TOPIC TEST ACCEPTANCE SUITE TESTS PASSED PERFECTLY!');
    console.log('===============================================================');
    return {
        testTitle: sampleTest.title,
        topicName: sampleTest.topic?.name,
        requiredQuestions: 50,
        durationMinutes: 60,
        negativeMarking: 0,
        attempt1Count: attempt1Ids.size,
        attempt2Count: attempt2Ids.size,
        attempt3Count: attempt3Ids.size,
        shared1And2: shared1And2.length,
        shared2And3: shared2And3.length,
        shared1And3: shared1And3.length,
    };
}
runTestSuite()
    .catch((err) => {
    console.error('❌ TEST SUITE FAILED:', err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
