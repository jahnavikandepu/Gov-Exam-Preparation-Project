import { Router } from 'express';
import { ExamController } from '../controllers/examController.js';
const router = Router();
router.get('/', ExamController.getExams);
router.get('/stages/:stageId', ExamController.getStageById);
router.get('/:slugOrId', ExamController.getExamBySlugOrId);
export default router;
