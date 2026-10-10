/**
 * Syllabus Document Configuration & Registry
 *
 * Defines standard metadata, schemas, and default document registrations
 * for government exam syllabus PDFs (RRB NTPC, RRB Group D, RRB ALP, RRB JE, APPSC, SSC CGL, IBPS PO).
 */
/**
 * Initial registry of syllabus configurations for supported examinations.
 * Note: Actual PDF files can be placed into the respective folders in backend/data/syllabus/<slug>/
 */
export const DEFAULT_SYLLABUS_REGISTRY = [
    {
        exam: 'RRB NTPC',
        slug: 'rrb-ntpc',
        fileName: 'syllabus.pdf',
        filePath: 'rrb-ntpc/syllabus.pdf',
        documentType: 'SYLLABUS',
        language: 'English',
        description: 'Official Railway Recruitment Board Non-Technical Popular Categories (Graduate & Undergraduate) CBT-1 and CBT-2 comprehensive syllabus.',
        addedDate: '2026-10-05',
    },
    {
        exam: 'RRB Group D',
        slug: 'rrb-group-d',
        fileName: 'syllabus.pdf',
        filePath: 'rrb-group-d/syllabus.pdf',
        documentType: 'SYLLABUS',
        language: 'English',
        description: 'Official Railway Recruitment Cell Level-1 (Group D) CBT examination syllabus covering Mathematics, General Intelligence & Reasoning, General Science, and General Awareness.',
        addedDate: '2026-10-05',
    },
    {
        exam: 'RRB ALP',
        slug: 'rrb-alp',
        fileName: 'syllabus.pdf',
        filePath: 'rrb-alp/syllabus.pdf',
        documentType: 'SYLLABUS',
        language: 'English',
        description: 'Official RRB Assistant Loco Pilot CBT-1, CBT-2 (Part A & Part B Technical Trades), and CBAT syllabus.',
        addedDate: '2026-10-05',
    },
    {
        exam: 'RRB JE',
        slug: 'rrb-je',
        fileName: 'syllabus.pdf',
        filePath: 'rrb-je/syllabus.pdf',
        documentType: 'SYLLABUS',
        language: 'English',
        description: 'Official RRB Junior Engineer (CBT-1 Non-Tech and CBT-2 Technical Engineering) syllabus.',
        addedDate: '2026-10-05',
    },
    {
        exam: 'APPSC Group 2 & Services',
        slug: 'appsc',
        fileName: 'syllabus.pdf',
        filePath: 'appsc/syllabus.pdf',
        documentType: 'SYLLABUS',
        language: 'English',
        description: 'Andhra Pradesh Public Service Commission General Studies, Mental Ability, and specific departmental exam syllabus.',
        addedDate: '2026-10-05',
    },
    {
        exam: 'SSC CGL',
        slug: 'ssc-cgl',
        fileName: 'syllabus.pdf',
        filePath: 'ssc-cgl/syllabus.pdf',
        documentType: 'SYLLABUS',
        language: 'English',
        description: 'Staff Selection Commission Combined Graduate Level Tier-1 & Tier-2 official examination syllabus.',
        addedDate: '2026-10-05',
    },
    {
        exam: 'IBPS PO',
        slug: 'ibps-po',
        fileName: 'syllabus.pdf',
        filePath: 'ibps-po/syllabus.pdf',
        documentType: 'SYLLABUS',
        language: 'English',
        description: 'Institute of Banking Personnel Selection Probationary Officer Prelims & Mains examination syllabus.',
        addedDate: '2026-10-05',
    },
];
