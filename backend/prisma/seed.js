import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { generateQuestionHash } from '../src/utils/questionHash.js';
import { TestSyncService } from '../src/services/test/testSyncService.js';
const prisma = new PrismaClient();
async function main() {
    console.log('🌱 Starting GovPrep Complete Database Seeding for All 5 Official Government Exams...');
    // 1. Clean existing tables safely
    await prisma.answer.deleteMany();
    await prisma.testAttempt.deleteMany();
    await prisma.practiceSessionQuestion.deleteMany();
    await prisma.practiceSession.deleteMany();
    await prisma.testQuestion.deleteMany();
    await prisma.test.deleteMany();
    await prisma.questionHistory.deleteMany();
    await prisma.question.deleteMany();
    await prisma.studentTopicPerformance.deleteMany();
    await prisma.weaknessProfile.deleteMany();
    await prisma.aIAnalysis.deleteMany();
    await prisma.recommendation.deleteMany();
    await prisma.syllabusDocument.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.examSection.deleteMany();
    await prisma.examStage.deleteMany();
    await prisma.subject.deleteMany();
    await prisma.exam.deleteMany();
    await prisma.user.deleteMany();
    console.log('🧹 Cleaned existing tables.');
    // 2. Create Admin User (Candidate directory starts clean with 0 users until real registration/login)
    const salt = await bcrypt.genSalt(10);
    const adminPassword = await bcrypt.hash('admin123', salt);
    const admin = await prisma.user.create({
        data: {
            name: 'GovPrep Administrator',
            email: 'admin@govprep.com',
            password: adminPassword,
            role: 'ADMIN',
            targetExam: 'All Exams',
            joinedDate: 'January 2025',
            status: 'Active',
        },
    });
    console.log('👤 Created User: GovPrep Administrator (Admin). Candidate directory starts clean (0 candidate users).');
    // ==========================================
    // 3. EXAM 1: APPSC FBO & ABO
    // ==========================================
    const appscExam = await prisma.exam.create({
        data: {
            code: 'APPSC_FBO_ABO',
            slug: 'appsc-fbo-abo',
            name: 'APPSC FBO & ABO',
            fullName: 'Andhra Pradesh PSC Forest Beat Officer & Assistant Beat Officer',
            category: 'State PSC',
            shortDescription: 'Official APPSC pattern: 150 Questions, 150 Mins with Part A (GS & Mental Ability, 75 Qs) & Part B (Science & Maths, 75 Qs).',
            fullDescription: 'Recruitment examination conducted by Andhra Pradesh Public Service Commission (APPSC) for Forest Beat Officer (FBO) and Assistant Beat Officer (ABO) in A.P. Forest Subordinate Service.',
            durationMinutes: 150,
            totalQuestions: 150,
            totalMarks: 150,
            negativeMarking: '0.33',
            badge: 'State PSC Choice',
            status: 'Active',
            eligibility: 'Intermediate (10+2) or equivalent with physical measurement standards',
            pattern: JSON.stringify([
                { item: 'Screening Test', details: '150 Questions | 150 Mins | Part A (75) + Part B (75)' },
                { item: 'Mains Examination', details: 'Qualifying Essay + GS (75) + Science & Maths (75)' },
                { item: 'Negative Marking', details: '1/3rd mark (0.33) deducted for each incorrect answer' },
            ]),
        },
    });
    const appscScreening = await prisma.examStage.create({
        data: {
            examId: appscExam.id,
            code: 'SCREENING_TEST',
            name: 'Screening Test',
            paperName: 'Objective Screening Examination',
            description: 'Computer-based / Offline objective screening examination: Part A (75 Qs) and Part B (75 Qs).',
            durationMinutes: 150,
            scribeDurationMinutes: 200,
            totalQuestions: 150,
            totalMarks: 150,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_MCQ',
            language: 'English, Telugu',
            isQualifying: true,
            isMerit: false,
            isScreening: true,
            separateTimer: false,
            sectionTiming: false,
            hasScribeExtension: true,
            notificationReference: 'APPSC Notification No. 04/2024',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 1,
        },
    });
    await prisma.examSection.create({
        data: { stageId: appscScreening.id, name: 'Part A: General Studies & Mental Ability', code: 'PART_A', questionCount: 75, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: appscScreening.id, name: 'Part B: General Science & General Mathematics', code: 'PART_B', questionCount: 75, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 2 },
    });
    const appscMains = await prisma.examStage.create({
        data: {
            examId: appscExam.id,
            code: 'MAINS',
            name: 'Mains Examination',
            paperName: 'Mains Examination (3 Components)',
            description: 'APPSC FBO & ABO Mains Examination: Component A (Qualifying Essay, 45m / 50 Marks), Component B (Paper 1: GS & Mental Ability, 100 Qs / 100m / 100 Marks), Component C (Paper 2: Science & Maths, 100 Qs / 100m / 100 Marks).',
            durationMinutes: 245,
            scribeDurationMinutes: 326,
            totalQuestions: 201,
            totalMarks: 250,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_AND_DESCRIPTIVE',
            language: 'English, Telugu, Urdu',
            isQualifying: false,
            isMerit: true,
            isScreening: false,
            separateTimer: true,
            sectionTiming: true,
            hasScribeExtension: true,
            notificationReference: 'APPSC Notification No. 04/2024',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 2,
        },
    });
    await prisma.examSection.create({
        data: { stageId: appscMains.id, name: 'Component A: Qualifying Essay (Environmental & Forest Topics)', code: 'ESSAY', questionCount: 1, durationMinutes: 45, totalMarks: 50.0, marksPerQuestion: 50.0, negativeMarks: 0.0, questionType: 'DESCRIPTIVE_ESSAY', order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: appscMains.id, name: 'Component B: Paper 1 — General Studies & Mental Ability', code: 'PAPER_1', questionCount: 100, durationMinutes: 100, totalMarks: 100.0, marksPerQuestion: 1.0, negativeMarks: 0.33, questionType: 'OBJECTIVE_MCQ', order: 2 },
    });
    await prisma.examSection.create({
        data: { stageId: appscMains.id, name: 'Component C: Paper 2 — General Science & General Mathematics', code: 'PAPER_2', questionCount: 100, durationMinutes: 100, totalMarks: 100.0, marksPerQuestion: 1.0, negativeMarks: 0.33, questionType: 'OBJECTIVE_MCQ', order: 3 },
    });
    const appscSubA = await prisma.subject.create({
        data: { examId: appscExam.id, name: 'Part A: General Studies & Mental Ability', slug: 'appsc-part-a', order: 1 },
    });
    const appscSubB = await prisma.subject.create({
        data: { examId: appscExam.id, name: 'Part B: General Science & General Mathematics', slug: 'appsc-part-b', order: 2 },
    });
    const appscSubC = await prisma.subject.create({
        data: { examId: appscExam.id, name: 'Qualifying Essay: Environmental & Forest Subjects', slug: 'appsc-qualifying-essay', order: 3 },
    });
    const topicAPEssay = await prisma.topic.create({
        data: { subjectId: appscSubC.id, name: 'Environmental & Forestry Essay Topics', slug: 'appsc-environmental-essay', order: 1 },
    });
    const topicAPHistory = await prisma.topic.create({
        data: { subjectId: appscSubA.id, name: 'AP History & Governance', slug: 'ap-history', order: 1 },
    });
    const topicAPReasoning = await prisma.topic.create({
        data: { subjectId: appscSubA.id, name: 'Mental Ability & Data Analysis', slug: 'ap-mental-ability', order: 2 },
    });
    const topicAPScience = await prisma.topic.create({
        data: { subjectId: appscSubB.id, name: 'General Science & Forestry Basics', slug: 'forestry-science', order: 1 },
    });
    const topicAPMaths = await prisma.topic.create({
        data: { subjectId: appscSubB.id, name: 'General Mathematics & Arithmetic', slug: 'ap-maths', order: 2 },
    });
    // ==========================================
    // 4. EXAM 2: RRB NTPC
    // ==========================================
    const rrbExam = await prisma.exam.create({
        data: {
            code: 'RRB_NTPC',
            slug: 'rrb-ntpc',
            name: 'RRB NTPC',
            fullName: 'Railway Recruitment Board Non-Technical Popular Categories',
            category: 'Railways',
            shortDescription: 'Official RRB CBT-1 (100 Qs: 40 GA + 30 Math + 30 Reasoning / 90 Mins) and CBT-2 (120 Qs / 90 Mins) with 1/3 negative marking.',
            fullDescription: 'The RRB Non-Technical Popular Categories (NTPC) examination recruits commercial apprentice, goods guard, station master, traffic assistant, and clerk roles.',
            durationMinutes: 90,
            totalQuestions: 100,
            totalMarks: 100,
            negativeMarking: '0.33',
            badge: 'High Aspirants Choice',
            status: 'Active',
            eligibility: 'Graduate / 12th Pass (18–33 years)',
            pattern: JSON.stringify([
                { item: 'Stage 1 CBT', details: '100 Questions | 90 Mins (120 Scribe) | GA (40) + Math (30) + Reasoning (30)' },
                { item: 'Stage 2 CBT', details: '120 Questions | 90 Mins (120 Scribe) | GA (50) + Math (35) + Reasoning (35)' },
                { item: 'Negative Marking', details: '1/3rd (0.33) marks deducted per incorrect answer' },
            ]),
        },
    });
    const rrbCbt1 = await prisma.examStage.create({
        data: {
            examId: rrbExam.id,
            code: 'CBT_1',
            name: 'CBT-1',
            paperName: '1st Stage Computer Based Test (Screening)',
            description: '100 objective questions: General Awareness (40), Mathematics (30), and Reasoning (30).',
            durationMinutes: 90,
            scribeDurationMinutes: 120,
            totalQuestions: 100,
            totalMarks: 100,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_MCQ',
            language: 'English, Hindi, Regional Languages',
            isQualifying: true,
            isMerit: false,
            isScreening: true,
            separateTimer: false,
            sectionTiming: false,
            hasScribeExtension: true,
            notificationReference: 'CEN 01/2019 & CEN 05/2024',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 1,
        },
    });
    const rrbCbt2 = await prisma.examStage.create({
        data: {
            examId: rrbExam.id,
            code: 'CBT_2',
            name: 'CBT-2',
            paperName: '2nd Stage Computer Based Test (Merit)',
            description: '120 objective questions: General Awareness (50), Mathematics (35), and Reasoning (35).',
            durationMinutes: 90,
            scribeDurationMinutes: 120,
            totalQuestions: 120,
            totalMarks: 120,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_MCQ',
            language: 'English, Hindi, Regional Languages',
            isQualifying: false,
            isMerit: true,
            isScreening: false,
            separateTimer: false,
            sectionTiming: false,
            hasScribeExtension: true,
            notificationReference: 'CEN 01/2019 & CEN 05/2024',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 2,
        },
    });
    await prisma.examSection.create({
        data: { stageId: rrbCbt1.id, name: 'General Awareness', code: 'GA', questionCount: 40, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbCbt1.id, name: 'Mathematics', code: 'MATH', questionCount: 30, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 2 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbCbt1.id, name: 'General Intelligence & Reasoning', code: 'REASONING', questionCount: 30, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 3 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbCbt2.id, name: 'General Awareness', code: 'GA', questionCount: 50, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbCbt2.id, name: 'Mathematics', code: 'MATH', questionCount: 35, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 2 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbCbt2.id, name: 'General Intelligence & Reasoning', code: 'REASONING', questionCount: 35, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 3 },
    });
    const gaSubject = await prisma.subject.create({
        data: { examId: rrbExam.id, name: 'General Awareness', slug: 'general-awareness', order: 1 },
    });
    const mathsSubject = await prisma.subject.create({
        data: { examId: rrbExam.id, name: 'Mathematics', slug: 'mathematics', order: 2 },
    });
    const reasoningSubject = await prisma.subject.create({
        data: { examId: rrbExam.id, name: 'General Intelligence & Reasoning', slug: 'reasoning', order: 3 },
    });
    const topicPolity = await prisma.topic.create({
        data: { subjectId: gaSubject.id, name: 'Indian Polity & Constitution', slug: 'polity', order: 1 },
    });
    const topicHistory = await prisma.topic.create({
        data: { subjectId: gaSubject.id, name: 'Indian History & Freedom Struggle', slug: 'history', order: 2 },
    });
    const topicScience = await prisma.topic.create({
        data: { subjectId: gaSubject.id, name: 'General Science', slug: 'general-science', order: 3 },
    });
    const topicGeography = await prisma.topic.create({
        data: { subjectId: gaSubject.id, name: 'Geography of India & World', slug: 'geography', order: 4 },
    });
    const topicPercentages = await prisma.topic.create({
        data: { subjectId: mathsSubject.id, name: 'Percentages', slug: 'percentages', order: 1 },
    });
    const topicProfitLoss = await prisma.topic.create({
        data: { subjectId: mathsSubject.id, name: 'Profit & Loss', slug: 'profit-loss', order: 2 },
    });
    const topicTimeWork = await prisma.topic.create({
        data: { subjectId: mathsSubject.id, name: 'Time & Work', slug: 'time-work', order: 3 },
    });
    const topicRatio = await prisma.topic.create({
        data: { subjectId: mathsSubject.id, name: 'Ratio & Proportion', slug: 'ratio-proportion', order: 4 },
    });
    const topicSICI = await prisma.topic.create({
        data: { subjectId: mathsSubject.id, name: 'SI & CI', slug: 'si-ci', order: 5 },
    });
    const topicSyllogism = await prisma.topic.create({
        data: { subjectId: reasoningSubject.id, name: 'Syllogism', slug: 'syllogism', order: 1 },
    });
    const topicBloodRelations = await prisma.topic.create({
        data: { subjectId: reasoningSubject.id, name: 'Blood Relations', slug: 'blood-relations', order: 2 },
    });
    const topicSeries = await prisma.topic.create({
        data: { subjectId: reasoningSubject.id, name: 'Number & Alphabet Series', slug: 'series', order: 3 },
    });
    const topicCoding = await prisma.topic.create({
        data: { subjectId: reasoningSubject.id, name: 'Coding-Decoding', slug: 'coding-decoding', order: 4 },
    });
    // ==========================================
    // 5. EXAM 3: RRB JE
    // ==========================================
    const rrbJeExam = await prisma.exam.create({
        data: {
            code: 'RRB_JE',
            slug: 'rrb-je',
            name: 'RRB JE',
            fullName: 'Railway Recruitment Board Junior Engineer',
            category: 'Railways',
            shortDescription: 'Official pattern: CBT-1 (100 Qs: Maths 30, Reasoning 25, GA 15, Science 30 / 90 Mins) and CBT-2 (150 Qs / 120 Mins).',
            fullDescription: 'RRB Junior Engineer recruitment for Civil, Electrical, Mechanical, Electronics, and IT engineering posts in Indian Railways.',
            durationMinutes: 90,
            totalQuestions: 100,
            totalMarks: 100,
            negativeMarking: '0.33',
            badge: 'Engineering Core',
            status: 'Active',
            eligibility: 'Diploma / Degree in Engineering in relevant branch',
            pattern: JSON.stringify([
                { item: 'Stage 1 CBT', details: '100 Questions | 90 Mins | Maths (30) + Reasoning (25) + GA (15) + Science (30)' },
                { item: 'Stage 2 CBT', details: '150 Questions | 120 Mins | GA (15) + Phys/Chem (15) + Computers (10) + Environment (10) + Technical (100)' },
                { item: 'Negative Marking', details: '1/3rd (0.33) marks per wrong response' },
            ]),
        },
    });
    const rrbJeCbt1 = await prisma.examStage.create({
        data: {
            examId: rrbJeExam.id,
            code: 'CBT_1',
            name: 'CBT-1',
            paperName: '1st Stage Computer Based Test (Screening)',
            description: '100 objective questions covering Mathematics (30), Reasoning (25), GA (15), and General Science (30).',
            durationMinutes: 90,
            scribeDurationMinutes: 120,
            totalQuestions: 100,
            totalMarks: 100,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_MCQ',
            language: 'English, Hindi, Regional Languages',
            isQualifying: true,
            isMerit: false,
            isScreening: true,
            separateTimer: false,
            sectionTiming: false,
            hasScribeExtension: true,
            notificationReference: 'CEN 03/2024',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 1,
        },
    });
    const rrbJeCbt2 = await prisma.examStage.create({
        data: {
            examId: rrbJeExam.id,
            code: 'CBT_2',
            name: 'CBT-2',
            paperName: '2nd Stage Computer Based Test (Technical + Non-Technical)',
            description: '150 objective questions: GA (15), Physics/Chem (15), Computers (10), Environment (10), Technical Abilities (100).',
            durationMinutes: 120,
            scribeDurationMinutes: 160,
            totalQuestions: 150,
            totalMarks: 150,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_MCQ',
            language: 'English, Hindi, Regional Languages',
            isQualifying: false,
            isMerit: true,
            isScreening: false,
            separateTimer: false,
            sectionTiming: false,
            hasScribeExtension: true,
            notificationReference: 'CEN 03/2024',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 2,
        },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt1.id, name: 'Mathematics', code: 'MATH', questionCount: 30, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt1.id, name: 'General Intelligence & Reasoning', code: 'REASONING', questionCount: 25, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 2 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt1.id, name: 'General Awareness', code: 'GA', questionCount: 15, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 3 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt1.id, name: 'General Science', code: 'SCIENCE', questionCount: 30, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 4 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt2.id, name: 'General Awareness', code: 'GA', questionCount: 15, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt2.id, name: 'Physics & Chemistry', code: 'PHYSICS_CHEM', questionCount: 15, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 2 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt2.id, name: 'Basics of Computers & Applications', code: 'COMPUTERS', questionCount: 10, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 3 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt2.id, name: 'Basics of Environment & Pollution Control', code: 'ENVIRONMENT', questionCount: 10, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 4 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbJeCbt2.id, name: 'Technical Abilities (Civil / Electrical / Electronics / Mechanical)', code: 'TECHNICAL', questionCount: 100, marksPerQuestion: 1.0, negativeMarks: 0.33, discipline: 'Common', order: 5 },
    });
    const jeMathsSub = await prisma.subject.create({
        data: { examId: rrbJeExam.id, name: 'Mathematics', slug: 'je-maths', order: 1 },
    });
    const jeReasoningSub = await prisma.subject.create({
        data: { examId: rrbJeExam.id, name: 'General Intelligence & Reasoning', slug: 'je-reasoning', order: 2 },
    });
    const jeGASub = await prisma.subject.create({
        data: { examId: rrbJeExam.id, name: 'General Awareness', slug: 'je-ga', order: 3 },
    });
    const jeScienceSub = await prisma.subject.create({
        data: { examId: rrbJeExam.id, name: 'General Science', slug: 'je-science', order: 4 },
    });
    const jeTechSub = await prisma.subject.create({
        data: { examId: rrbJeExam.id, name: 'Technical Abilities', slug: 'je-technical', order: 5 },
    });
    const topicJEMath = await prisma.topic.create({
        data: { subjectId: jeMathsSub.id, name: 'Algebra, Geometry & Arithmetic', slug: 'je-math-topics', order: 1 },
    });
    const topicJEReason = await prisma.topic.create({
        data: { subjectId: jeReasoningSub.id, name: 'Logical & Analytical Reasoning', slug: 'je-reason-topics', order: 1 },
    });
    const topicJEGA = await prisma.topic.create({
        data: { subjectId: jeGASub.id, name: 'Current Affairs & General Knowledge', slug: 'je-ga-topics', order: 1 },
    });
    const topicJEScience = await prisma.topic.create({
        data: { subjectId: jeScienceSub.id, name: 'Physics, Chemistry & Life Sciences', slug: 'je-sci-topics', order: 1 },
    });
    const topicJETech = await prisma.topic.create({
        data: { subjectId: jeTechSub.id, name: 'Core Engineering Fundamentals', slug: 'je-tech-topics', order: 1 },
    });
    // ==========================================
    // 6. EXAM 4: RRB GROUP D (RRC Level-1)
    // ==========================================
    const rrbGroupDExam = await prisma.exam.create({
        data: {
            code: 'RRB_GROUP_D',
            slug: 'rrb-group-d',
            name: 'RRB Group D',
            fullName: 'Railway Recruitment Board Group D / Level-1 Posts',
            category: 'Railways',
            shortDescription: 'Official CBT pattern: 100 Questions, 90 Mins, 1/3 Negative Marking across Science (25), Maths (25), Reasoning (30) & GA (20).',
            fullDescription: 'RRB Group D (RRC Level-1) recruitment examination conducted across India for track maintainer, pointsman, assistant workshop, and engineering level-1 posts.',
            durationMinutes: 90,
            totalQuestions: 100,
            totalMarks: 100,
            negativeMarking: '0.33',
            badge: 'High Vacancy Choice',
            status: 'Active',
            eligibility: '10th Pass (Matriculation) or ITI equivalent (18–33 years)',
            pattern: JSON.stringify([
                { item: 'Computer Based Test (CBT)', details: '100 Questions | 90 Mins (120 Scribe) | Single Stage Merit CBT' },
                { item: 'Subject Weightage', details: 'Science (25) + Maths (25) + Reasoning (30) + GA & Current Affairs (20)' },
                { item: 'Negative Marking', details: '1/3rd (0.33) marks deducted per incorrect answer' },
            ]),
        },
    });
    const rrbGroupDCbt = await prisma.examStage.create({
        data: {
            examId: rrbGroupDExam.id,
            code: 'CBT',
            name: 'Computer Based Test (CBT)',
            paperName: 'Single Stage Computer Based Test',
            description: 'Official single stage CBT with 100 MCQs: General Science (25), Mathematics (25), Reasoning (30), and GA & Current Affairs (20).',
            durationMinutes: 90,
            scribeDurationMinutes: 120,
            totalQuestions: 100,
            totalMarks: 100,
            marksPerQuestion: 1.0,
            negativeMarks: 0.33,
            questionType: 'OBJECTIVE_MCQ',
            language: 'English, Hindi, Regional Languages',
            isQualifying: false,
            isMerit: true,
            isScreening: false,
            separateTimer: false,
            sectionTiming: false,
            hasScribeExtension: true,
            notificationReference: 'CEN RRC-01/2019 & RRC Level-1 2024-25',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 1,
        },
    });
    await prisma.examSection.create({
        data: { stageId: rrbGroupDCbt.id, name: 'General Science', code: 'SCIENCE', questionCount: 25, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbGroupDCbt.id, name: 'Mathematics', code: 'MATH', questionCount: 25, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 2 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbGroupDCbt.id, name: 'General Intelligence & Reasoning', code: 'REASONING', questionCount: 30, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 3 },
    });
    await prisma.examSection.create({
        data: { stageId: rrbGroupDCbt.id, name: 'General Awareness & Current Affairs', code: 'GA_CA', questionCount: 20, marksPerQuestion: 1.0, negativeMarks: 0.33, order: 4 },
    });
    const gdScienceSubject = await prisma.subject.create({
        data: { examId: rrbGroupDExam.id, name: 'General Science', slug: 'gd-science', order: 1 },
    });
    const gdMathSubject = await prisma.subject.create({
        data: { examId: rrbGroupDExam.id, name: 'Mathematics', slug: 'gd-maths', order: 2 },
    });
    const gdReasoningSubject = await prisma.subject.create({
        data: { examId: rrbGroupDExam.id, name: 'General Intelligence & Reasoning', slug: 'gd-reasoning', order: 3 },
    });
    const gdGASubject = await prisma.subject.create({
        data: { examId: rrbGroupDExam.id, name: 'General Awareness & Current Affairs', slug: 'gd-ga', order: 4 },
    });
    const topicGDPhysics = await prisma.topic.create({
        data: { subjectId: gdScienceSubject.id, name: '10th Standard Physics & Chemistry', slug: 'gd-physics-chem', order: 1 },
    });
    const topicGDArith = await prisma.topic.create({
        data: { subjectId: gdMathSubject.id, name: 'Basic Arithmetic & Number Systems', slug: 'gd-arithmetic', order: 1 },
    });
    const topicGDReasoning = await prisma.topic.create({
        data: { subjectId: gdReasoningSubject.id, name: 'Analogies & Series', slug: 'gd-reason-topics', order: 1 },
    });
    const topicGDGA = await prisma.topic.create({
        data: { subjectId: gdGASubject.id, name: 'Current Affairs & Static GK', slug: 'gd-ga-topics', order: 1 },
    });
    // ==========================================
    // 7. EXAM 5: IBPS PO (Probationary Officer)
    // ==========================================
    const ibpsExam = await prisma.exam.create({
        data: {
            code: 'IBPS_PO',
            slug: 'ibps-po',
            name: 'IBPS PO',
            fullName: 'Institute of Banking Personnel Selection - Probationary Officer',
            category: 'Banking',
            shortDescription: 'Official Prelims (100 Qs: English 30, Quant 35, Reasoning 35 / 60 Mins with 20-min sectional timers) & Mains (157 Qs / 225 Marks) with 1/4 negative marking.',
            fullDescription: 'IBPS PO examination recruits Probationary Officers / Management Trainees across 11 major participating public sector banks in India.',
            durationMinutes: 60,
            totalQuestions: 100,
            totalMarks: 100,
            negativeMarking: '0.25',
            badge: 'Banking Premium',
            status: 'Active',
            eligibility: 'Graduation in any discipline from a recognized University (20–30 years)',
            pattern: JSON.stringify([
                { item: 'Preliminary Examination', details: '100 Questions | 60 Mins | 20 Mins Sectional Timers | English (30) + Quant (35) + Reasoning (35)' },
                { item: 'Main Examination', details: '155 Objective Qs (200 Marks, 180 Mins) + Descriptive English (25 Marks, 30 Mins)' },
                { item: 'Negative Marking', details: '1/4th (0.25) marks deducted per wrong answer in Objective tests' },
            ]),
        },
    });
    const ibpsPrelims = await prisma.examStage.create({
        data: {
            examId: ibpsExam.id,
            code: 'PRELIMS',
            name: 'Preliminary Examination',
            paperName: 'Online Preliminary Examination',
            description: '100 Questions with strict 20-minute sectional countdown timers: English (30), Quant (35), Reasoning (35).',
            durationMinutes: 60,
            scribeDurationMinutes: 80,
            totalQuestions: 100,
            totalMarks: 100,
            marksPerQuestion: 1.0,
            negativeMarks: 0.25,
            questionType: 'OBJECTIVE_MCQ',
            language: 'English, Hindi',
            isQualifying: true,
            isMerit: false,
            isScreening: true,
            separateTimer: false,
            sectionTiming: true, // Sectional Timers active!
            hasScribeExtension: true,
            notificationReference: 'IBPS CRP PO/MT-XIV (2024-25)',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 1,
        },
    });
    const ibpsMains = await prisma.examStage.create({
        data: {
            examId: ibpsExam.id,
            code: 'MAINS',
            name: 'Main Examination',
            paperName: 'Online Main Examination (Objective + Descriptive)',
            description: 'Objective Test (155 Qs / 200 Marks / 180 Mins) + English Descriptive Essay/Letter (2 Qs / 25 Marks / 30 Mins).',
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
            separateTimer: false,
            sectionTiming: true,
            hasScribeExtension: true,
            notificationReference: 'IBPS CRP PO/MT-XIV (2024-25)',
            notificationYear: 2024,
            lastVerifiedAt: new Date(),
            status: 'ACTIVE',
            order: 2,
        },
    });
    // Sections for IBPS PO Prelims with exact 20-minute sectional durations
    await prisma.examSection.create({
        data: { stageId: ibpsPrelims.id, name: 'English Language', code: 'ENGLISH', questionCount: 30, durationMinutes: 20, marksPerQuestion: 1.0, negativeMarks: 0.25, order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: ibpsPrelims.id, name: 'Quantitative Aptitude', code: 'QUANT', questionCount: 35, durationMinutes: 20, marksPerQuestion: 1.0, negativeMarks: 0.25, order: 2 },
    });
    await prisma.examSection.create({
        data: { stageId: ibpsPrelims.id, name: 'Reasoning Ability', code: 'REASONING', questionCount: 35, durationMinutes: 20, marksPerQuestion: 1.0, negativeMarks: 0.25, order: 3 },
    });
    // Sections for IBPS PO Mains
    await prisma.examSection.create({
        data: { stageId: ibpsMains.id, name: 'Reasoning & Computer Aptitude', code: 'REASONING_COMP', questionCount: 45, durationMinutes: 60, marksPerQuestion: 1.33, negativeMarks: 0.25, order: 1 },
    });
    await prisma.examSection.create({
        data: { stageId: ibpsMains.id, name: 'General / Economy / Banking Awareness', code: 'BANKING_AWARENESS', questionCount: 40, durationMinutes: 35, marksPerQuestion: 1.0, negativeMarks: 0.25, order: 2 },
    });
    await prisma.examSection.create({
        data: { stageId: ibpsMains.id, name: 'English Language', code: 'ENGLISH_MAINS', questionCount: 35, durationMinutes: 40, marksPerQuestion: 1.14, negativeMarks: 0.25, order: 3 },
    });
    await prisma.examSection.create({
        data: { stageId: ibpsMains.id, name: 'Data Analysis & Interpretation', code: 'DATA_INTERPRETATION', questionCount: 35, durationMinutes: 45, marksPerQuestion: 1.71, negativeMarks: 0.25, order: 4 },
    });
    await prisma.examSection.create({
        data: { stageId: ibpsMains.id, name: 'Descriptive English (Letter Writing & Essay)', code: 'DESCRIPTIVE_ENGLISH', questionCount: 2, durationMinutes: 30, marksPerQuestion: 12.5, negativeMarks: 0.0, order: 5 },
    });
    const ibpsEnglishSubject = await prisma.subject.create({
        data: { examId: ibpsExam.id, name: 'English Language', slug: 'ibps-english', order: 1 },
    });
    const ibpsQuantSubject = await prisma.subject.create({
        data: { examId: ibpsExam.id, name: 'Quantitative Aptitude', slug: 'ibps-quant', order: 2 },
    });
    const ibpsReasoningSubject = await prisma.subject.create({
        data: { examId: ibpsExam.id, name: 'Reasoning Ability', slug: 'ibps-reasoning', order: 3 },
    });
    const ibpsBankingSubject = await prisma.subject.create({
        data: { examId: ibpsExam.id, name: 'General & Banking Awareness', slug: 'ibps-banking', order: 4 },
    });
    const topicReadingComp = await prisma.topic.create({
        data: { subjectId: ibpsEnglishSubject.id, name: 'Reading Comprehension & Cloze Test', slug: 'reading-comp', order: 1 },
    });
    const topicDataInterp = await prisma.topic.create({
        data: { subjectId: ibpsQuantSubject.id, name: 'Data Interpretation (DI)', slug: 'data-interpretation', order: 1 },
    });
    const topicPuzzles = await prisma.topic.create({
        data: { subjectId: ibpsReasoningSubject.id, name: 'Seating Arrangement & High-Level Puzzles', slug: 'puzzles-seating', order: 1 },
    });
    const topicBanking = await prisma.topic.create({
        data: { subjectId: ibpsBankingSubject.id, name: 'RBI Guidelines & Monetary Policy', slug: 'rbi-policy', order: 1 },
    });
    console.log('🏛️ Created All 5 Official Government Exams with complete stage & section hierarchies.');
    // ==========================================
    // 8. POPULATE HIGH-QUALITY VERIFIED QUESTION BANK
    // ==========================================
    const rawQuestions = [
        // RRB NTPC - Mathematics
        {
            examId: rrbExam.id,
            subjectId: mathsSubject.id,
            topicId: topicPercentages.id,
            questionText: 'If the price of petrol increases by 25%, by what percentage must a car owner reduce consumption so that the overall expenditure remains unchanged?',
            options: JSON.stringify([
                { id: 'A', text: '20%' },
                { id: 'B', text: '25%' },
                { id: 'C', text: '16.67%' },
                { id: 'D', text: '18%' },
            ]),
            correctOption: 'A',
            explanation: 'Formula: Reduction % = [R / (100 + R)] * 100 = [25 / (100 + 25)] * 100 = (25/125)*100 = 20%.',
            difficulty: 'MEDIUM',
            subtopic: 'Percentages',
        },
        {
            examId: rrbExam.id,
            subjectId: mathsSubject.id,
            topicId: topicPercentages.id,
            questionText: 'In an examination, 35% of candidates failed in English and 40% failed in Mathematics. If 20% failed in both subjects, what percentage passed in both subjects?',
            options: JSON.stringify([
                { id: 'A', text: '40%' },
                { id: 'B', text: '45%' },
                { id: 'C', text: '50%' },
                { id: 'D', text: '55%' },
            ]),
            correctOption: 'B',
            explanation: 'Total failed = n(E) + n(M) - n(E ∩ M) = 35 + 40 - 20 = 55%. Passed in both = 100% - 55% = 45%.',
            difficulty: 'MEDIUM',
            subtopic: 'Percentages',
        },
        {
            examId: rrbExam.id,
            subjectId: mathsSubject.id,
            topicId: topicProfitLoss.id,
            questionText: 'A shopkeeper sells an article at a loss of 10%. If he had sold it for Rs. 90 more, he would have gained 8%. What is the cost price of the article?',
            options: JSON.stringify([
                { id: 'A', text: 'Rs. 450' },
                { id: 'B', text: 'Rs. 500' },
                { id: 'C', text: 'Rs. 550' },
                { id: 'D', text: 'Rs. 600' },
            ]),
            correctOption: 'B',
            explanation: 'Difference in percentages = 8% - (-10%) = 18%. 18% of CP = 90 => CP = 90 / 0.18 = Rs. 500.',
            difficulty: 'MEDIUM',
            subtopic: 'Profit & Loss',
        },
        {
            examId: rrbExam.id,
            subjectId: mathsSubject.id,
            topicId: topicTimeWork.id,
            questionText: 'A can do a work in 15 days and B in 20 days. If they work on it together for 4 days, then the fraction of the work that is left is:',
            options: [
                { id: 'A', text: '7/15' },
                { id: 'B', text: '8/15' },
                { id: 'C', text: '1/3' },
                { id: 'D', text: '2/5' },
            ],
            correctOption: 'B',
            explanation: '1 day work of A+B = (1/15 + 1/20) = 7/60. In 4 days = 4 * 7/60 = 7/15. Remaining = 1 - 7/15 = 8/15.',
            difficulty: 'MEDIUM',
            subtopic: 'Time & Work',
        },
        {
            examId: rrbExam.id,
            subjectId: mathsSubject.id,
            topicId: topicSICI.id,
            questionText: 'The simple interest on a certain sum of money for 3 years at 8% per annum is half the compound interest on Rs. 4000 for 2 years at 10% per annum. The sum placed on simple interest is:',
            options: [
                { id: 'A', text: 'Rs. 1750' },
                { id: 'B', text: 'Rs. 1800' },
                { id: 'C', text: 'Rs. 1650' },
                { id: 'D', text: 'Rs. 2000' },
            ],
            correctOption: 'A',
            explanation: 'CI on Rs. 4000 at 10% for 2 yrs = 4000*(1.21 - 1) = Rs. 840. Half = Rs. 420. SI = P * 8 * 3 / 100 = 420 => P = (420 * 100)/24 = Rs. 1750.',
            difficulty: 'HARD',
            subtopic: 'SI & CI',
        },
        // RRB NTPC - General Intelligence & Reasoning
        {
            examId: rrbExam.id,
            subjectId: reasoningSubject.id,
            topicId: topicSeries.id,
            questionText: 'Find the next number in the series: 3, 7, 15, 31, 63, ?',
            options: [
                { id: 'A', text: '127' },
                { id: 'B', text: '125' },
                { id: 'C', text: '128' },
                { id: 'D', text: '126' },
            ],
            correctOption: 'A',
            explanation: 'Pattern: (3*2)+1 = 7, (7*2)+1 = 15, (15*2)+1 = 31, (31*2)+1 = 63, (63*2)+1 = 127.',
            difficulty: 'EASY',
            subtopic: 'Number Series',
        },
        {
            examId: rrbExam.id,
            subjectId: reasoningSubject.id,
            topicId: topicSyllogism.id,
            questionText: 'Statements:\n1. All Mangoes are Golden.\n2. No Golden things are Cheap.\nConclusions:\nI. All Mangoes are Cheap.\nII. Golden mangoes are not cheap.',
            options: [
                { id: 'A', text: 'Only I follows' },
                { id: 'B', text: 'Only II follows' },
                { id: 'C', text: 'Either I or II follows' },
                { id: 'D', text: 'Neither I nor II follows' },
            ],
            correctOption: 'B',
            explanation: 'Since all mangoes are golden and no golden things are cheap, mangoes can never be cheap. Hence Conclusion II follows.',
            difficulty: 'MEDIUM',
            subtopic: 'Syllogism',
        },
        {
            examId: rrbExam.id,
            subjectId: reasoningSubject.id,
            topicId: topicCoding.id,
            questionText: 'If "DELHI" is coded as "73541" and "CALCUTTA" is coded as "82589662", how can "CALICUT" be coded?',
            options: [
                { id: 'A', text: '8251896' },
                { id: 'B', text: '8251596' },
                { id: 'C', text: '8254362' },
                { id: 'D', text: '8254196' },
            ],
            correctOption: 'A',
            explanation: 'Direct letter substitution: C=8, A=2, L=5, I=1, C=8, U=9, T=6 => 8251896.',
            difficulty: 'EASY',
            subtopic: 'Coding-Decoding',
        },
        // RRB NTPC - General Awareness
        {
            examId: rrbExam.id,
            subjectId: gaSubject.id,
            topicId: topicPolity.id,
            questionText: 'Which Article of the Indian Constitution empowers the Supreme Court to issue writs for the enforcement of Fundamental Rights?',
            options: [
                { id: 'A', text: 'Article 32' },
                { id: 'B', text: 'Article 226' },
                { id: 'C', text: 'Article 14' },
                { id: 'D', text: 'Article 19' },
            ],
            correctOption: 'A',
            explanation: 'Article 32 gives the Supreme Court power to issue writs (Habeas Corpus, Mandamus, Prohibition, Quo-Warranto, Certiorari) for Fundamental Rights enforcement. Article 226 gives similar powers to High Courts.',
            difficulty: 'EASY',
            subtopic: 'Indian Polity',
        },
        {
            examId: rrbExam.id,
            subjectId: gaSubject.id,
            topicId: topicHistory.id,
            questionText: 'Who founded the Brahmo Samaj in Calcutta in 1828 to promote monotheism and eradicate social evils?',
            options: [
                { id: 'A', text: 'Swami Dayananda Saraswati' },
                { id: 'B', text: 'Raja Ram Mohan Roy' },
                { id: 'C', text: 'Ishwar Chandra Vidyasagar' },
                { id: 'D', text: 'Swami Vivekananda' },
            ],
            correctOption: 'B',
            explanation: 'Raja Ram Mohan Roy founded Brahmo Sabha in 1828, which later became Brahmo Samaj, leading modern Indian social and religious reforms.',
            difficulty: 'EASY',
            subtopic: 'Modern History',
        },
        {
            examId: rrbExam.id,
            subjectId: gaSubject.id,
            topicId: topicScience.id,
            questionText: 'Which part of the human brain is primarily responsible for regulating posture, balance, and fine muscular coordination?',
            options: [
                { id: 'A', text: 'Cerebrum' },
                { id: 'B', text: 'Cerebellum' },
                { id: 'C', text: 'Medulla Oblongata' },
                { id: 'D', text: 'Hypothalamus' },
            ],
            correctOption: 'B',
            explanation: 'The Cerebellum coordinates voluntary muscle movements, maintaining posture, balance, and equilibrium.',
            difficulty: 'MEDIUM',
            subtopic: 'General Science',
        },
        // RRB Group D - Science & Maths
        {
            examId: rrbGroupDExam.id,
            subjectId: gdScienceSubject.id,
            topicId: topicGDPhysics.id,
            questionText: 'Which of Newton\'s laws of motion provides the mathematical definition of Force as F = ma?',
            options: [
                { id: 'A', text: 'First Law of Motion' },
                { id: 'B', text: 'Second Law of Motion' },
                { id: 'C', text: 'Third Law of Motion' },
                { id: 'D', text: 'Law of Gravitation' },
            ],
            correctOption: 'B',
            explanation: 'Newton\'s Second Law states that rate of change of momentum is directly proportional to applied force (F = dp/dt = m*a).',
            difficulty: 'EASY',
            subtopic: 'Physics - Laws of Motion',
        },
        {
            examId: rrbGroupDExam.id,
            subjectId: gdMathSubject.id,
            topicId: topicGDArith.id,
            questionText: 'What is the LCM of 24, 36, and 40?',
            options: [
                { id: 'A', text: '240' },
                { id: 'B', text: '360' },
                { id: 'C', text: '480' },
                { id: 'D', text: '720' },
            ],
            correctOption: 'B',
            explanation: '24 = 2^3 * 3, 36 = 2^2 * 3^2, 40 = 2^3 * 5. LCM = 2^3 * 3^2 * 5 = 8 * 9 * 5 = 360.',
            difficulty: 'EASY',
            subtopic: 'LCM & HCF',
        },
        // IBPS PO - English, Quant, Reasoning
        {
            examId: ibpsExam.id,
            subjectId: ibpsEnglishSubject.id,
            topicId: topicReadingComp.id,
            questionText: 'Identify the grammatically correct sentence among the following:',
            options: [
                { id: 'A', text: 'Neither the manager nor the employees was aware of the policy change.' },
                { id: 'B', text: 'Neither the manager nor the employees were aware of the policy change.' },
                { id: 'C', text: 'Neither the manager or the employees was aware of the policy change.' },
                { id: 'D', text: 'Neither the manager nor the employees is aware of the policy change.' },
            ],
            correctOption: 'B',
            explanation: 'When subjects are connected by "neither...nor", the verb agrees in number with the nearer subject ("employees" -> "were").',
            difficulty: 'MEDIUM',
            subtopic: 'Subject-Verb Agreement',
        },
        {
            examId: ibpsExam.id,
            subjectId: ibpsQuantSubject.id,
            topicId: topicDataInterp.id,
            questionText: 'In a bank deposit scheme, what is the compound interest accrued on Rs. 20,000 in 2 years at 10% per annum compounded annually?',
            options: [
                { id: 'A', text: 'Rs. 4,000' },
                { id: 'B', text: 'Rs. 4,200' },
                { id: 'C', text: 'Rs. 4,400' },
                { id: 'D', text: 'Rs. 4,500' },
            ],
            correctOption: 'B',
            explanation: 'Amount = 20000 * (1.10)^2 = 20000 * 1.21 = 24,200. CI = 24,200 - 20,000 = Rs. 4,200.',
            difficulty: 'MEDIUM',
            subtopic: 'Compound Interest',
        },
        {
            examId: ibpsExam.id,
            subjectId: ibpsReasoningSubject.id,
            topicId: topicPuzzles.id,
            questionText: 'Eight persons A, B, C, D, E, F, G, and H are sitting around a circular table facing the centre. If A sits third to the right of B and second to the left of C, how many persons sit between B and C when counted clockwise from B?',
            options: [
                { id: 'A', text: 'One' },
                { id: 'B', text: 'Two' },
                { id: 'C', text: 'Three' },
                { id: 'D', text: 'Four' },
            ],
            correctOption: 'D',
            explanation: 'Tracing the circle with 8 equidistant positions reveals exactly 4 persons between B and C in clockwise direction.',
            difficulty: 'HARD',
            subtopic: 'Circular Seating Arrangement',
        },
        // APPSC FBO & ABO Sample Questions
        {
            examId: appscExam.id,
            subjectId: appscSubA.id,
            topicId: topicAPHistory.id,
            questionText: 'Which Satavahana ruler assumed the title of "Dakshinapathapati" and performed the Ashvamedha sacrifice twice?',
            options: [
                { id: 'A', text: 'Simuka' },
                { id: 'B', text: 'Satakarni I' },
                { id: 'C', text: 'Gautamiputra Satakarni' },
                { id: 'D', text: 'Yajna Sri Satakarni' },
            ],
            correctOption: 'B',
            explanation: 'Satakarni I, mentioned in the Naneghat inscription of Queen Nayanika, assumed the titles of "Lord of Dakshinapatha" (Dakshinapathapati) and performed Ashvamedha and Rajasuya sacrifices.',
            difficulty: 'MEDIUM',
            subtopic: 'Andhra History',
        },
        {
            examId: appscExam.id,
            subjectId: appscSubB.id,
            topicId: topicAPScience.id,
            questionText: 'The endemic tree species "Pterocarpus santalinus" (Red Sanders) is primarily found in which mountain range of Andhra Pradesh?',
            options: [
                { id: 'A', text: 'Seshachalam Hills' },
                { id: 'B', text: 'Nallamala Hills' },
                { id: 'C', text: 'Horsley Hills' },
                { id: 'D', text: 'Nagari Hills' },
            ],
            correctOption: 'A',
            explanation: 'Pterocarpus santalinus (Red Sanders) is an endemic tree species found predominantly in the Seshachalam Hill ranges in the Eastern Ghats of Andhra Pradesh.',
            difficulty: 'EASY',
            subtopic: 'Forestry & Flora of AP',
        },
    ];
    for (const q of rawQuestions) {
        const opts = typeof q.options === 'string' ? q.options : JSON.stringify(q.options);
        const parsedOpts = typeof q.options === 'string' ? JSON.parse(q.options) : q.options;
        const qHash = generateQuestionHash(q.questionText, parsedOpts);
        await prisma.question.create({
            data: {
                examId: q.examId,
                subjectId: q.subjectId,
                topicId: q.topicId,
                questionText: q.questionText,
                options: opts,
                correctOption: q.correctOption,
                explanation: q.explanation,
                difficulty: q.difficulty,
                subtopic: q.subtopic,
                status: 'PUBLISHED',
                source: 'VERIFIED',
                questionHash: qHash,
            },
        });
    }
    console.log(`📝 Seeded verified foundational questions in database.`);
    // ==========================================
    // 9. CREATE OFFICIAL CBT MOCKS & TOPIC-BASED TESTS
    // ==========================================
    const syncResult = await TestSyncService.syncAllTests();
    console.log(`📋 Created & Verified ${syncResult.officialMocks.total} Official Exam Stage Mocks & ${syncResult.topicTests.total} Topic Practice Tests.`);
    console.log('✅ Full Seeding completed successfully for All 5 Supported Government Exams!');
}
main()
    .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
