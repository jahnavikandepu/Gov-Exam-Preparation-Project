import { prisma } from '../config/db.js';
import { TestSyncService } from '../services/test/testSyncService.js';
async function main() {
    console.log('🔄 Running TestSyncService.syncAllTests()...');
    const res = await TestSyncService.syncAllTests();
    console.log('Result:', JSON.stringify(res, null, 2));
    const allTests = await prisma.test.findMany({
        include: {
            exam: true,
            stage: { include: { sections: true } },
            topic: true,
            subject: true,
        },
        orderBy: [{ type: 'asc' }, { exam: { name: 'asc' } }, { title: 'asc' }]
    });
    console.log(`\n======================================================`);
    console.log(`TOTAL TESTS IN SYSTEM: ${allTests.length}`);
    console.log(`======================================================`);
    console.log(`\n--- OFFICIAL FULL-LENGTH EXAM STAGE MOCKS (${allTests.filter(t => t.type === 'FULL_MOCK').length}) ---`);
    for (const t of allTests.filter(t => t.type === 'FULL_MOCK')) {
        console.log(`[${t.exam.name}] ${t.title} (Slug: ${t.slug})`);
        console.log(`   Stage: ${t.stage?.name} | Qs: ${t.totalQuestions} | Dur: ${t.durationMinutes}m | Neg: ${t.negativeMarkingPerQuestion} | Marks: ${t.totalMarks}`);
        if (t.stage?.sections) {
            console.log(`   Sections: ${t.stage.sections.map(s => `${s.name} (${s.questionCount} Qs)`).join(', ')}`);
        }
    }
    console.log(`\n--- TOPIC-BASED PRACTICE TESTS (${allTests.filter(t => t.type === 'TOPIC_TEST').length}) ---`);
    for (const t of allTests.filter(t => t.type === 'TOPIC_TEST')) {
        console.log(`[${t.exam.name}] ${t.title} | Topic: ${t.topic?.name} | Qs: ${t.totalQuestions} | Dur: ${t.durationMinutes}m | Neg: ${t.negativeMarkingPerQuestion} | Marks: ${t.totalMarks}`);
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
