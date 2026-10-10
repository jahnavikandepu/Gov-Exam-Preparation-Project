import { prisma } from '../config/db.js';
import { TestSyncService } from '../services/test/testSyncService.js';
async function main() {
    console.log('🧹 Removing any non-topic tests...');
    const deleted = await prisma.test.deleteMany({
        where: {
            OR: [
                { type: { not: 'TOPIC_TEST' } },
                { totalQuestions: { not: 50 } },
                { durationMinutes: { not: 60 } },
                { negativeMarkingPerQuestion: { not: 0 } },
            ],
        },
    });
    console.log(`Deleted ${deleted.count} old non-topic test records.`);
    console.log('🔄 Syncing 1-to-1 Topic Tests for all syllabus topics...');
    const syncResult = await TestSyncService.syncTopicTests();
    console.log(`Synced ${syncResult.total} topic tests.`);
    const remaining = await prisma.test.findMany({
        include: { exam: true, subject: true, topic: true },
        orderBy: [{ exam: { name: 'asc' } }, { title: 'asc' }],
    });
    console.log(`\n=================================================`);
    console.log(`CURRENT ACTIVE TESTS IN SYSTEM (${remaining.length} TOPIC TESTS):`);
    console.log(`=================================================`);
    for (const t of remaining) {
        console.log(`Exam: ${t.exam.name} | Subject: ${t.subject?.name || 'N/A'} | Topic: ${t.topic?.name || 'N/A'} | Test: ${t.title} | ${t.totalQuestions} Qs | ${t.durationMinutes}m | Neg: ${t.negativeMarkingPerQuestion}`);
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
