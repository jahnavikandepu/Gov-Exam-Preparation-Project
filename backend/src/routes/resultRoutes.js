import { Router } from 'express';
import { ResultController } from '../controllers/resultController.js';
import { authenticateJWT } from '../middleware/authMiddleware.js';
const router = Router();
router.get('/:attemptId', authenticateJWT, ResultController.getResultByAttemptId);
export default router;
