import { prisma } from '../config/db.js';
async function main() {
    const appscExam = await prisma.exam.findFirst({
        where: { OR: [{ code: 'APPSC_FBO' }, { slug: 'appsc-fbo-abo' }] },
        include: { stages: true }
    });
    if (!appscExam) {
        console.log('APPSC Exam not found');
        return;
    }
    console.log(`Current stages for ${appscExam.name}:`, appscExam.stages.map(s => `${s.code}: ${s.name} (${s.paperName})`));
    const deleted = await prisma.examStage.deleteMany({
        where: {
            examId: appscExam.id,
            code: 'MAINS'
        }
    });
    console.log(`Deleted ${deleted.count} MAINS stage(s) for APPSC.`);
    const remaining = await prisma.examStage.findMany({
        where: { examId: appscExam.id }
    });
    console.log(`Remaining stages for ${appscExam.name}:`, remaining.map(s => `${s.code}: ${s.name}`));
}
main().catch(console.error).finally(() => prisma.$disconnect());
