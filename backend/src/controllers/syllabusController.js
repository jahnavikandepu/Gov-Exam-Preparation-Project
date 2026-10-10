import { SyllabusService } from '../services/syllabus/syllabusService.js';
export class SyllabusController {
    /**
     * GET /api/syllabus
     * Retrieves the list of all configured syllabus documents and their availability status.
     */
    static async getSyllabusList(req, res) {
        try {
            const documents = await SyllabusService.listAvailableDocuments();
            res.status(200).json({
                success: true,
                count: documents.length,
                documents,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to list syllabus documents.',
            });
        }
    }
    /**
     * GET /api/syllabus/:examSlug
     * Retrieves syllabus document metadata and file presence for a specific exam slug.
     */
    static async getSyllabusBySlug(req, res) {
        try {
            const { examSlug } = req.params;
            const document = await SyllabusService.getSyllabusByExamSlug(examSlug);
            if (!document) {
                res.status(404).json({
                    success: false,
                    message: `Syllabus configuration not found for exam '${examSlug}'. Supported slugs: rrb-ntpc, rrb-group-d, rrb-alp, rrb-je, appsc, ssc-cgl, ibps-po.`,
                });
                return;
            }
            res.status(200).json({
                success: true,
                document,
            });
        }
        catch (error) {
            const statusCode = error.message?.includes('Invalid slug format') ? 400 : 500;
            res.status(statusCode).json({
                success: false,
                message: error.message || 'Failed to retrieve syllabus document details.',
            });
        }
    }
    /**
     * GET /api/syllabus/:examSlug/verify
     * Verifies if the PDF file exists on the filesystem and is accessible.
     */
    static async verifySyllabusFile(req, res) {
        try {
            const { examSlug } = req.params;
            const verification = await SyllabusService.verifyPdfExists(examSlug);
            res.status(200).json({
                success: true,
                examSlug,
                ...verification,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Verification failed.',
            });
        }
    }
}
