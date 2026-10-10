import { prisma } from '../src/config/db.js';
import { QuestionSelectionService } from '../src/services/question/questionSelectionService.js';
const targets = [
    { examSlug: 'appsc-fbo-abo', stageCode: 'SCREENING_TEST', expectedQuestions: 150 },
    { examSlug: 'appsc-fbo-abo', stageCode: 'MAINS', testSlug: 'appsc-fbo-abo-mains-qualifying-essay', expectedQuestions: 1 },
    { examSlug: 'appsc-fbo-abo', stageCode: 'MAINS', testSlug: 'appsc-fbo-abo-mains-paper-1', expectedQuestions: 100 },
    { examSlug: 'appsc-fbo-abo', stageCode: 'MAINS', testSlug: 'appsc-fbo-abo-mains-paper-2', expectedQuestions: 100 },
    { examSlug: 'rrb-ntpc', stageCode: 'CBT_1', expectedQuestions: 100 },
    { examSlug: 'rrb-ntpc', stageCode: 'CBT_2', expectedQuestions: 120 },
    { examSlug: 'rrb-je', stageCode: 'CBT_1', expectedQuestions: 100 },
    { examSlug: 'rrb-je', stageCode: 'CBT_2', expectedQuestions: 150 },
    { examSlug: 'rrb-group-d', stageCode: 'CBT', expectedQuestions: 100 },
    { examSlug: 'ibps-po', stageCode: 'PRELIMS', expectedQuestions: 100 },
    { examSlug: 'ibps-po', stageCode: 'MAINS', expectedQuestions: 157 },
];
async function runAllRealExamsTest() {
    console.log('================================================================');
    console.log('🎯 TESTING ALL OFFICIAL EXAM CONFIGURATIONS & REAL ATTEMPTS 🎯');
    console.log('================================================================\n');
    const testUser = await prisma.user.upsert({
        where: { email: 'real.exams.tester@govprep.local' },
        update: {},
        create: {
            email: 'real.exams.tester@govprep.local',
            password: '$2b$10$abcdefghijklmnopqrstuvwxyz0123456789',
            name: 'Real Exams Tester',
            role: 'STUDENT',
        },
    });
    const summaryResults = [];
    for (const target of targets) {
        console.log(`\n----------------------------------------------------------------`);
        console.log(`📌 Testing Exam: ${target.examSlug} ${target.stageCode ? `(Stage: ${target.stageCode})` : ''}`);
        console.log(`   Expected Question Count: ${target.expectedQuestions}`);
        console.log(`----------------------------------------------------------------`);
        const exam = await prisma.exam.findUnique({
            where: { slug: target.examSlug },
            include: {
                stages: { include: { sections: true } },
                tests: true,
            },
        });
        if (!exam) {
            console.error(`❌ Exam not found for slug: ${target.examSlug}`);
            continue;
        }
        let stage = null;
        if (target.stageCode) {
            stage = exam.stages.find((s) => s.code === target.stageCode) || null;
        }
        else if (exam.stages.length > 0) {
            stage = exam.stages[0];
        }
        let testRecord = null;
        if (target.testSlug) {
            testRecord = exam.tests.find((t) => t.slug === target.testSlug) || null;
        } else {
            testRecord = exam.tests.find((t) => (t.type === 'FULL_MOCK' || t.type === 'DESCRIPTIVE') && (stage ? t.stageId === stage.id : true)) ||
                exam.tests.find((t) => (stage ? t.stageId === stage.id : true)) ||
                exam.tests[0];
        }
        const startTime = Date.now();
        const questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
            userId: testUser.id,
            examId: exam.id,
            stageId: stage?.id,
            testId: testRecord?.id,
        });
        const elapsedMs = Date.now() - startTime;
        // Verify sections breakdown
        const sectionCounts = {};
        for (const q of questions) {
            sectionCounts[q.sectionName] = (sectionCounts[q.sectionName] || 0) + 1;
        }
        console.log(`   ✅ Prepared in ${elapsedMs}ms`);
        console.log(`   ✅ Total Received: ${questions.length} / ${target.expectedQuestions}`);
        console.log(`   Section Distribution:`, JSON.stringify(sectionCounts, null, 2));
        if (questions.length !== target.expectedQuestions) {
            throw new Error(`❌ FAILED! Exam ${exam.name} expected ${target.expectedQuestions} questions, but got ${questions.length}!`);
        }
        // Simulate starting attempt in DB to test complete pipeline & DB records
        const startedAt = new Date();
        const attempt = await prisma.$transaction(async (tx) => {
            const createdAttempt = await tx.testAttempt.create({
                data: {
                    userId: testUser.id,
                    testId: testRecord?.id,
                    stageId: stage?.id,
                    attemptNumber: 1,
                    testTitle: testRecord?.title || `${exam.name} Full Mock`,
                    examName: exam.name,
                    stageName: stage?.name,
                    isCompleted: false,
                    status: 'IN_PROGRESS',
                    startTime: startedAt,
                    startedAt,
                    expiresAt: new Date(startedAt.getTime() + 5400000),
                    durationSeconds: 5400,
                    totalQuestions: questions.length,
                },
            });
            for (const q of questions) {
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
                await tx.questionHistory.create({
                    data: {
                        userId: testUser.id,
                        questionId: q.id,
                        examId: exam.id,
                        stageId: stage?.id,
                        attemptId: createdAttempt.id,
                        testAttemptId: createdAttempt.id,
                        shownAt: startedAt,
                    },
                });
            }
            return createdAttempt;
        });
        // Verify actual DB counts
        const dbCount = await prisma.answer.count({
            where: { attemptId: attempt.id },
        });
        console.log(`   ✅ Database Verified Answers Record Count: ${dbCount}`);
        if (dbCount !== target.expectedQuestions) {
            throw new Error(`❌ Database Verification Failed! Expected ${target.expectedQuestions}, got ${dbCount}`);
        }
        summaryResults.push({
            exam: exam.name,
            stage: stage?.name || 'Standard',
            required: target.expectedQuestions,
            actualPrepared: questions.length,
            actualDatabaseRecords: dbCount,
            status: 'VERIFIED ✅',
        });
    }
    console.log('\n================================================================');
    console.log('🏆 COMPLETE REAL EXAMS VERIFICATION REPORT');
    console.log('================================================================');
    console.table(summaryResults);
}
runAllRealExamsTest()
    .catch((err) => {
    console.error('Real Exams Test Failed:', err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
