import { AIService } from '../services/ai/aiService.js';
export class AIController {
    static async getAnalysis(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const attemptId = (req.params.attemptId || req.query.attemptId);
            const analysis = await AIService.getAnalysisReport(userId, attemptId);
            res.status(200).json({
                success: true,
                analysis,
                generatedAt: analysis.generatedAt,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch AI analysis.' });
        }
    }
    static async getHistory(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const history = await AIService.getAnalysisHistory(userId);
            res.status(200).json({
                success: true,
                history,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'Failed to fetch AI analysis history.' });
        }
    }
    static async triggerAnalysis(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const { attemptId } = req.body;
            const analysis = await AIService.analyzeStudentPerformance(userId, attemptId);
            res.status(200).json({
                success: true,
                message: 'AI Performance Analysis completed successfully.',
                analysis,
            });
        }
        catch (error) {
            res.status(500).json({ success: false, message: error.message || 'AI analysis failed.' });
        }
    }
    static async generateQuestions(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ success: false, message: 'Authentication required.' });
                return;
            }
            const { examId, examSlug, subjectId, topicId, difficulty, questionCount, aiRatio, includeSolutions, } = req.body;
            const result = await AIService.generateDynamicQuestions(userId, {
                examId,
                examSlug,
                subjectId,
                topicId,
                difficulty,
                questionCount: questionCount ? parseInt(String(questionCount), 10) : 10,
                aiRatio: aiRatio !== undefined ? parseFloat(String(aiRatio)) : 0.6,
                includeSolutions: Boolean(includeSolutions),
            });
            res.status(201).json({
                success: true,
                message: 'Dynamic exam questions generated successfully.',
                practiceSessionId: result.practiceSessionId,
                session: result.session,
                questions: result.questions,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to generate dynamic questions.',
            });
        }
    }
}
