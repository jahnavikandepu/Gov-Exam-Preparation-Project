import { prisma } from '../../config/db.js';
export class TestSyncService {
    /**
     * Synchronizes both Official Exam Stage Mocks and Topic Practice Tests.
     */
    static async syncAllTests() {
        const officialMocks = await this.syncOfficialExamStageTests();
        const topicTests = await this.syncTopicTests();
        return { officialMocks, topicTests };
    }
    /**
     * Synchronizes official full-length CBT mock tests for every ExamStage.
     * Ensures official exam patterns, question counts, timers, and marking schemes are preserved.
     */
    static async syncOfficialExamStageTests() {
        const exams = await prisma.exam.findMany({
            include: {
                stages: {
                    include: {
                        sections: { orderBy: { order: 'asc' } },
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });
        let createdCount = 0;
        let updatedCount = 0;
        let totalCount = 0;
        for (const exam of exams) {
            for (const stage of exam.stages) {
                // SPECIAL CASE: APPSC FBO & ABO Mains contains 3 distinct components: Essay, Paper 1, Paper 2
                if (stage.code === 'MAINS' && (exam.code === 'APPSC_FBO_ABO' || exam.slug === 'appsc-fbo-abo')) {
                    // Archive any outdated 150-question mock
                    await prisma.test.updateMany({
                        where: {
                            examId: exam.id,
                            slug: 'appsc-fbo-abo-mains-mock-01',
                        },
                        data: { status: 'ARCHIVED' },
                    });

                    const essaySubject = await prisma.subject.findFirst({
                        where: { examId: exam.id, slug: 'appsc-qualifying-essay' },
                    });
                    const subjectA = await prisma.subject.findFirst({
                        where: { examId: exam.id, slug: 'appsc-part-a' },
                    });
                    const subjectB = await prisma.subject.findFirst({
                        where: { examId: exam.id, slug: 'appsc-part-b' },
                    });

                    const components = [
                        {
                            slug: 'appsc-fbo-abo-mains-qualifying-essay',
                            title: 'APPSC FBO & ABO Mains: Component A — Qualifying Essay',
                            type: 'DESCRIPTIVE',
                            totalQuestions: 1,
                            durationMinutes: 45,
                            totalMarks: 50,
                            negativeMarkingPerQuestion: 0.0,
                            marksPerCorrect: 50.0,
                            subjectId: essaySubject?.id || null,
                            instructions: JSON.stringify([
                                'Qualifying test in Essay Writing on Environmental and Forest related subjects.',
                                'Question Type: Descriptive essay (1 question to be answered).',
                                'Permitted Languages: English, Telugu, or Urdu.',
                                'Examination Duration: 45 Minutes strictly enforced by the server countdown timer.',
                                'Maximum Marks: 50 Marks. This is a qualifying paper.',
                                'Type your response directly into the descriptive editor. Word count and autosave are active.',
                            ]),
                        },
                        {
                            slug: 'appsc-fbo-abo-mains-paper-1',
                            title: 'APPSC FBO & ABO Mains: Component B — Paper 1 (General Studies & Mental Ability)',
                            type: 'FULL_MOCK',
                            totalQuestions: 100,
                            durationMinutes: 100,
                            totalMarks: 100,
                            negativeMarkingPerQuestion: 0.33,
                            marksPerCorrect: 1.0,
                            subjectId: subjectA?.id || null,
                            instructions: JSON.stringify([
                                'Official Mains Component B: Paper 1 — General Studies & Mental Ability.',
                                'Total Questions: 100 Objective Multiple Choice Questions (MCQs).',
                                'Examination Duration: 100 Minutes.',
                                'Marking Scheme: Correct answer = +1.0 Mark. Negative Marking = -1/3 (0.33) Mark for each incorrect answer.',
                                'Maximum Marks: 100 Marks.',
                            ]),
                        },
                        {
                            slug: 'appsc-fbo-abo-mains-paper-2',
                            title: 'APPSC FBO & ABO Mains: Component C — Paper 2 (General Science & General Mathematics)',
                            type: 'FULL_MOCK',
                            totalQuestions: 100,
                            durationMinutes: 100,
                            totalMarks: 100,
                            negativeMarkingPerQuestion: 0.33,
                            marksPerCorrect: 1.0,
                            subjectId: subjectB?.id || null,
                            instructions: JSON.stringify([
                                'Official Mains Component C: Paper 2 — General Science & General Mathematics.',
                                'Total Questions: 100 Objective Multiple Choice Questions (MCQs).',
                                'Examination Duration: 100 Minutes.',
                                'Marking Scheme: Correct answer = +1.0 Mark. Negative Marking = -1/3 (0.33) Mark for each incorrect answer.',
                                'Maximum Marks: 100 Marks.',
                            ]),
                        },
                    ];

                    for (const comp of components) {
                        totalCount++;
                        const existingCompTest = await prisma.test.findUnique({ where: { slug: comp.slug } });
                        if (existingCompTest) {
                            await prisma.test.update({
                                where: { id: existingCompTest.id },
                                data: {
                                    stageId: stage.id,
                                    subjectId: comp.subjectId,
                                    title: comp.title,
                                    type: comp.type,
                                    difficulty: 'MEDIUM',
                                    totalQuestions: comp.totalQuestions,
                                    durationMinutes: comp.durationMinutes,
                                    totalMarks: comp.totalMarks,
                                    negativeMarkingPerQuestion: comp.negativeMarkingPerQuestion,
                                    marksPerCorrect: comp.marksPerCorrect,
                                    status: 'ACTIVE',
                                    instructions: comp.instructions,
                                },
                            });
                            updatedCount++;
                        } else {
                            await prisma.test.create({
                                data: {
                                    examId: exam.id,
                                    stageId: stage.id,
                                    subjectId: comp.subjectId,
                                    slug: comp.slug,
                                    title: comp.title,
                                    type: comp.type,
                                    difficulty: 'MEDIUM',
                                    totalQuestions: comp.totalQuestions,
                                    durationMinutes: comp.durationMinutes,
                                    totalMarks: comp.totalMarks,
                                    negativeMarkingPerQuestion: comp.negativeMarkingPerQuestion,
                                    marksPerCorrect: comp.marksPerCorrect,
                                    status: 'ACTIVE',
                                    instructions: comp.instructions,
                                },
                            });
                            createdCount++;
                        }
                    }
                    continue;
                }

                totalCount++;
                const defaultSlug = `${exam.slug}-${stage.code.toLowerCase().replace(/_/g, '-')}-mock-01`;
                const testTitle = `${exam.name} ${stage.name} Official Mock #1`;
                const sectionSummary = stage.sections.map((s) => `${s.name}: ${s.questionCount} Qs`).join(', ');
                const instructions = JSON.stringify([
                    `This is an authentic full-length CBT mock test for ${exam.name} - ${stage.name}.`,
                    `Total Questions: ${stage.totalQuestions} questions across ${stage.sections.length} official sections.`,
                    `Subject Distribution: ${sectionSummary}.`,
                    `Examination Duration: ${stage.durationMinutes} minutes.${stage.sectionTiming ? ' Official Sectional Timers are active.' : ''}`,
                    `Marking Scheme: Correct: +${stage.marksPerQuestion} mark, Negative Marking: -${stage.negativeMarks} mark per wrong answer.`,
                    `Total Marks: ${stage.totalMarks} marks.`,
                    `Source Reference: ${stage.notificationReference || 'Official Recruitment Blueprint'} (${stage.notificationYear || '2024'}).`,
                ]);
                const existingMock = await prisma.test.findFirst({
                    where: {
                        examId: exam.id,
                        stageId: stage.id,
                        type: 'FULL_MOCK',
                    },
                });
                if (existingMock) {
                    await prisma.test.update({
                        where: { id: existingMock.id },
                        data: {
                            title: testTitle,
                            slug: existingMock.slug || defaultSlug,
                            type: 'FULL_MOCK',
                            difficulty: 'MEDIUM',
                            totalQuestions: stage.totalQuestions,
                            durationMinutes: stage.durationMinutes,
                            totalMarks: stage.totalMarks,
                            negativeMarkingPerQuestion: stage.negativeMarks,
                            marksPerCorrect: stage.marksPerQuestion,
                            topicId: null,
                            subjectId: null,
                            status: 'ACTIVE',
                            instructions,
                        },
                    });
                    updatedCount++;
                }
                else {
                    // Check if slug is taken
                    let slugToUse = defaultSlug;
                    const slugExists = await prisma.test.findUnique({ where: { slug: defaultSlug } });
                    if (slugExists) {
                        slugToUse = `${defaultSlug}-${Date.now().toString().slice(-4)}`;
                    }
                    await prisma.test.create({
                        data: {
                            examId: exam.id,
                            stageId: stage.id,
                            topicId: null,
                            subjectId: null,
                            title: testTitle,
                            slug: slugToUse,
                            type: 'FULL_MOCK',
                            difficulty: 'MEDIUM',
                            totalQuestions: stage.totalQuestions,
                            durationMinutes: stage.durationMinutes,
                            totalMarks: stage.totalMarks,
                            negativeMarkingPerQuestion: stage.negativeMarks,
                            marksPerCorrect: stage.marksPerQuestion,
                            status: 'ACTIVE',
                            instructions,
                        },
                    });
                    createdCount++;
                }
            }
        }
        console.log(`[TestSyncService] Official Exam Stage Mocks Sync: ${createdCount} created, ${updatedCount} updated, ${totalCount} total.`);
        return { created: createdCount, updated: updatedCount, total: totalCount };
    }
    /**
     * Synchronizes topic practice tests for every syllabus topic across all exams.
     * Ensures 1 Topic -> 1 Test -> 50 Questions -> 60 Minutes -> No Negative Marking.
     */
    static async syncTopicTests() {
        const exams = await prisma.exam.findMany({
            include: {
                stages: { orderBy: { order: 'asc' } },
                subjects: {
                    include: {
                        topics: { orderBy: { order: 'asc' } },
                    },
                    orderBy: { order: 'asc' },
                },
            },
        });
        let createdCount = 0;
        let updatedCount = 0;
        let totalCount = 0;
        for (const exam of exams) {
            for (const subject of exam.subjects) {
                for (const topic of subject.topics) {
                    totalCount++;
                    const defaultSlug = `${exam.slug}-${topic.slug}-practice-test`.toLowerCase();
                    const testTitle = `${topic.name} Practice Test`;
                    const instructions = JSON.stringify([
                        `This practice test contains exactly 50 questions dedicated to ${topic.name}.`,
                        `Total duration is 60 minutes (01:00:00).`,
                        `There is NO negative marking: Correct answer = +1, Incorrect / Skipped = 0.`,
                        `Maximum marks = 50.`,
                        `Questions are strictly sourced from the ${exam.name} syllabus for this topic.`,
                        `Every retake provides 50 fresh, unseen questions.`,
                    ]);
                    const existingTest = await prisma.test.findFirst({
                        where: {
                            examId: exam.id,
                            topicId: topic.id,
                            type: 'TOPIC_TEST',
                        },
                    });
                    if (existingTest) {
                        await prisma.test.update({
                            where: { id: existingTest.id },
                            data: {
                                title: testTitle,
                                subjectId: subject.id,
                                topicId: topic.id,
                                stageId: exam.stages[0]?.id || null,
                                type: 'TOPIC_TEST',
                                difficulty: 'MEDIUM',
                                totalQuestions: 50,
                                durationMinutes: 60,
                                totalMarks: 50,
                                negativeMarkingPerQuestion: 0.0,
                                marksPerCorrect: 1.0,
                                status: 'ACTIVE',
                                instructions,
                            },
                        });
                        updatedCount++;
                    }
                    else {
                        let slugToUse = defaultSlug;
                        const slugExists = await prisma.test.findUnique({ where: { slug: defaultSlug } });
                        if (slugExists) {
                            slugToUse = `${defaultSlug}-${Date.now().toString().slice(-4)}`;
                        }
                        await prisma.test.create({
                            data: {
                                examId: exam.id,
                                subjectId: subject.id,
                                topicId: topic.id,
                                stageId: exam.stages[0]?.id || null,
                                title: testTitle,
                                slug: slugToUse,
                                type: 'TOPIC_TEST',
                                difficulty: 'MEDIUM',
                                totalQuestions: 50,
                                durationMinutes: 60,
                                totalMarks: 50,
                                negativeMarkingPerQuestion: 0.0,
                                marksPerCorrect: 1.0,
                                status: 'ACTIVE',
                                instructions,
                            },
                        });
                        createdCount++;
                    }
                }
            }
        }
        console.log(`[TestSyncService] Topic Tests Sync complete: ${createdCount} created, ${updatedCount} updated, ${totalCount} total topic tests.`);
        return { created: createdCount, updated: updatedCount, total: totalCount };
    }
}
