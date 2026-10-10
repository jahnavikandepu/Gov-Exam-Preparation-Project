import { Router } from 'express';
import { QuestionController } from '../controllers/questionController.js';
const router = Router();
router.get('/', QuestionController.getQuestions);
router.get('/:id', QuestionController.getQuestionById);
export default router;
