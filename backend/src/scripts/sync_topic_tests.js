import { TestSyncService } from '../services/test/testSyncService.js';
import { prisma } from '../config/db.js';
async function main() {
    const res = await TestSyncService.syncTopicTests();
    console.log('Result:', res);
    const tests = await prisma.test.findMany({
        include: {
            exam: true,
            subject: true,
            topic: true,
        },
        orderBy: { title: 'asc' },
    });
    console.log(`\nTOTAL TESTS IN DATABASE: ${tests.length}`);
    for (const t of tests) {
        console.log(`- [${t.type}] ${t.title} | Exam: ${t.exam.name} | Topic: ${t.topic?.name || 'N/A'} | Qs: ${t.totalQuestions} | Dur: ${t.durationMinutes}m | Neg: ${t.negativeMarkingPerQuestion} | Slug: ${t.slug}`);
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
