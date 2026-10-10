import { prisma } from '../config/db.js';
export class ExamController {
    static async getExams(req, res) {
        try {
            const exams = await prisma.exam.findMany({
                where: { status: 'Active' },
                include: {
                    stages: {
                        where: { status: 'ACTIVE' },
                        include: {
                            sections: {
                                orderBy: { order: 'asc' },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                    subjects: {
                        include: { topics: true },
                        orderBy: { order: 'asc' },
                    },
                    tests: {
                        where: { status: 'ACTIVE' },
                    },
                },
                orderBy: { createdAt: 'asc' },
            });
            const formatted = exams.map((e) => ({
                id: e.id,
                code: e.code,
                slug: e.slug,
                name: e.name,
                fullName: e.fullName,
                category: e.category,
                shortDescription: e.shortDescription,
                fullDescription: e.fullDescription,
                durationMinutes: e.durationMinutes,
                totalQuestions: e.totalQuestions,
                totalMarks: e.totalMarks,
                negativeMarking: e.negativeMarking,
                badge: e.badge,
                status: e.status,
                availableTestsCount: e.tests.length,
                eligibility: e.eligibility,
                pattern: e.pattern ? JSON.parse(e.pattern) : [],
                stages: e.stages.map((stage) => ({
                    id: stage.id,
                    code: stage.code,
                    name: stage.name,
                    paperName: stage.paperName,
                    description: stage.description,
                    durationMinutes: stage.durationMinutes,
                    scribeDurationMinutes: stage.scribeDurationMinutes,
                    totalQuestions: stage.totalQuestions,
                    totalMarks: stage.totalMarks,
                    marksPerQuestion: stage.marksPerQuestion,
                    negativeMarks: stage.negativeMarks,
                    questionType: stage.questionType,
                    language: stage.language,
                    isQualifying: stage.isQualifying,
                    isMerit: stage.isMerit,
                    isScreening: stage.isScreening,
                    sectionTiming: stage.sectionTiming,
                    separateTimer: stage.separateTimer,
                    hasScribeExtension: stage.hasScribeExtension,
                    notificationReference: stage.notificationReference,
                    notificationYear: stage.notificationYear,
                    lastVerifiedAt: stage.lastVerifiedAt,
                    status: stage.status,
                    sections: stage.sections.map((sec) => ({
                        id: sec.id,
                        name: sec.name,
                        code: sec.code,
                        questionCount: sec.questionCount,
                        durationMinutes: sec.durationMinutes,
                        totalMarks: sec.totalMarks,
                        marksPerQuestion: sec.marksPerQuestion,
                        negativeMarks: sec.negativeMarks,
                        questionType: sec.questionType,
                        discipline: sec.discipline,
                        order: sec.order,
                    })),
                })),
                sections: e.subjects.map((s) => ({
                    id: s.id,
                    name: s.name,
                    topics: s.topics.map((t) => ({
                        id: t.id,
                        name: t.name,
                        slug: t.slug,
                    })),
                })),
            }));
            res.status(200).json({ success: true, exams: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch exams.' });
        }
    }
    static async getExamBySlugOrId(req, res) {
        try {
            const { slugOrId } = req.params;
            const exam = await prisma.exam.findFirst({
                where: {
                    OR: [{ id: slugOrId }, { slug: slugOrId }, { code: slugOrId }],
                },
                include: {
                    stages: {
                        where: { status: 'ACTIVE' },
                        include: {
                            sections: {
                                orderBy: { order: 'asc' },
                            },
                        },
                        orderBy: { order: 'asc' },
                    },
                    subjects: {
                        include: { topics: true },
                        orderBy: { order: 'asc' },
                    },
                    tests: {
                        where: { status: 'ACTIVE' },
                    },
                },
            });
            if (!exam) {
                res.status(404).json({ success: false, message: 'Exam not found.' });
                return;
            }
            const formatted = {
                id: exam.id,
                code: exam.code,
                slug: exam.slug,
                name: exam.name,
                fullName: exam.fullName,
                category: exam.category,
                shortDescription: exam.shortDescription,
                fullDescription: exam.fullDescription,
                durationMinutes: exam.durationMinutes,
                totalQuestions: exam.totalQuestions,
                totalMarks: exam.totalMarks,
                negativeMarking: exam.negativeMarking,
                badge: exam.badge,
                status: exam.status,
                availableTestsCount: exam.tests.length,
                eligibility: exam.eligibility,
                pattern: exam.pattern ? JSON.parse(exam.pattern) : [],
                stages: exam.stages.map((stage) => ({
                    id: stage.id,
                    code: stage.code,
                    name: stage.name,
                    paperName: stage.paperName,
                    description: stage.description,
                    durationMinutes: stage.durationMinutes,
                    scribeDurationMinutes: stage.scribeDurationMinutes,
                    totalQuestions: stage.totalQuestions,
                    totalMarks: stage.totalMarks,
                    marksPerQuestion: stage.marksPerQuestion,
                    negativeMarks: stage.negativeMarks,
                    questionType: stage.questionType,
                    language: stage.language,
                    isQualifying: stage.isQualifying,
                    isMerit: stage.isMerit,
                    isScreening: stage.isScreening,
                    sectionTiming: stage.sectionTiming,
                    separateTimer: stage.separateTimer,
                    hasScribeExtension: stage.hasScribeExtension,
                    notificationReference: stage.notificationReference,
                    notificationYear: stage.notificationYear,
                    lastVerifiedAt: stage.lastVerifiedAt,
                    status: stage.status,
                    sections: stage.sections.map((sec) => ({
                        id: sec.id,
                        name: sec.name,
                        code: sec.code,
                        questionCount: sec.questionCount,
                        durationMinutes: sec.durationMinutes,
                        totalMarks: sec.totalMarks,
                        marksPerQuestion: sec.marksPerQuestion,
                        negativeMarks: sec.negativeMarks,
                        questionType: sec.questionType,
                        discipline: sec.discipline,
                        order: sec.order,
                    })),
                })),
                sections: exam.subjects.map((s) => ({
                    id: s.id,
                    name: s.name,
                    topics: s.topics.map((t) => ({
                        id: t.id,
                        name: t.name,
                        slug: t.slug,
                    })),
                })),
            };
            res.status(200).json({ success: true, exam: formatted });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch exam details.' });
        }
    }
    static async getStageById(req, res) {
        try {
            const { stageId } = req.params;
            const stage = await prisma.examStage.findUnique({
                where: { id: stageId },
                include: {
                    exam: true,
                    sections: {
                        orderBy: { order: 'asc' },
                    },
                },
            });
            if (!stage) {
                res.status(404).json({ success: false, message: 'Exam stage configuration not found.' });
                return;
            }
            res.status(200).json({
                success: true,
                stage: {
                    id: stage.id,
                    examId: stage.examId,
                    examCode: stage.exam.code,
                    examName: stage.exam.name,
                    examSlug: stage.exam.slug,
                    code: stage.code,
                    name: stage.name,
                    paperName: stage.paperName,
                    description: stage.description,
                    durationMinutes: stage.durationMinutes,
                    scribeDurationMinutes: stage.scribeDurationMinutes,
                    totalQuestions: stage.totalQuestions,
                    totalMarks: stage.totalMarks,
                    marksPerQuestion: stage.marksPerQuestion,
                    negativeMarks: stage.negativeMarks,
                    questionType: stage.questionType,
                    language: stage.language,
                    isQualifying: stage.isQualifying,
                    isMerit: stage.isMerit,
                    isScreening: stage.isScreening,
                    sectionTiming: stage.sectionTiming,
                    separateTimer: stage.separateTimer,
                    hasScribeExtension: stage.hasScribeExtension,
                    notificationReference: stage.notificationReference,
                    notificationYear: stage.notificationYear,
                    lastVerifiedAt: stage.lastVerifiedAt,
                    status: stage.status,
                    sections: stage.sections.map((sec) => ({
                        id: sec.id,
                        name: sec.name,
                        code: sec.code,
                        questionCount: sec.questionCount,
                        durationMinutes: sec.durationMinutes,
                        marksPerQuestion: sec.marksPerQuestion,
                        negativeMarks: sec.negativeMarks,
                        discipline: sec.discipline,
                        order: sec.order,
                    })),
                },
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch stage details.' });
        }
    }
}
