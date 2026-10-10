import { Router } from 'express';
import { SyllabusController } from '../controllers/syllabusController.js';
const router = Router();
// GET /api/syllabus - List all syllabus documents and their availability
router.get('/', SyllabusController.getSyllabusList);
// GET /api/syllabus/:examSlug - Get metadata and availability for a specific exam's syllabus
router.get('/:examSlug', SyllabusController.getSyllabusBySlug);
// GET /api/syllabus/:examSlug/verify - Check if the PDF file exists on disk
router.get('/:examSlug/verify', SyllabusController.verifySyllabusFile);
export default router;
