import { prisma } from '../src/config/db.js';
import { GeminiQuestionService } from '../src/services/ai/geminiQuestionService.js';
import { QuestionSelectionService } from '../src/services/question/questionSelectionService.js';
import { generateQuestionHash, computeQuestionSimilarity, normalizeQuestionText } from '../src/utils/questionHash.js';
import { GEMINI_CONFIG } from '../src/config/geminiConfig.js';

export async function runGeminiQuestionGenerationTests() {
    console.log('\n====================================================');
    console.log('🤖 STARTING GEMINI AI QUESTION & EXAM SYSTEM VERIFICATION');
    console.log('====================================================\n');

    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log(`  ✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`  ❌ FAIL: ${message}`);
            failed++;
        }
    };

    try {
        // 1. Check Gemini Configuration & Model Availability
        console.log('🧪 Test 1: Gemini Model Configuration & Availability Check...');
        const modelStatus = await GeminiQuestionService.checkModelAvailability();
        assert(typeof modelStatus === 'object', 'Model status returns a valid object');
        assert(typeof modelStatus.configured === 'boolean', 'Configured flag is boolean');
        assert(Boolean(modelStatus.model), `Target model is specified: '${modelStatus.model}'`);

        // 2. Question Schema Validation
        console.log('\n🧪 Test 2: Strict Question Schema & Field Validation...');
        const validQ = {
            questionText: 'What is the sum of interior angles of a regular hexagon?',
            options: [
                { id: 'A', text: '540 degrees' },
                { id: 'B', text: '720 degrees' },
                { id: 'C', text: '360 degrees' },
                { id: 'D', text: '900 degrees' },
            ],
            correctOption: 'B',
            explanation: 'The formula is (n - 2) * 180. For a hexagon (n=6), (6-2)*180 = 720 degrees.',
            difficulty: 'MEDIUM',
        };
        const validResult = GeminiQuestionService.validateQuestion(validQ);
        assert(validResult.isValid === true, 'Valid question structure passes schema validation');

        const invalidQ = {
            questionText: 'Short',
            options: [{ id: 'A', text: '1' }],
            correctOption: 'X',
            explanation: '',
            difficulty: 'INVALID_DIFF',
        };
        const invalidResult = GeminiQuestionService.validateQuestion(invalidQ);
        assert(invalidResult.isValid === false, 'Malformed question rejected by validator');
        assert(invalidResult.errors.length >= 4, `Rejected with multiple descriptive errors (${invalidResult.errors.length})`);

        // 3. SHA-256 Fingerprint Hash & Deduplication
        console.log('\n🧪 Test 3: SHA-256 Fingerprint Hash & Deduplication...');
        const hash1 = generateQuestionHash(validQ.questionText, validQ.options);
        const hash2 = generateQuestionHash(validQ.questionText.toUpperCase() + '  ', validQ.options);
        assert(typeof hash1 === 'string' && hash1.length === 64, 'Generated valid 64-char SHA-256 hex hash');
        assert(hash1 === hash2, 'Normalized text generates identical fingerprint hash regardless of casing/spacing');

        // 4. Persistence of AI Generated Questions in PostgreSQL
        console.log('\n🧪 Test 4: Database Persistence & Deduplication in PostgreSQL...');
        const testExam = await prisma.exam.findFirst({
            include: { subjects: { include: { topics: true } } },
        });
        assert(Boolean(testExam), `Found exam in database: ${testExam?.name}`);

        const testSubject = testExam.subjects[0];
        const testTopic = testSubject.topics[0];

        const testGenText = `Test Verification AI Question on ${testTopic.name} ${Date.now()}`;
        const testGenOptions = [
            { id: 'A', text: 'Alpha Choice' },
            { id: 'B', text: 'Beta Choice' },
            { id: 'C', text: 'Gamma Choice' },
            { id: 'D', text: 'Delta Choice' },
        ];
        const testGenHash = generateQuestionHash(testGenText, testGenOptions);

        const createdQ = await prisma.question.create({
            data: {
                examId: testExam.id,
                subjectId: testSubject.id,
                topicId: testTopic.id,
                questionText: testGenText,
                options: JSON.stringify(testGenOptions),
                correctOption: 'A',
                explanation: 'Detailed verification explanation for this test question.',
                difficulty: 'MEDIUM',
                subtopic: testTopic.name,
                status: 'PUBLISHED',
                source: 'AI_GENERATED',
                generationModel: 'gemini-test-suite',
                generationPromptVersion: 'govprep-gemini-v2.5',
                questionHash: testGenHash,
            },
        });
        assert(Boolean(createdQ.id), `Persisted question ID: ${createdQ.id}`);

        const fetchedQ = await prisma.question.findUnique({
            where: { id: createdQ.id },
            include: { exam: true, subject: true, topic: true },
        });
        assert(fetchedQ.questionHash === testGenHash, 'Persisted question retains identical SHA-256 hash');
        assert(fetchedQ.source === 'AI_GENERATED', 'Question correctly tagged as AI_GENERATED');

        // Clean up test question
        await prisma.question.delete({ where: { id: createdQ.id } });

        // 5. Question Count & Secret Hiding on Student Test Start
        console.log('\n🧪 Test 5: Question Count & Secret Protection for Students...');
        const studentUser = await prisma.user.findFirst({ where: { role: 'USER' } });
        assert(Boolean(studentUser), `Found student user: ${studentUser?.name}`);

        const topicTest = await prisma.test.findFirst({
            where: { type: 'TOPIC_TEST', status: 'ACTIVE' },
            include: { topic: { include: { subject: true } } },
        });
        assert(Boolean(topicTest), `Found topic test: ${topicTest?.title}`);

        const questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
            userId: studentUser.id,
            testId: topicTest.id,
            topicId: topicTest.topicId,
            difficulty: 'MEDIUM',
            questionCount: 50,
        });

        assert(questions.length === 50, `Exactly 50 questions prepared for topic test (found: ${questions.length})`);
        
        let answersExposed = false;
        for (const q of questions) {
            if (q.correctOption || q.explanation) {
                answersExposed = true;
                break;
            }
        }
        assert(!answersExposed, 'Correct answers and explanations are STRICTLY HIDDEN from student question payload');

        // 6. Retake Uniqueness (Attempt 1 ∩ Attempt 2 = ∅)
        console.log('\n🧪 Test 6: Retake Uniqueness Isolation...');
        // Simulate Attempt 1 by recording QuestionHistory
        const attempt1QuestionIds = questions.slice(0, 20).map((q) => q.id);
        const historyRecords = attempt1QuestionIds.map((qId) => ({
            userId: studentUser.id,
            questionId: qId,
            topicId: topicTest.topicId,
            isCorrect: true,
            timeSpentSeconds: 45,
            shownAt: new Date(),
        }));

        await prisma.questionHistory.createMany({
            data: historyRecords,
        });

        // Request questions for Attempt 2
        const attempt2Questions = await QuestionSelectionService.getUniqueQuestionsForAttempt({
            userId: studentUser.id,
            testId: topicTest.id,
            topicId: topicTest.topicId,
            difficulty: 'MEDIUM',
            questionCount: 50,
        });

        const attempt1Set = new Set(attempt1QuestionIds);
        const overlap = attempt2Questions.filter((q) => attempt1Set.has(q.id));

        assert(overlap.length === 0, `Attempt 2 questions are 100% unique from Attempt 1 (overlap count: ${overlap.length})`);

        // Clean up question histories for test isolation
        await prisma.questionHistory.deleteMany({
            where: {
                userId: studentUser.id,
                topicId: topicTest.topicId,
            },
        });

        // 7. Admin Total Questions Metric Consistency
        console.log('\n🧪 Test 7: Admin Total Questions Metric Consistency...');
        const dbTotal = await prisma.question.count();
        assert(typeof dbTotal === 'number' && dbTotal >= 0, `Live database question count: ${dbTotal}`);

    } catch (err) {
        console.error('Unhandled test exception:', err);
        failed++;
    }

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    return { passed, failed };
}

if (process.argv[1]?.endsWith('verify_gemini_question_generation.js')) {
    runGeminiQuestionGenerationTests().then(({ failed }) => {
        process.exit(failed > 0 ? 1 : 0);
    });
}
