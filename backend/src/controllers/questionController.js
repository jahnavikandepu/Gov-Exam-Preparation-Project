import { prisma } from '../config/db.js';
export class QuestionController {
    /**
     * GET /api/questions
     * Fetches questions with optional filters (examSlug, subjectId, topicId, difficulty, search).
     */
    static async getQuestions(req, res) {
        try {
            const { examSlug, subjectId, topicId, difficulty, status, search, limit = '50', page = '1' } = req.query;
            const take = Math.min(100, Math.max(1, parseInt(String(limit), 10) || 50));
            const skip = (Math.max(1, parseInt(String(page), 10) || 1) - 1) * take;
            const whereClause = {
                status: status ? String(status) : 'PUBLISHED',
                ...(examSlug && { exam: { slug: String(examSlug) } }),
                ...(subjectId && { subjectId: String(subjectId) }),
                ...(topicId && { topicId: String(topicId) }),
                ...(difficulty && difficulty !== 'All' && { difficulty: String(difficulty) }),
                ...(search && {
                    OR: [
                        { questionText: { contains: String(search), mode: 'insensitive' } },
                        { explanation: { contains: String(search), mode: 'insensitive' } },
                    ],
                }),
            };
            const [questions, total] = await Promise.all([
                prisma.question.findMany({
                    where: whereClause,
                    include: {
                        exam: { select: { id: true, name: true, slug: true } },
                        subject: { select: { id: true, name: true, slug: true } },
                        topic: { select: { id: true, name: true, slug: true } },
                    },
                    take,
                    skip,
                    orderBy: { createdAt: 'desc' },
                }),
                prisma.question.count({ where: whereClause }),
            ]);
            const formatted = questions.map((q) => ({
                id: q.id,
                examId: q.examId,
                examName: q.exam.name,
                examSlug: q.exam.slug,
                subjectId: q.subjectId,
                subjectName: q.subject.name,
                topicId: q.topicId,
                topicName: q.topic.name,
                questionText: q.questionText,
                options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
                difficulty: q.difficulty,
                source: q.source || 'GovPrep Expert Team',
                generationModel: q.generationModel || null,
                year: q.year,
                status: q.status,
                createdAt: q.createdAt,
            }));
            res.status(200).json({
                success: true,
                total,
                page: parseInt(String(page), 10) || 1,
                limit: take,
                questions: formatted,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch questions.',
            });
        }
    }
    /**
     * GET /api/questions/:id
     * Fetches single question details.
     */
    static async getQuestionById(req, res) {
        try {
            const { id } = req.params;
            const question = await prisma.question.findUnique({
                where: { id },
                include: {
                    exam: { select: { id: true, name: true, slug: true } },
                    subject: { select: { id: true, name: true, slug: true } },
                    topic: { select: { id: true, name: true, slug: true } },
                },
            });
            if (!question) {
                res.status(404).json({ success: false, message: 'Question not found.' });
                return;
            }
            res.status(200).json({
                success: true,
                question: {
                    id: question.id,
                    examId: question.examId,
                    examName: question.exam.name,
                    examSlug: question.exam.slug,
                    subjectId: question.subjectId,
                    subjectName: question.subject.name,
                    topicId: question.topicId,
                    topicName: question.topic.name,
                    questionText: question.questionText,
                    options: typeof question.options === 'string' ? JSON.parse(question.options) : question.options,
                    difficulty: question.difficulty,
                    source: question.source,
                    year: question.year,
                    status: question.status,
                    createdAt: question.createdAt,
                },
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to fetch question.',
            });
        }
    }
}
