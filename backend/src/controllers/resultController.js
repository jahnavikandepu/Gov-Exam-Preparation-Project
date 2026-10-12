import { prisma } from '../config/db.js';
import { RecommendationService } from '../services/recommendation/recommendationService.js';
export class ResultController {
    static async getResultByAttemptId(req, res) {
        try {
            const { attemptId } = req.params;
            const userId = req.user?.id;
            const attempt = await prisma.testAttempt.findUnique({
                where: { id: attemptId },
                include: {
                    stage: true,
                    test: true,
                    answers: {
                        include: {
                            question: {
                                include: { topic: true, subject: true },
                            },
                        },
                    },
                },
            });
            if (!attempt) {
                res.status(404).json({ success: false, message: 'Test attempt not found.' });
                return;
            }
            if (attempt.userId !== userId && req.user?.role !== 'ADMIN') {
                res.status(403).json({ success: false, message: 'Forbidden: You do not have access to this attempt result.' });
                return;
            }
            const isTopicTest = attempt.test?.type === 'TOPIC_TEST' || Boolean(attempt.topicId);
            const marksPerCorrect = isTopicTest ? 1.0 : (attempt.test?.marksPerCorrect || attempt.stage?.marksPerQuestion || 1.0);
            const negativePerWrong = isTopicTest ? 0.0 : (attempt.test?.negativeMarkingPerQuestion ?? attempt.stage?.negativeMarks ?? 0.33);
            const subjectBreakdown = attempt.subjectBreakdown ? JSON.parse(attempt.subjectBreakdown) : {};
            const topicBreakdown = attempt.topicBreakdown ? JSON.parse(attempt.topicBreakdown) : {};
            const difficultyBreakdown = attempt.difficultyBreakdown ? JSON.parse(attempt.difficultyBreakdown) : {};
            // Build section results array using configured marking scheme
            const sectionResults = Object.entries(subjectBreakdown).map(([secId, sec]) => ({
                sectionId: secId,
                sectionName: sec.name,
                total: sec.total,
                attempted: sec.attempted,
                correct: sec.correct,
                wrong: sec.wrong,
                skipped: sec.skipped,
                accuracy: sec.attempted > 0 ? Math.round((sec.correct / sec.attempted) * 100) : 0,
                marks: sec.marks !== undefined ? Math.round(Number(sec.marks) * 100) / 100 : Math.round(Math.max(0, sec.correct * marksPerCorrect - sec.wrong * negativePerWrong) * 100) / 100,
                maxMarks: sec.maxMarks !== undefined ? sec.maxMarks : (sec.total * marksPerCorrect),
            }));
            const isDescriptiveTest = (attempt.test?.type === 'DESCRIPTIVE' ||
                attempt.test?.slug?.includes('essay') ||
                attempt.test?.slug?.includes('qualifying-essay')) &&
                attempt.answers.length <= 2;

            // Build question analysis array with explanations
            const questionAnalysis = attempt.answers.map((ans, idx) => {
                const q = ans.question;
                const options = typeof q.options === 'string' ? JSON.parse(q.options) : (q.options || []);
                const isEssayQ = q.questionType === 'DESCRIPTIVE_ESSAY';
                const matchedSec = Object.values(subjectBreakdown).find((s) => s.sectionId === q.subjectId || s.name === q.subject.name) || {};
                const qMarksPerCorrect = isEssayQ ? (matchedSec.marksPerQuestion || 12.5) : (matchedSec.marksPerQuestion || marksPerCorrect);
                const qNegativePerWrong = isEssayQ ? 0.0 : (matchedSec.negativeMarks !== undefined ? matchedSec.negativeMarks : negativePerWrong);
                const isAnswered = isEssayQ
                    ? Boolean(ans.textAnswer && ans.textAnswer.trim().length > 0)
                    : Boolean(ans.selectedOption !== null && ans.selectedOption !== undefined && ans.selectedOption !== '');
                const formattedStatus = !isAnswered
                    ? 'not-answered'
                    : (ans.status ? ans.status.toLowerCase().replace(/_/g, '-') : 'answered');

                return {
                    questionId: q.id,
                    questionNumber: idx + 1,
                    sectionId: q.subjectId,
                    sectionName: q.subject.name,
                    topicId: q.topicId,
                    topicName: q.topic.name,
                    questionText: q.questionText,
                    questionType: q.questionType || (isEssayQ ? 'DESCRIPTIVE_ESSAY' : 'OBJECTIVE_MCQ'),
                    isDescriptive: isEssayQ,
                    options: isEssayQ ? [] : options,
                    userAnswer: ans.selectedOption,
                    textAnswer: ans.textAnswer,
                    aiScore: ans.aiScore,
                    evaluationNotes: ans.evaluationNotes,
                    correctAnswer: isEssayQ ? 'Descriptive Response' : q.correctOption,
                    isCorrect: isAnswered ? Boolean(ans.isCorrect) : false,
                    isAnswered,
                    status: formattedStatus,
                    timeSpentSeconds: ans.timeSpentSeconds,
                    explanation: q.explanation,
                    difficulty: q.difficulty,
                    marksPerCorrect: qMarksPerCorrect,
                    negativePerWrong: qNegativePerWrong,
                };
            });
            // Get or create next recommendation
            let recommendation = await prisma.recommendation.findFirst({
                where: { attemptId: attempt.id },
            });
            if (!recommendation && userId) {
                recommendation = await RecommendationService.getActiveRecommendation(userId);
            }
            const formattedRecommendation = recommendation
                ? {
                    id: recommendation.id,
                    title: recommendation.title,
                    subjectName: recommendation.subjectName,
                    topicNames: typeof recommendation.topicNames === 'string' ? JSON.parse(recommendation.topicNames) : recommendation.topicNames,
                    difficulty: recommendation.difficulty,
                    questionCount: recommendation.questionCount,
                    estimatedTime: recommendation.estimatedTime,
                    reason: recommendation.reason,
                }
                : null;
            const result = {
                id: attempt.id,
                attemptId: attempt.id,
                attemptNumber: attempt.attemptNumber || 1,
                testId: attempt.testId || 'custom-practice',
                testSlug: attempt.test?.slug || attempt.testId || 'custom-practice',
                stageId: attempt.stageId,
                stageName: attempt.stageName || attempt.stage?.name,
                testTitle: attempt.testTitle,
                examName: attempt.examName,
                isDescriptive: Boolean(isDescriptiveTest),
                qualifyingNotice: isDescriptiveTest ? 'Qualifying Component — AI-Generated Estimate (Subject to Official Rules)' : null,
                status: attempt.status,
                submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : new Date().toISOString(),
                timeSpentSeconds: attempt.durationSeconds,
                totalQuestions: attempt.totalQuestions,
                attemptedQuestions: attempt.attemptedQuestions,
                correctQuestions: attempt.correctAnswers,
                wrongQuestions: attempt.incorrectAnswers,
                skippedQuestions: attempt.skippedQuestions,
                score: attempt.score,
                totalMarks: attempt.totalMarks,
                marksPerCorrect: isDescriptiveTest ? 50.0 : marksPerCorrect,
                negativePerWrong: isDescriptiveTest ? 0.0 : negativePerWrong,
                accuracy: attempt.accuracy,
                percentile: Math.min(99, Math.round(attempt.accuracy * 0.95 + 5)),
                rank: Math.max(12, Math.round((100 - attempt.accuracy) * 25 + 10)),
                totalCandidates: 2450,
                sectionResults,
                topicBreakdown,
                difficultyBreakdown,
                questionAnalysis,
                recommendation: formattedRecommendation,
            };
            res.status(200).json({ success: true, result });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch result.' });
        }
    }
}
