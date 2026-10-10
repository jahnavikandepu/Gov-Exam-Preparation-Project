import fs from 'fs';
import path from 'path';
import { prisma } from '../../config/db.js';
import { DEFAULT_SYLLABUS_REGISTRY, } from './syllabusConfig.js';
export class SyllabusService {
    /**
     * Resolves the root directory where syllabus PDFs are stored.
     * Priority: SYLLABUS_DIR env var -> fallback to backend/data/syllabus
     */
    static getSyllabusDirectory() {
        const configuredDir = process.env.SYLLABUS_DIR;
        if (configuredDir) {
            if (path.isAbsolute(configuredDir)) {
                return path.normalize(configuredDir);
            }
            return path.resolve(process.cwd(), configuredDir);
        }
        return path.resolve(process.cwd(), 'data', 'syllabus');
    }
    /**
     * Validates and sanitizes an exam slug to prevent path traversal.
     */
    static sanitizeSlug(slug) {
        if (!slug || typeof slug !== 'string') {
            throw new Error('Invalid exam slug: slug must be a non-empty string.');
        }
        const clean = slug.trim().toLowerCase();
        // Allow only lowercase alphanumeric characters and hyphens
        if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(clean)) {
            throw new Error(`Invalid slug format '${slug}'. Only lowercase letters, numbers, and single hyphens are allowed.`);
        }
        return clean;
    }
    /**
     * Safely locates the PDF file in an exam directory.
     * Checks for configured fileName, 'syllabus.pdf', or any single .pdf file in the folder.
     */
    static findPdfInDirectory(slugDir, preferredFileName) {
        if (!fs.existsSync(slugDir)) {
            return null;
        }
        // 1. Try preferred file name
        if (preferredFileName) {
            const preferredPath = path.join(slugDir, preferredFileName);
            if (fs.existsSync(preferredPath) && preferredFileName.toLowerCase().endsWith('.pdf')) {
                const stat = fs.statSync(preferredPath);
                if (stat.isFile()) {
                    return {
                        fileName: preferredFileName,
                        filePath: `${path.basename(slugDir)}/${preferredFileName}`,
                        absolutePath: preferredPath,
                        fileSizeBytes: stat.size,
                        lastModified: stat.mtime.toISOString(),
                    };
                }
            }
        }
        // 2. Try 'syllabus.pdf'
        const defaultPath = path.join(slugDir, 'syllabus.pdf');
        if (fs.existsSync(defaultPath)) {
            const stat = fs.statSync(defaultPath);
            if (stat.isFile()) {
                return {
                    fileName: 'syllabus.pdf',
                    filePath: `${path.basename(slugDir)}/syllabus.pdf`,
                    absolutePath: defaultPath,
                    fileSizeBytes: stat.size,
                    lastModified: stat.mtime.toISOString(),
                };
            }
        }
        // 3. Look for any .pdf file in the folder
        try {
            const files = fs.readdirSync(slugDir);
            const pdfFiles = files.filter((f) => f.toLowerCase().endsWith('.pdf') && !f.startsWith('.'));
            if (pdfFiles.length > 0) {
                const chosen = pdfFiles[0];
                const full = path.join(slugDir, chosen);
                const stat = fs.statSync(full);
                return {
                    fileName: chosen,
                    filePath: `${path.basename(slugDir)}/${chosen}`,
                    absolutePath: full,
                    fileSizeBytes: stat.size,
                    lastModified: stat.mtime.toISOString(),
                };
            }
        }
        catch {
            return null;
        }
        return null;
    }
    /**
     * Lists all available syllabus document configurations and their real filesystem availability status.
     */
    static async listAvailableDocuments() {
        const baseDir = this.getSyllabusDirectory();
        // Query database for stored SyllabusDocument records if any
        let dbDocs = [];
        try {
            dbDocs = await prisma.syllabusDocument.findMany({
                include: { exam: true },
            });
        }
        catch {
            dbDocs = [];
        }
        const mergedList = [];
        const processedSlugs = new Set();
        // 1. Process configured default registry
        for (const doc of DEFAULT_SYLLABUS_REGISTRY) {
            processedSlugs.add(doc.slug);
            const slugDir = path.join(baseDir, doc.slug);
            const foundPdf = this.findPdfInDirectory(slugDir, doc.fileName);
            mergedList.push({
                ...doc,
                fileName: foundPdf ? foundPdf.fileName : doc.fileName,
                filePath: foundPdf ? foundPdf.filePath : doc.filePath,
                exists: Boolean(foundPdf),
                fileSizeBytes: foundPdf ? foundPdf.fileSizeBytes : null,
                lastModified: foundPdf ? foundPdf.lastModified : null,
                statusMessage: foundPdf
                    ? 'PDF is ready for text extraction & question generation.'
                    : `PDF missing. Place your syllabus PDF in backend/data/syllabus/${doc.slug}/${doc.fileName}`,
            });
        }
        // 2. Merge any DB-specific documents not in registry
        for (const dbDoc of dbDocs) {
            if (!processedSlugs.has(dbDoc.examSlug)) {
                processedSlugs.add(dbDoc.examSlug);
                const slugDir = path.join(baseDir, dbDoc.examSlug);
                const foundPdf = this.findPdfInDirectory(slugDir, dbDoc.fileName);
                mergedList.push({
                    exam: dbDoc.exam?.name || dbDoc.examSlug,
                    slug: dbDoc.examSlug,
                    fileName: foundPdf ? foundPdf.fileName : dbDoc.fileName,
                    filePath: foundPdf ? foundPdf.filePath : dbDoc.filePath,
                    documentType: dbDoc.documentType,
                    language: dbDoc.language,
                    description: dbDoc.description || `Syllabus document for ${dbDoc.examSlug}`,
                    addedDate: dbDoc.createdAt ? dbDoc.createdAt.toISOString().split('T')[0] : '2026-10-05',
                    exists: Boolean(foundPdf),
                    fileSizeBytes: foundPdf ? foundPdf.fileSizeBytes : null,
                    lastModified: foundPdf ? foundPdf.lastModified : null,
                    statusMessage: foundPdf
                        ? 'PDF is ready for text extraction.'
                        : `PDF missing in backend/data/syllabus/${dbDoc.examSlug}/`,
                });
            }
        }
        return mergedList;
    }
    /**
     * Retrieves syllabus document metadata and status for a specific exam slug.
     */
    static async getSyllabusByExamSlug(examSlug) {
        const cleanSlug = this.sanitizeSlug(examSlug);
        const baseDir = this.getSyllabusDirectory();
        // Check DB first for custom document or linked exam
        let dbDoc = null;
        let examRecord = null;
        try {
            dbDoc = await prisma.syllabusDocument.findFirst({
                where: { examSlug: cleanSlug },
                include: { exam: true },
            });
            if (!dbDoc) {
                examRecord = await prisma.exam.findFirst({
                    where: { slug: cleanSlug },
                });
            }
        }
        catch {
            // Fallback gracefully if database is unreachable
        }
        // Match with default registry
        const defaultMeta = DEFAULT_SYLLABUS_REGISTRY.find((d) => d.slug === cleanSlug);
        if (!defaultMeta && !dbDoc && !examRecord) {
            // Check if a directory exists on filesystem as a fallback
            const customDir = path.join(baseDir, cleanSlug);
            if (!fs.existsSync(customDir)) {
                return null;
            }
        }
        const examName = dbDoc?.exam?.name || examRecord?.name || defaultMeta?.exam || cleanSlug.toUpperCase();
        const preferredFileName = dbDoc?.fileName || defaultMeta?.fileName || `${cleanSlug}-syllabus.pdf`;
        const documentType = (dbDoc?.documentType || defaultMeta?.documentType || 'SYLLABUS');
        const language = dbDoc?.language || defaultMeta?.language || 'English';
        const description = dbDoc?.description ||
            defaultMeta?.description ||
            `Official syllabus document for ${examName}.`;
        const addedDate = dbDoc?.createdAt
            ? dbDoc.createdAt.toISOString().split('T')[0]
            : defaultMeta?.addedDate || new Date().toISOString().split('T')[0];
        const slugDir = path.join(baseDir, cleanSlug);
        const foundPdf = this.findPdfInDirectory(slugDir, preferredFileName);
        return {
            exam: examName,
            slug: cleanSlug,
            fileName: foundPdf ? foundPdf.fileName : preferredFileName,
            filePath: foundPdf ? foundPdf.filePath : `${cleanSlug}/${preferredFileName}`,
            documentType,
            language,
            description,
            addedDate,
            exists: Boolean(foundPdf),
            fileSizeBytes: foundPdf ? foundPdf.fileSizeBytes : null,
            lastModified: foundPdf ? foundPdf.lastModified : null,
            statusMessage: foundPdf
                ? 'PDF is ready for future processing and syllabus tree extraction.'
                : `PDF not found. Please place your syllabus PDF at backend/data/syllabus/${cleanSlug}/${preferredFileName}`,
        };
    }
    /**
     * Verifies if a PDF document exists on disk for the given exam slug.
     */
    static async verifyPdfExists(examSlug) {
        try {
            const doc = await this.getSyllabusByExamSlug(examSlug);
            if (!doc) {
                return { exists: false, error: `Exam slug '${examSlug}' is not registered.` };
            }
            return {
                exists: doc.exists,
                fileName: doc.fileName,
                filePath: doc.filePath,
                error: doc.exists ? undefined : `File not found on disk at: ${doc.filePath}`,
            };
        }
        catch (err) {
            return { exists: false, error: err.message };
        }
    }
    /**
     * Internal method to safely resolve and return the absolute filesystem path
     * to a verified syllabus PDF for future processing pipelines.
     *
     * Strict Security Safeguards:
     * 1. Sanitizes the exam slug
     * 2. Confirms that resolved path is strictly within SYLLABUS_DIR (Path Traversal Protection)
     * 3. Confirms that file has a .pdf extension
     * 4. Confirms that file exists and is a readable file
     */
    static getPdfPath(examSlug) {
        const cleanSlug = this.sanitizeSlug(examSlug);
        const baseDir = this.getSyllabusDirectory();
        const slugDir = path.resolve(baseDir, cleanSlug);
        // Path traversal check
        if (!slugDir.startsWith(path.resolve(baseDir))) {
            throw new Error('Access denied: Invalid directory path traversal attempted.');
        }
        if (!fs.existsSync(slugDir)) {
            throw new Error(`Syllabus directory does not exist for exam: '${cleanSlug}'.`);
        }
        const foundPdf = this.findPdfInDirectory(slugDir);
        if (!foundPdf) {
            throw new Error(`No valid syllabus PDF found in directory: 'backend/data/syllabus/${cleanSlug}/'.`);
        }
        // Verify extension
        if (!foundPdf.fileName.toLowerCase().endsWith('.pdf')) {
            throw new Error(`File '${foundPdf.fileName}' is not a valid PDF document.`);
        }
        return foundPdf.absolutePath;
    }
    /**
     * Architectural Placeholder for future PDF text extraction and syllabus hierarchy construction.
     *
     * Pipeline overview:
     * PDF (Raw Document)
     *   ↓
     * Text extraction & OCR (pdf-parse / OCR engine)
     *   ↓
     * Syllabus Structure Parser (Exam -> Subject -> Topic -> Subtopic)
     *   ↓
     * AI Question Generation & Calibration (Calibrated to real exam patterns)
     *   ↓
     * Question Classification & Adaptive Practice Engine
     *
     * NOTE: As per system requirements, AI extraction is not implemented yet.
     */
    static async extractSyllabusStructurePlaceholder(examSlug) {
        const cleanSlug = this.sanitizeSlug(examSlug);
        const pdfPath = this.getPdfPath(cleanSlug);
        // TODO: [Future Milestone] Implement PDF text extraction using a PDF extraction library (e.g., pdf-parse)
        // TODO: [Future Milestone] Parse sections into Exam -> Subject -> Topic -> Subtopic hierarchy
        // TODO: [Future Milestone] Synchronize extracted hierarchy with Prisma Exam/Subject/Topic models
        return {
            examName: cleanSlug.toUpperCase(),
            examSlug: cleanSlug,
            version: '1.0.0-placeholder',
            extractedAt: new Date().toISOString(),
            sourceDocument: path.basename(pdfPath),
            subjects: [],
        };
    }
}
