import { prisma } from '../config/db.js';
async function main() {
    const exams = await prisma.exam.findMany({
        include: {
            stages: true,
            subjects: {
                include: {
                    topics: {
                        include: {
                            _count: {
                                select: { questions: true }
                            }
                        }
                    }
                }
            },
            tests: true
        }
    });
    for (const e of exams) {
        console.log(`\n======================================================`);
        console.log(`EXAM: ${e.name} (${e.code} / ${e.slug})`);
        console.log(`======================================================`);
        for (const s of e.subjects) {
            console.log(`  SUBJECT: ${s.name} (${s.slug})`);
            for (const t of s.topics) {
                console.log(`    TOPIC: ${t.name} (id: ${t.id}, slug: ${t.slug}) -> Questions: ${t._count.questions}`);
            }
        }
        console.log(`  TESTS:`);
        for (const t of e.tests) {
            console.log(`    TEST: ${t.title} (type: ${t.type}, slug: ${t.slug}, totalQuestions: ${t.totalQuestions}, duration: ${t.durationMinutes}m, negative: ${t.negativeMarkingPerQuestion})`);
        }
    }
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
