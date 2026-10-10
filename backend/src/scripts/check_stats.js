import { prisma } from '../config/db.js';
async function main() {
    const totalUsersAll = await prisma.user.count();
    const totalUsersNonDeleted = await prisma.user.count({
        where: { status: { notIn: ['Deleted', 'DELETED'] } }
    });
    const totalQuestions = await prisma.question.count();
    const totalTopicTests = await prisma.test.count({
        where: { type: 'TOPIC_TEST', status: 'ACTIVE' }
    });
    const totalTestsAll = await prisma.test.count();
    const totalAttempts = await prisma.testAttempt.count();
    console.log({
        totalUsersAll,
        totalUsersNonDeleted,
        totalQuestions,
        totalTopicTests,
        totalTestsAll,
        totalAttempts,
    });
    const users = await prisma.user.findMany({ select: { id: true, email: true, role: true, status: true } });
    console.log('Users in DB:', users);
    const testsByType = await prisma.test.groupBy({
        by: ['type', 'status'],
        _count: { id: true }
    });
    console.log('Tests by type:', testsByType);
}
main().catch(console.error).finally(() => prisma.$disconnect());
