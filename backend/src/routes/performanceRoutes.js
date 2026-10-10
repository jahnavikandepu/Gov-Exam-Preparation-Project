import { Router } from 'express';
import { PerformanceController } from '../controllers/performanceController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/progress', authenticateJWT, PerformanceController.getProgress);
router.get('/history', authenticateJWT, PerformanceController.getHistory);
router.get('/dashboard', authenticateJWT, PerformanceController.getDashboardData);
export default router;
