import { prisma } from '../config/db.js';
async function main() {
    const exams = await prisma.exam.findMany({
        include: {
            stages: {
                include: {
                    sections: { orderBy: { order: 'asc' } }
                },
                orderBy: { order: 'asc' }
            },
            subjects: {
                include: { topics: true },
                orderBy: { order: 'asc' }
            }
        }
    });
    for (const e of exams) {
        console.log('================================================================');
        console.log(`EXAM: ${e.name} | Code: ${e.code} | Slug: ${e.slug} | TotalQs: ${e.totalQuestions} | Dur: ${e.durationMinutes}m | Neg: ${e.negativeMarking}`);
        console.log('STAGES:');
        for (const s of e.stages) {
            console.log(`  - Stage: ${s.name} (${s.code}) | Qs: ${s.totalQuestions} | Dur: ${s.durationMinutes}m | Scribe: ${s.scribeDurationMinutes}m | Neg: ${s.negativeMarks} | Timer: ${s.sectionTiming ? 'Sectional' : 'Composite'}`);
            console.log('    Sections:');
            for (const sec of s.sections) {
                console.log(`      * ${sec.name} (${sec.code || 'NO_CODE'}): ${sec.questionCount} Qs | Marks: ${sec.marksPerQuestion} | Neg: ${sec.negativeMarks}`);
            }
        }
        console.log('SUBJECTS & TOPICS:');
        for (const sub of e.subjects) {
            console.log(`  * Subject: ${sub.name} (${sub.topics.length} topics: ${sub.topics.map(t => t.name).join(', ')})`);
        }
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
