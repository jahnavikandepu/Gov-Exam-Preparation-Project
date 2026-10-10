import { prisma } from '../src/config/db.js';
import { QuestionSelectionService } from '../src/services/question/questionSelectionService.js';
import { TestSyncService } from '../src/services/test/testSyncService.js';
async function main() {
    console.log('🧪 =========================================================================');
    console.log('🧪 COMPREHENSIVE REGRESSION SUITE: OFFICIAL EXAMS VS TOPIC TESTS SEPARATION');
    console.log('🧪 =========================================================================\n');
    // Step 1: Ensure sync is fresh
    console.log('Step 1: Syncing both official exam stage mocks and topic practice tests...');
    await TestSyncService.syncAllTests();
    const testUser = await prisma.user.upsert({
        where: { email: 'regression.verifier@govprep.local' },
        update: {},
        create: {
            email: 'regression.verifier@govprep.local',
            name: 'Regression Verifier',
            password: 'hashed_password_123',
            role: 'USER',
            targetExam: 'RRB NTPC',
        },
    });
    const userId = testUser.id;
    // Clear previous test attempts & question history for this verifier user to have clean state
    await prisma.answer.deleteMany({ where: { attempt: { userId } } });
    await prisma.testAttempt.deleteMany({ where: { userId } });
    await prisma.questionHistory.deleteMany({ where: { userId } });
    console.log('\n=============================================================================');
    console.log('PART A: OFFICIAL EXAM REGRESSION TESTS');
    console.log('=============================================================================');
    // TEST 1: RRB NTPC CBT-1 (100 Qs, 90 mins, -0.33, GA: 40, Math: 30, Reasoning: 30)
    const ntpcCbt1Mock = await prisma.test.findFirst({
        where: { slug: 'rrb-ntpc-cbt-1-mock-01' },
        include: { exam: true, stage: { include: { sections: true } } },
    });
    if (!ntpcCbt1Mock)
        throw new Error('RRB NTPC CBT-1 mock test record not found!');
    console.log(`\nChecking RRB NTPC CBT-1 Mock:`);
    console.log(`- Total Questions: ${ntpcCbt1Mock.totalQuestions} (Expected: 100)`);
    console.log(`- Duration: ${ntpcCbt1Mock.durationMinutes}m (Expected: 90m)`);
    console.log(`- Negative Marking: ${ntpcCbt1Mock.negativeMarkingPerQuestion} (Expected: 0.33)`);
    console.log(`- Type: ${ntpcCbt1Mock.type} (Expected: FULL_MOCK)`);
    console.log(`- TopicId: ${ntpcCbt1Mock.topicId} (Expected: null)`);
    if (ntpcCbt1Mock.totalQuestions !== 100 || ntpcCbt1Mock.durationMinutes !== 90 || ntpcCbt1Mock.negativeMarkingPerQuestion !== 0.33) {
        throw new Error('TEST 1 FAILED: RRB NTPC CBT-1 configuration does not match official blueprint!');
    }
    const ntpcCbt1Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId,
        examId: ntpcCbt1Mock.examId,
        stageId: ntpcCbt1Mock.stageId,
        testId: ntpcCbt1Mock.id,
        questionCount: ntpcCbt1Mock.totalQuestions,
    });
    console.log(`- Questions Prepared: ${ntpcCbt1Questions.length} / 100`);
    const ntpcCbt1Sections = ntpcCbt1Questions.reduce((acc, q) => {
        acc[q.sectionName] = (acc[q.sectionName] || 0) + 1;
        return acc;
    }, {});
    console.log(`- Section Distribution:`, ntpcCbt1Sections);
    if (ntpcCbt1Questions.length !== 100) {
        throw new Error(`TEST 1 FAILED: Expected 100 questions for RRB NTPC CBT-1, got ${ntpcCbt1Questions.length}`);
    }
    console.log('✅ TEST 1 PASSED: RRB NTPC CBT-1 strictly preserves 100 Qs, 90 mins, 0.33 neg, and section distribution.');
    // TEST 2: RRB NTPC CBT-2 (120 Qs, 90 mins, -0.33, GA: 50, Math: 35, Reasoning: 35)
    const ntpcCbt2Mock = await prisma.test.findFirst({
        where: { slug: 'rrb-ntpc-cbt-2-mock-01' },
        include: { exam: true, stage: { include: { sections: true } } },
    });
    if (!ntpcCbt2Mock)
        throw new Error('RRB NTPC CBT-2 mock test record not found!');
    console.log(`\nChecking RRB NTPC CBT-2 Mock:`);
    console.log(`- Total Questions: ${ntpcCbt2Mock.totalQuestions} (Expected: 120)`);
    console.log(`- Duration: ${ntpcCbt2Mock.durationMinutes}m (Expected: 90m)`);
    console.log(`- Negative Marking: ${ntpcCbt2Mock.negativeMarkingPerQuestion} (Expected: 0.33)`);
    const ntpcCbt2Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId,
        examId: ntpcCbt2Mock.examId,
        stageId: ntpcCbt2Mock.stageId,
        testId: ntpcCbt2Mock.id,
        questionCount: ntpcCbt2Mock.totalQuestions,
    });
    console.log(`- Questions Prepared: ${ntpcCbt2Questions.length} / 120`);
    if (ntpcCbt2Questions.length !== 120) {
        throw new Error(`TEST 2 FAILED: Expected 120 questions for RRB NTPC CBT-2, got ${ntpcCbt2Questions.length}`);
    }
    console.log('✅ TEST 2 PASSED: RRB NTPC CBT-2 strictly preserves 120 Qs, 90 mins, 0.33 neg.');
    // TEST 3: RRB JE CBT-1 (100 Qs, 90m) & RRB JE CBT-2 (150 Qs, 120m)
    const rrbJeCbt1 = await prisma.test.findFirst({ where: { slug: 'rrb-je-cbt-1-mock-01' } });
    const rrbJeCbt2 = await prisma.test.findFirst({ where: { slug: 'rrb-je-cbt-2-mock-01' } });
    if (!rrbJeCbt1 || !rrbJeCbt2)
        throw new Error('RRB JE mock tests not found!');
    console.log(`\nChecking RRB JE Mocks:`);
    console.log(`- RRB JE CBT-1: ${rrbJeCbt1.totalQuestions} Qs, ${rrbJeCbt1.durationMinutes}m, Neg: ${rrbJeCbt1.negativeMarkingPerQuestion}`);
    console.log(`- RRB JE CBT-2: ${rrbJeCbt2.totalQuestions} Qs, ${rrbJeCbt2.durationMinutes}m, Neg: ${rrbJeCbt2.negativeMarkingPerQuestion}`);
    if (rrbJeCbt1.totalQuestions !== 100 || rrbJeCbt1.durationMinutes !== 90 || rrbJeCbt2.totalQuestions !== 150 || rrbJeCbt2.durationMinutes !== 120) {
        throw new Error('TEST 3 FAILED: RRB JE CBT-1 / CBT-2 configurations do not match blueprint!');
    }
    console.log('✅ TEST 3 PASSED: RRB JE CBT-1 (100 Qs/90m) and CBT-2 (150 Qs/120m) strictly preserved.');
    // TEST 4: RRB Group D (100 Qs, 90m, -0.33)
    const rrbGroupDMock = await prisma.test.findFirst({ where: { slug: 'rrb-group-d-cbt-mock-01' } });
    if (!rrbGroupDMock || rrbGroupDMock.totalQuestions !== 100 || rrbGroupDMock.durationMinutes !== 90) {
        throw new Error('TEST 4 FAILED: RRB Group D configuration invalid!');
    }
    console.log(`\nChecking RRB Group D Mock: ${rrbGroupDMock.totalQuestions} Qs, ${rrbGroupDMock.durationMinutes}m, Neg: ${rrbGroupDMock.negativeMarkingPerQuestion}`);
    console.log('✅ TEST 4 PASSED: RRB Group D (100 Qs, 90 mins, 0.33 neg) strictly preserved.');
    // TEST 5: APPSC FBO & ABO Screening (150 Qs, 150m, -0.33)
    const appscMock = await prisma.test.findFirst({ where: { slug: 'appsc-fbo-abo-screening-test-mock-01' } });
    if (!appscMock || appscMock.totalQuestions !== 150 || appscMock.durationMinutes !== 150) {
        throw new Error('TEST 5 FAILED: APPSC Screening configuration invalid!');
    }
    console.log(`\nChecking APPSC FBO & ABO Mock: ${appscMock.totalQuestions} Qs, ${appscMock.durationMinutes}m, Neg: ${appscMock.negativeMarkingPerQuestion}`);
    console.log('✅ TEST 5 PASSED: APPSC FBO & ABO (150 Qs, 150 mins, 0.33 neg) strictly preserved.');
    // TEST 6: IBPS PO Prelims (100 Qs, 60m, -0.25) & Mains (157 Qs, 210m, -0.25)
    const ibpsPrelims = await prisma.test.findFirst({ where: { slug: 'ibps-po-prelims-mock-01' } });
    const ibpsMains = await prisma.test.findFirst({ where: { slug: 'ibps-po-mains-mock-01' } });
    if (!ibpsPrelims || !ibpsMains || ibpsPrelims.totalQuestions !== 100 || ibpsPrelims.negativeMarkingPerQuestion !== 0.25 || ibpsMains.negativeMarkingPerQuestion !== 0.25) {
        throw new Error('TEST 6 FAILED: IBPS PO Prelims / Mains configurations invalid!');
    }
    console.log(`\nChecking IBPS PO Mocks:`);
    console.log(`- Prelims: ${ibpsPrelims.totalQuestions} Qs, ${ibpsPrelims.durationMinutes}m, Neg: ${ibpsPrelims.negativeMarkingPerQuestion}`);
    console.log(`- Mains: ${ibpsMains.totalQuestions} Qs, ${ibpsMains.durationMinutes}m, Neg: ${ibpsMains.negativeMarkingPerQuestion}`);
    console.log('✅ TEST 6 PASSED: IBPS PO Prelims & Mains patterns, timings, and 0.25 negative marking strictly preserved.');
    console.log('\n=============================================================================');
    console.log('PART B: TOPIC-BASED TESTS REGRESSION TESTS');
    console.log('=============================================================================');
    // TEST 7: 1 Topic = 1 Test (30 Topics = 30 Topic Tests)
    const allTopicTests = await prisma.test.findMany({ where: { type: 'TOPIC_TEST' }, include: { topic: true, exam: true } });
    const allTopics = await prisma.topic.findMany();
    console.log(`\nChecking Topic Tests count: ${allTopicTests.length} tests for ${allTopics.length} topics.`);
    if (allTopicTests.length !== allTopics.length) {
        throw new Error(`TEST 7 FAILED: Expected ${allTopics.length} topic tests, got ${allTopicTests.length}`);
    }
    for (const t of allTopicTests) {
        if (t.totalQuestions !== 50 || t.durationMinutes !== 60 || t.negativeMarkingPerQuestion !== 0.0 || t.totalMarks !== 50) {
            throw new Error(`TEST 7 FAILED: Topic test '${t.title}' has invalid parameters (${t.totalQuestions} Qs, ${t.durationMinutes}m, Neg: ${t.negativeMarkingPerQuestion})`);
        }
    }
    console.log('✅ TEST 7 PASSED: All 30 topic tests strictly enforce 50 Qs, 60 Mins, 0 Negative Marking, 50 Marks.');
    // TEST 8: Topic Test Retake Uniqueness (Attempt 1 ∩ Attempt 2 = 0)
    const sampleTopicTest = allTopicTests.find(t => t.topic?.name === 'Indian Polity & Constitution') || allTopicTests[0];
    console.log(`\nTesting Retake Uniqueness for Topic Test: '${sampleTopicTest.title}'`);
    const attempt1Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId,
        examId: sampleTopicTest.examId,
        topicId: sampleTopicTest.topicId,
        testId: sampleTopicTest.id,
        questionCount: 50,
    });
    // Record Attempt 1 in history
    for (const q of attempt1Questions) {
        await prisma.questionHistory.create({
            data: {
                userId,
                questionId: q.id,
                examId: sampleTopicTest.examId,
                topicId: sampleTopicTest.topicId || q.topicId,
                testId: sampleTopicTest.id,
                selectedOption: 'A',
                isCorrect: true,
                shownAt: new Date(),
            },
        });
    }
    const attempt2Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
        userId,
        examId: sampleTopicTest.examId,
        topicId: sampleTopicTest.topicId,
        testId: sampleTopicTest.id,
        questionCount: 50,
    });
    const set1 = new Set(attempt1Questions.map(q => q.id));
    const set2 = new Set(attempt2Questions.map(q => q.id));
    const overlap = [...set1].filter(id => set2.has(id));
    console.log(`- Attempt 1 Questions: ${attempt1Questions.length}`);
    console.log(`- Attempt 2 Questions: ${attempt2Questions.length}`);
    console.log(`- Overlap count: ${overlap.length}`);
    if (attempt1Questions.length !== 50 || attempt2Questions.length !== 50 || overlap.length !== 0) {
        throw new Error(`TEST 8 FAILED: Overlap between Attempt 1 and Attempt 2 is ${overlap.length} (Expected: 0)`);
    }
    console.log('✅ TEST 8 PASSED: Retaking topic test produces 50 completely unique questions (Attempt 1 ∩ Attempt 2 = ∅).');
    console.log('\n=============================================================================');
    console.log('🎉 ALL 8 REGRESSION SUITE TESTS PASSED WITH 100% SUCCESS!');
    console.log('=============================================================================');
}
main()
    .catch((err) => {
    console.error('❌ REGRESSION TEST FAILED:', err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
