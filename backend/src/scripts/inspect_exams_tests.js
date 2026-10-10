import { prisma } from '../config/db.js';
async function inspect() {
    const exams = await prisma.exam.findMany({
        include: {
            stages: { include: { sections: true } },
            tests: { include: { testQuestions: true } },
        },
    });
    console.log('====================================');
    console.log('DATABASE EXAMS & STAGES CONFIGURATION');
    console.log('====================================');
    for (const e of exams) {
        console.log(`\nEXAM: ${e.name} (slug: ${e.slug}, id: ${e.id}, totalQuestions: ${e.totalQuestions})`);
        for (const s of e.stages) {
            const sectionSum = s.sections.reduce((sum, sec) => sum + sec.questionCount, 0);
            console.log(`  STAGE: ${s.name} (code: ${s.code}, id: ${s.id}, totalQuestions: ${s.totalQuestions}, sections sum: ${sectionSum})`);
            for (const sec of s.sections) {
                console.log(`    SECTION: ${sec.name} -> ${sec.questionCount} Qs (subjectId: ${sec.subjectId})`);
            }
        }
        for (const t of e.tests) {
            console.log(`  TEST: ${t.title} (id: ${t.id}, slug: ${t.slug}, totalQuestions: ${t.totalQuestions}, testQuestions in DB: ${t.testQuestions.length})`);
        }
    }
    // Also inspect in-progress attempts in the database
    const inProgressAttempts = await prisma.testAttempt.findMany({
        where: { isCompleted: false },
        include: {
            answers: true,
            user: true,
        },
    });
    console.log(`\n====================================`);
    console.log(`IN-PROGRESS ATTEMPTS IN DB (${inProgressAttempts.length} found)`);
    console.log(`====================================`);
    for (const att of inProgressAttempts) {
        console.log(`ATTEMPT: id: ${att.id}, user: ${att.user?.email}, testTitle: ${att.testTitle}, totalQuestions: ${att.totalQuestions}, answers in DB: ${att.answers.length}, status: ${att.status}`);
    }
}
inspect()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
