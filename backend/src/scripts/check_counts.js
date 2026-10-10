import { prisma } from '../config/db.js';
async function check() {
    const exams = await prisma.exam.findMany({
        include: {
            stages: { include: { sections: true } },
            subjects: { include: { questions: true } },
            tests: true,
        },
    });
    console.log('EXAMS & QUESTION COUNTS:');
    for (const e of exams) {
        const totalQ = await prisma.question.count({ where: { examId: e.id } });
        console.log(`Exam: ${e.name} (${e.code}) - Total Questions in DB: ${totalQ}, Configured Total: ${e.totalQuestions}`);
        for (const s of e.stages) {
            console.log(`  Stage: ${s.name}, Configured Total: ${s.totalQuestions}, Sections: ${s.sections.map(sec => `${sec.name} (${sec.questionCount})`).join(', ')}`);
        }
        for (const sub of e.subjects) {
            console.log(`  Subject: ${sub.name}, Questions in DB: ${sub.questions.length}`);
        }
    }
}
check()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
