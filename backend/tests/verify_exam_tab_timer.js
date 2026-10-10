import { prisma } from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../src/utils/jwt.js';
const BASE_URL = 'http://localhost:5000/api';
async function runTests() {
    console.log('======================================================');
    console.log('🔍 GovPrep Exam Fullscreen, Timer & Tab-Switch Test Suite');
    console.log('======================================================\n');
    let passed = 0;
    let failed = 0;
    async function test(name, fn) {
        process.stdout.write(`🧪 Testing: ${name}... `);
        try {
            await fn();
            console.log('✅ PASS');
            passed++;
        }
        catch (err) {
            console.log(`❌ FAIL: ${err.message}`);
            failed++;
        }
    }
    // Setup: create a test user
    const email = `student_exam_${Date.now()}@govprep.test`;
    const password = 'TestPassword123!';
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name: 'Exam Tester',
            role: 'USER',
        },
    });
    const token = generateToken({ userId: user.id, email: user.email, role: user.role });
    const authHeaders = {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
    };
    // Find an active mock test
    const testRecord = await prisma.test.findFirst({
        where: { status: 'ACTIVE' },
        include: { exam: true, stage: true },
    });
    if (!testRecord) {
        throw new Error('No active test found in database for testing.');
    }
    let attemptId = '';
    let expiresAtStr = '';
    await test('Start exam returns configured duration, expiresAt, and initial tabSwitchCount = 0', async () => {
        const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ forceNew: true }),
        });
        const data = await res.json();
        if (!data.success || !data.attemptId) {
            throw new Error(`Failed to start test: ${JSON.stringify(data)}`);
        }
        if (data.tabSwitchCount !== 0) {
            throw new Error(`Expected initial tabSwitchCount 0, got ${data.tabSwitchCount}`);
        }
        if (!data.expiresAt || !data.durationSeconds) {
            throw new Error('Missing expiresAt or durationSeconds in start response');
        }
        attemptId = data.attemptId;
        expiresAtStr = data.expiresAt;
    });
    await test('Autosave answers during active attempt', async () => {
        const questionsRes = await prisma.answer.findMany({
            where: { attemptId },
        });
        if (questionsRes.length === 0) {
            throw new Error('No questions created for attempt');
        }
        const firstQ = questionsRes[0];
        const saveRes = await fetch(`${BASE_URL}/tests/attempts/${attemptId}/answer`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                questionId: firstQ.questionId,
                selectedOption: 'A',
                status: 'ANSWERED',
                timeSpentSeconds: 15,
            }),
        });
        const saveData = await saveRes.json();
        if (!saveData.success) {
            throw new Error(`Autosave failed: ${JSON.stringify(saveData)}`);
        }
        const checkAns = await prisma.answer.findUnique({
            where: { attemptId_questionId: { attemptId, questionId: firstQ.questionId } },
        });
        if (checkAns?.selectedOption !== 'A') {
            throw new Error(`Answer not updated in DB. Got ${checkAns?.selectedOption}`);
        }
    });
    await test('First tab switch increments count to 1 and does NOT submit exam', async () => {
        const res = await fetch(`${BASE_URL}/tests/attempts/${attemptId}/tab-switch`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ event: 'TAB_SWITCH' }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(`Failed to record first tab switch: ${JSON.stringify(data)}`);
        }
        if (data.tabSwitchCount !== 1) {
            throw new Error(`Expected tabSwitchCount = 1, got ${data.tabSwitchCount}`);
        }
        if (data.shouldSubmit === true) {
            throw new Error('First tab switch should NOT trigger auto-submit');
        }
        // Verify DB
        const dbAttempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
        if (dbAttempt.tabSwitchCount !== 1 || dbAttempt?.isCompleted) {
            throw new Error('Database attempt state mismatch on first tab switch');
        }
    });
    await test('Refreshing active attempt preserves timer, answers, and tabSwitchCount = 1', async () => {
        const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ forceNew: false }),
        });
        const data = await res.json();
        if (!data.success || !data.isResumed) {
            throw new Error('Expected resumed test attempt on refresh');
        }
        if (data.attemptId !== attemptId) {
            throw new Error(`Attempt ID changed after refresh: ${data.attemptId} vs ${attemptId}`);
        }
        if (data.tabSwitchCount !== 1) {
            throw new Error(`Expected preserved tabSwitchCount = 1, got ${data.tabSwitchCount}`);
        }
        if (data.expiresAt !== expiresAtStr) {
            throw new Error('Timer expiresAt was reset on refresh');
        }
    });
    await test('Second tab switch increments count to 2 and signals shouldSubmit = true', async () => {
        const res = await fetch(`${BASE_URL}/tests/attempts/${attemptId}/tab-switch`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ event: 'TAB_SWITCH' }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(`Failed to record second tab switch: ${JSON.stringify(data)}`);
        }
        if (data.tabSwitchCount !== 2) {
            throw new Error(`Expected tabSwitchCount = 2, got ${data.tabSwitchCount}`);
        }
        if (data.shouldSubmit !== true) {
            throw new Error('Second tab switch MUST signal shouldSubmit = true');
        }
    });
    await test('Submitting attempt with autoSubmitReason: TAB_SWITCH saves and calculates result', async () => {
        const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/submit`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                attemptId,
                autoSubmitReason: 'TAB_SWITCH',
                timeSpentSeconds: 45,
            }),
        });
        const data = await res.json();
        if (!data.success || !data.attemptId) {
            throw new Error(`Submission failed: ${JSON.stringify(data)}`);
        }
        const dbAttempt = await prisma.testAttempt.findUnique({ where: { id: attemptId } });
        if (!dbAttempt?.isCompleted || dbAttempt.status !== 'COMPLETED') {
            throw new Error(`Attempt not marked completed. Status: ${dbAttempt?.status}`);
        }
        if (dbAttempt.autoSubmitReason !== 'TAB_SWITCH') {
            throw new Error(`autoSubmitReason was not stored. Got: ${dbAttempt.autoSubmitReason}`);
        }
    });
    await test('Idempotent submission: submitting already submitted attempt returns existing result without error', async () => {
        const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/submit`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                attemptId,
                autoSubmitReason: 'TAB_SWITCH',
                timeSpentSeconds: 50,
            }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(`Duplicate submit rejected with error: ${JSON.stringify(data)}`);
        }
        if (data.attemptId !== attemptId) {
            throw new Error('Duplicate submit returned different attemptId');
        }
    });
    await test('Submitting with autoSubmitReason: TIME_EXPIRED marks status TIMED_OUT', async () => {
        // Start a fresh test attempt
        const startRes = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ forceNew: true }),
        });
        const startData = await startRes.json();
        const timeAttemptId = startData.attemptId;
        const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/submit`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                attemptId: timeAttemptId,
                autoSubmitReason: 'TIME_EXPIRED',
                timeSpentSeconds: 120,
            }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(`Submission failed: ${JSON.stringify(data)}`);
        }
        const dbAttempt = await prisma.testAttempt.findUnique({ where: { id: timeAttemptId } });
        if (!dbAttempt?.isCompleted || dbAttempt.status !== 'TIMED_OUT') {
            throw new Error(`Expected status TIMED_OUT, got: ${dbAttempt?.status}`);
        }
        if (dbAttempt.autoSubmitReason !== 'TIME_EXPIRED') {
            throw new Error(`Expected autoSubmitReason TIME_EXPIRED, got: ${dbAttempt.autoSubmitReason}`);
        }
    });
    await test('Manual submission records autoSubmitReason: MANUAL', async () => {
        // Start a fresh test attempt
        const startRes = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ forceNew: true }),
        });
        const startData = await startRes.json();
        const manualAttemptId = startData.attemptId;
        const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/submit`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                attemptId: manualAttemptId,
                autoSubmitReason: 'MANUAL',
                timeSpentSeconds: 180,
            }),
        });
        const data = await res.json();
        if (!data.success) {
            throw new Error(`Submission failed: ${JSON.stringify(data)}`);
        }
        const dbAttempt = await prisma.testAttempt.findUnique({ where: { id: manualAttemptId } });
        if (!dbAttempt?.isCompleted || dbAttempt.status !== 'COMPLETED') {
            throw new Error(`Expected status COMPLETED, got: ${dbAttempt?.status}`);
        }
        if (dbAttempt.autoSubmitReason !== 'MANUAL') {
            throw new Error(`Expected autoSubmitReason MANUAL, got: ${dbAttempt.autoSubmitReason}`);
        }
    });
    console.log('\n======================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
    if (failed > 0) {
        process.exit(1);
    }
}
runTests()
    .catch((err) => {
    console.error('Test runner fatal error:', err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
