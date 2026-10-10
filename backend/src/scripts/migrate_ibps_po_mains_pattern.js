import { prisma } from '../config/db.js';

async function migrateIbpsPoMainsPattern() {
    console.log('========================================================================');
    console.log('🏦 MIGRATING IBPS PO ONLINE MAIN EXAMINATION PATTERN IN POSTGRESQL 🏦');
    console.log('========================================================================\n');

    // 1. Find IBPS PO Exam
    const exam = await prisma.exam.findUnique({
        where: { code: 'IBPS_PO' },
        include: {
            stages: { include: { sections: true } },
            subjects: { include: { topics: true } },
            tests: true,
        },
    });

    if (!exam) {
        throw new Error('IBPS PO Exam not found in database!');
    }
    console.log(`Found Exam: ${exam.name} (${exam.id})`);

    // 2. Ensure Subjects and Topics
    // Subject 1: Reasoning & Computer Aptitude
    let reasoningSubject = exam.subjects.find((s) => s.slug === 'ibps-reasoning' || s.name.toLowerCase().includes('reasoning'));
    if (!reasoningSubject) {
        reasoningSubject = await prisma.subject.create({
            data: { examId: exam.id, name: 'Reasoning & Computer Aptitude', slug: 'ibps-reasoning', order: 1 },
        });
    } else if (!reasoningSubject.name.includes('Computer')) {
        reasoningSubject = await prisma.subject.update({
            where: { id: reasoningSubject.id },
            data: { name: 'Reasoning & Computer Aptitude' },
        });
    }

    // Topics for Reasoning & Computer Aptitude
    let topicPuzzles = await prisma.topic.findFirst({ where: { subjectId: reasoningSubject.id, slug: 'puzzles-seating' } });
    if (!topicPuzzles) {
        topicPuzzles = await prisma.topic.create({
            data: { subjectId: reasoningSubject.id, name: 'Seating Arrangement & High-Level Puzzles', slug: 'puzzles-seating', order: 1 },
        });
    }
    let topicComputer = await prisma.topic.findFirst({ where: { subjectId: reasoningSubject.id, slug: 'computer-aptitude' } });
    if (!topicComputer) {
        topicComputer = await prisma.topic.create({
            data: { subjectId: reasoningSubject.id, name: 'Computer Aptitude & Binary Logic', slug: 'computer-aptitude', order: 2 },
        });
    }
    let topicLogicalReasoning = await prisma.topic.findFirst({ where: { subjectId: reasoningSubject.id, slug: 'logical-reasoning' } });
    if (!topicLogicalReasoning) {
        topicLogicalReasoning = await prisma.topic.create({
            data: { subjectId: reasoningSubject.id, name: 'Syllogisms, Inequalities & Critical Reasoning', slug: 'logical-reasoning', order: 3 },
        });
    }

    // Subject 2: General / Economy / Banking Awareness
    let bankingSubject = exam.subjects.find((s) => s.slug === 'ibps-banking' || s.name.toLowerCase().includes('banking'));
    if (!bankingSubject) {
        bankingSubject = await prisma.subject.create({
            data: { examId: exam.id, name: 'General / Economy / Banking Awareness', slug: 'ibps-banking', order: 2 },
        });
    }

    let topicBankingAwareness = await prisma.topic.findFirst({ where: { subjectId: bankingSubject.id, slug: 'banking-awareness' } });
    if (!topicBankingAwareness) {
        topicBankingAwareness = await prisma.topic.create({
            data: { subjectId: bankingSubject.id, name: 'Banking & Financial Awareness', slug: 'banking-awareness', order: 1 },
        });
    }
    let topicEconomy = await prisma.topic.findFirst({ where: { subjectId: bankingSubject.id, slug: 'indian-economy' } });
    if (!topicEconomy) {
        topicEconomy = await prisma.topic.create({
            data: { subjectId: bankingSubject.id, name: 'Indian Economy & Current Affairs', slug: 'indian-economy', order: 2 },
        });
    }

    // Subject 3: English Language
    let englishSubject = exam.subjects.find((s) => s.slug === 'ibps-english' || s.name.toLowerCase().includes('english'));
    if (!englishSubject) {
        englishSubject = await prisma.subject.create({
            data: { examId: exam.id, name: 'English Language', slug: 'ibps-english', order: 3 },
        });
    }

    let topicReadingComp = await prisma.topic.findFirst({ where: { subjectId: englishSubject.id, slug: 'reading-comp' } });
    if (!topicReadingComp) {
        topicReadingComp = await prisma.topic.create({
            data: { subjectId: englishSubject.id, name: 'Reading Comprehension & Cloze Test', slug: 'reading-comp', order: 1 },
        });
    }
    let topicGrammar = await prisma.topic.findFirst({ where: { subjectId: englishSubject.id, slug: 'grammar-vocabulary' } });
    if (!topicGrammar) {
        topicGrammar = await prisma.topic.create({
            data: { subjectId: englishSubject.id, name: 'Grammar, Error Spotting & Vocabulary', slug: 'grammar-vocabulary', order: 2 },
        });
    }

    // Subject 4: Data Analysis & Interpretation
    let quantSubject = exam.subjects.find((s) => s.slug === 'ibps-quant' || s.name.toLowerCase().includes('quant') || s.name.toLowerCase().includes('data'));
    if (!quantSubject) {
        quantSubject = await prisma.subject.create({
            data: { examId: exam.id, name: 'Data Analysis & Interpretation', slug: 'ibps-quant', order: 4 },
        });
    } else if (!quantSubject.name.includes('Data Analysis')) {
        quantSubject = await prisma.subject.update({
            where: { id: quantSubject.id },
            data: { name: 'Data Analysis & Interpretation' },
        });
    }

    let topicDI = await prisma.topic.findFirst({ where: { subjectId: quantSubject.id, slug: 'data-interpretation' } });
    if (!topicDI) {
        topicDI = await prisma.topic.create({
            data: { subjectId: quantSubject.id, name: 'Tables, Charts & Caselet DI', slug: 'data-interpretation', order: 1 },
        });
    }
    let topicDataSufficiency = await prisma.topic.findFirst({ where: { subjectId: quantSubject.id, slug: 'data-sufficiency' } });
    if (!topicDataSufficiency) {
        topicDataSufficiency = await prisma.topic.create({
            data: { subjectId: quantSubject.id, name: 'Data Sufficiency & Quantitative Analysis', slug: 'data-sufficiency', order: 2 },
        });
    }

    // Subject 5: Descriptive English
    let descriptiveSubject = exam.subjects.find((s) => s.slug === 'ibps-descriptive' || s.name.toLowerCase().includes('descriptive'));
    if (!descriptiveSubject) {
        descriptiveSubject = await prisma.subject.create({
            data: { examId: exam.id, name: 'Descriptive English', slug: 'ibps-descriptive', order: 5 },
        });
    }

    let topicLetterWriting = await prisma.topic.findFirst({ where: { subjectId: descriptiveSubject.id, slug: 'letter-writing' } });
    if (!topicLetterWriting) {
        topicLetterWriting = await prisma.topic.create({
            data: { subjectId: descriptiveSubject.id, name: 'Letter Writing (Formal & Informal)', slug: 'letter-writing', order: 1 },
        });
    }
    let topicEssayWriting = await prisma.topic.findFirst({ where: { subjectId: descriptiveSubject.id, slug: 'essay-writing' } });
    if (!topicEssayWriting) {
        topicEssayWriting = await prisma.topic.create({
            data: { subjectId: descriptiveSubject.id, name: 'Essay Writing (Banking & Socio-Economic)', slug: 'essay-writing', order: 2 },
        });
    }

    console.log('✅ All 5 Subjects & Topics verified for IBPS PO.');

    // Update Exam Pattern in Exam Table to Official IBPS PO Notification Structure
    const patternTable = [
        { item: 'Reasoning & Computer Aptitude', questions: 45, marks: 60, time: '60 minutes', details: '45 Questions | 60 Marks | 60 Minutes | Medium: English & Hindi' },
        { item: 'General / Economy / Banking Awareness', questions: 40, marks: 40, time: '35 minutes', details: '40 Questions | 40 Marks | 35 Minutes | Medium: English & Hindi' },
        { item: 'English Language', questions: 35, marks: 40, time: '40 minutes', details: '35 Questions | 40 Marks | 40 Minutes | Medium: English only' },
        { item: 'Data Analysis & Interpretation', questions: 35, marks: 60, time: '45 minutes', details: '35 Questions | 60 Marks | 45 Minutes | Medium: English & Hindi' },
        { item: 'Objective Test Subtotal', questions: 155, marks: 200, time: '180 minutes', isSubtotal: true, details: '155 Objective Questions | 200 Marks | 180 Minutes' },
        { item: 'Descriptive Paper', questions: 2, marks: 25, time: '30 minutes', details: '2 Tasks (Essay & Letter) | 25 Marks | 30 Minutes | Medium: English only (Qualifying)' },
        { item: 'Grand Total', questions: 157, marks: 225, time: '210 minutes', isTotal: true, details: '157 Questions/Tasks | 225 Marks | 210 Minutes (3 hours 30 mins)' },
    ];

    await prisma.exam.update({
        where: { id: exam.id },
        data: {
            durationMinutes: 210,
            totalQuestions: 157,
            totalMarks: 225,
            negativeMarking: '0.25 (1/4th) mark deduction for objective questions, None for descriptive',
            pattern: JSON.stringify(patternTable),
        },
    });

    // 3. Update Exam Stage: MAINS
    let mainsStage = exam.stages.find((s) => s.code === 'MAINS');
    const stageDescription = 'Official IBPS PO Online Main Examination: Reasoning & Computer Aptitude (45 Qs / 60 M / 60m), General Awareness (40 Qs / 40 M / 35m), English Language (35 Qs / 40 M / 40m), Data Analysis & Interpretation (35 Qs / 60 M / 45m), and Descriptive Paper (2 Prompts / 25 M / 30m). Total: 157 Qs / 225 Marks / 210 Minutes.';

    if (!mainsStage) {
        mainsStage = await prisma.examStage.create({
            data: {
                examId: exam.id,
                code: 'MAINS',
                name: 'Main Examination',
                paperName: 'Online Main Examination (Objective + Descriptive)',
                description: stageDescription,
                durationMinutes: 210,
                scribeDurationMinutes: 280,
                totalQuestions: 157,
                totalMarks: 225,
                marksPerQuestion: 1.0,
                negativeMarks: 0.25,
                questionType: 'OBJECTIVE_AND_DESCRIPTIVE',
                language: 'English, Hindi',
                isQualifying: false,
                isMerit: true,
                isScreening: false,
                separateTimer: true,
                sectionTiming: true,
                hasScribeExtension: true,
                notificationReference: 'Official IBPS CRP PO/MT Notification',
                notificationYear: 2024,
                lastVerifiedAt: new Date(),
                status: 'ACTIVE',
                order: 2,
            },
        });
    } else {
        mainsStage = await prisma.examStage.update({
            where: { id: mainsStage.id },
            data: {
                description: stageDescription,
                durationMinutes: 210,
                totalQuestions: 157,
                totalMarks: 225,
                negativeMarks: 0.25,
                questionType: 'OBJECTIVE_AND_DESCRIPTIVE',
                separateTimer: true,
                sectionTiming: true,
                notificationReference: 'Official IBPS CRP PO/MT Notification',
            },
        });
    }

    console.log(`✅ ExamStage MAINS updated: 157 Qs, 210 Mins, 225 Marks, sectionTiming: true.`);

    // 4. Update the 5 Sections under MAINS to Official Structure
    const sectionConfigs = [
        {
            code: 'REASONING_COMP',
            name: 'Reasoning & Computer Aptitude',
            questionCount: 45,
            durationMinutes: 60,
            totalMarks: 60.0,
            marksPerQuestion: 60.0 / 45.0,
            negativeMarks: 0.25,
            questionType: 'OBJECTIVE_MCQ',
            order: 1,
            subjectId: reasoningSubject.id,
        },
        {
            code: 'BANKING_AWARENESS',
            name: 'General / Economy / Banking Awareness',
            questionCount: 40,
            durationMinutes: 35,
            totalMarks: 40.0,
            marksPerQuestion: 1.0,
            negativeMarks: 0.25,
            questionType: 'OBJECTIVE_MCQ',
            order: 2,
            subjectId: bankingSubject.id,
        },
        {
            code: 'ENGLISH_MAINS',
            name: 'English Language',
            questionCount: 35,
            durationMinutes: 40,
            totalMarks: 40.0,
            marksPerQuestion: 40.0 / 35.0,
            negativeMarks: 0.25,
            questionType: 'OBJECTIVE_MCQ',
            order: 3,
            subjectId: englishSubject.id,
        },
        {
            code: 'DATA_INTERPRETATION',
            name: 'Data Analysis & Interpretation',
            questionCount: 35,
            durationMinutes: 45,
            totalMarks: 60.0,
            marksPerQuestion: 60.0 / 35.0,
            negativeMarks: 0.25,
            questionType: 'OBJECTIVE_MCQ',
            order: 4,
            subjectId: quantSubject.id,
        },
        {
            code: 'DESCRIPTIVE_ENGLISH',
            name: 'Descriptive Paper',
            questionCount: 2,
            durationMinutes: 30,
            totalMarks: 25.0,
            marksPerQuestion: 12.5,
            negativeMarks: 0.0,
            questionType: 'DESCRIPTIVE_ESSAY',
            order: 5,
            subjectId: descriptiveSubject.id,
        },
    ];

    for (const sc of sectionConfigs) {
        const existingSec = await prisma.examSection.findFirst({
            where: { stageId: mainsStage.id, code: sc.code },
        });

        if (existingSec) {
            await prisma.examSection.update({
                where: { id: existingSec.id },
                data: {
                    name: sc.name,
                    questionCount: sc.questionCount,
                    durationMinutes: sc.durationMinutes,
                    totalMarks: sc.totalMarks,
                    marksPerQuestion: sc.marksPerQuestion,
                    negativeMarks: sc.negativeMarks,
                    questionType: sc.questionType,
                    order: sc.order,
                    subjectId: sc.subjectId,
                },
            });
            console.log(`Updated section: ${sc.name} (${sc.questionCount} Qs / ${sc.durationMinutes}m / ${sc.totalMarks}M / -${sc.negativeMarks})`);
        } else {
            await prisma.examSection.create({
                data: {
                    stageId: mainsStage.id,
                    name: sc.name,
                    code: sc.code,
                    questionCount: sc.questionCount,
                    durationMinutes: sc.durationMinutes,
                    totalMarks: sc.totalMarks,
                    marksPerQuestion: sc.marksPerQuestion,
                    negativeMarks: sc.negativeMarks,
                    questionType: sc.questionType,
                    order: sc.order,
                    subjectId: sc.subjectId,
                },
            });
            console.log(`Created section: ${sc.name} (${sc.questionCount} Qs / ${sc.durationMinutes}m / ${sc.totalMarks}M / -${sc.negativeMarks})`);
        }
    }

    // 5. Update or Create IBPS PO Mains Test record
    const instructions = [
        'Welcome to the Official IBPS PO Online Main Examination.',
        'The examination comprises 5 sections with mandatory official Section-Wise Timers:',
        '1. Section 1: Reasoning & Computer Aptitude — 45 Questions, 60 Marks, 60 Minutes (English & Hindi).',
        '2. Section 2: General / Economy / Banking Awareness — 40 Questions, 40 Marks, 35 Minutes (English & Hindi).',
        '3. Section 3: English Language — 35 Questions, 40 Marks, 40 Minutes (English only).',
        '4. Section 4: Data Analysis & Interpretation — 35 Questions, 60 Marks, 45 Minutes (English & Hindi).',
        '5. Section 5: Descriptive Paper — 2 Prompts (Essay & Letter), 25 Marks, 30 Minutes (English only, Qualifying).',
        'Total Duration: 210 Minutes (3 hours 30 minutes). Objective: 180 mins, Descriptive: 30 mins.',
        'Total Questions/Tasks: 157 (155 Objective + 2 Descriptive Prompts). Maximum Marks: 225 Marks (200 Objective + 25 Descriptive).',
        'Negative Marking: 0.25 (1/4th) marks deducted for each incorrect objective answer. No negative marking for descriptive paper or unanswered questions.',
        'Descriptive Paper answers must be typed online in the descriptive text editor. Evaluated via transparent rubric.',
    ];

    const mainsMock = await prisma.test.findUnique({
        where: { slug: 'ibps-po-mains-mock-01' },
    });

    if (mainsMock) {
        await prisma.test.update({
            where: { id: mainsMock.id },
            data: {
                title: 'IBPS PO Main Examination Official Mock #1',
                type: 'FULL_MOCK',
                difficulty: 'HARD',
                totalQuestions: 157,
                durationMinutes: 210,
                totalMarks: 225,
                negativeMarkingPerQuestion: 0.25,
                status: 'ACTIVE',
                instructions: JSON.stringify(instructions),
            },
        });
        console.log(`✅ Test record 'ibps-po-mains-mock-01' updated: 157 Qs / 210 Mins / 225 Marks / -0.25 Neg.`);
    } else {
        await prisma.test.create({
            data: {
                examId: exam.id,
                stageId: mainsStage.id,
                slug: 'ibps-po-mains-mock-01',
                title: 'IBPS PO Main Examination Official Mock #1',
                type: 'FULL_MOCK',
                difficulty: 'HARD',
                totalQuestions: 157,
                durationMinutes: 210,
                totalMarks: 225,
                negativeMarkingPerQuestion: 0.25,
                status: 'ACTIVE',
                instructions: JSON.stringify(instructions),
            },
        });
        console.log(`✅ Created test record 'ibps-po-mains-mock-01'.`);
    }

    console.log('\n🎉 IBPS PO Online Main Examination pattern successfully migrated!\n');
}

migrateIbpsPoMainsPattern()
    .catch((err) => {
        console.error('Migration failed:', err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
