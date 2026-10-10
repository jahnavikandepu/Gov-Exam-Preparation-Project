import { Router } from 'express';
import { AdminController } from '../controllers/adminController.js';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware.js';
const router = Router();
// Protect all admin routes with JWT and ADMIN role check
router.use(authenticateJWT, requireAdmin);
// Admin Dashboard & Platform Statistics
router.get('/dashboard/stats', AdminController.getDashboardStats);
router.get('/stats', AdminController.getDashboardStats);
router.get('/users', AdminController.getUsers);
router.get('/users/:id', AdminController.getUserDetails);
router.patch('/users/:id/status', AdminController.updateUserStatus);
router.get('/questions', AdminController.getQuestions);
router.post('/questions', AdminController.createQuestion);
router.post('/questions/generate', AdminController.generateQuestionsBulk);
router.get('/questions/ai-status', AdminController.getGeminiModelStatus);
router.put('/questions/:id', AdminController.updateQuestion);
router.delete('/questions/:id', AdminController.deleteQuestion);
router.get('/analytics', AdminController.getAnalytics);
// Exam Stages & Question Pool Management
router.get('/stages', AdminController.getExamStages);
router.put('/stages/:id', AdminController.updateExamStage);
router.get('/pool-health', AdminController.getQuestionPoolHealth);
router.post('/sync-tests', AdminController.syncTests);
export default router;
