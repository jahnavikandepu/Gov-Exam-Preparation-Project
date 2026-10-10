const API_BASE = 'http://localhost:5000/api';
async function postJson(url, body, token) {
    const headers = { 'Content-Type': 'application/json' };
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });
    const data = await res.json();
    return { status: res.status, data };
}
async function getJson(url, token) {
    const headers = {};
    if (token)
        headers['Authorization'] = `Bearer ${token}`;
    const res = await fetch(url, {
        method: 'GET',
        headers,
    });
    const data = await res.json();
    return { status: res.status, data };
}
async function run() {
    console.log('\n======================================================');
    console.log('🔍 GovPrep User-Specific History & Isolation Test Suite');
    console.log('======================================================\n');
    let passed = 0;
    let failed = 0;
    async function test(name, fn) {
        try {
            process.stdout.write(`🧪 Testing: ${name}... `);
            await fn();
            console.log('✅ PASS');
            passed++;
        }
        catch (err) {
            console.log('❌ FAIL');
            console.error('   Error details:', err.message || err);
            failed++;
        }
    }
    const timestamp = Date.now();
    const userAEmail = `user_a_${timestamp}@test.com`;
    const userBEmail = `user_b_${timestamp}@test.com`;
    let userAToken = '';
    let userBToken = '';
    let userAId = '';
    let userBId = '';
    // 1. Register User A
    await test('Register User A and verify new user creation', async () => {
        const res = await postJson(`${API_BASE}/auth/register`, {
            name: 'User Alpha',
            email: userAEmail,
            password: 'password123',
            targetExam: 'RRB NTPC',
        });
        if (!res.data.success || !res.data.token || !res.data.user?.id) {
            throw new Error(`Registration of User A failed: ${JSON.stringify(res.data)}`);
        }
        userAToken = res.data.token;
        userAId = res.data.user.id;
    });
    // 2. Verify User A has 0 history and 0 dashboard stats
    await test('User A history is completely empty on registration', async () => {
        const historyRes = await getJson(`${API_BASE}/history`, userAToken);
        if (!historyRes.data.success || !Array.isArray(historyRes.data.history)) {
            throw new Error('History response format invalid');
        }
        if (historyRes.data.history.length !== 0) {
            throw new Error(`Expected 0 history items for new user, got ${historyRes.data.history.length}`);
        }
        const perfHistoryRes = await getJson(`${API_BASE}/performance/history`, userAToken);
        if (perfHistoryRes.data.history.length !== 0) {
            throw new Error(`Expected 0 items from /performance/history, got ${perfHistoryRes.data.history.length}`);
        }
    });
    await test('User A dashboard statistics are 0/empty initially', async () => {
        const dashRes = await getJson(`${API_BASE}/dashboard`, userAToken);
        const d = dashRes.data.dashboard;
        if (d.totalTests !== 0 || d.totalQuestions !== 0 || d.overallAccuracy !== 0 || d.averageScore !== 0) {
            throw new Error(`Expected 0 dashboard stats, got totalTests=${d.totalTests}, avgScore=${d.averageScore}`);
        }
        if (d.recentAttempts.length !== 0) {
            throw new Error(`Expected 0 recent attempts, got ${d.recentAttempts.length}`);
        }
    });
    // 3. Register User B
    await test('Register User B', async () => {
        const res = await postJson(`${API_BASE}/auth/register`, {
            name: 'User Beta',
            email: userBEmail,
            password: 'password123',
            targetExam: 'IBPS PO',
        });
        if (!res.data.success || !res.data.token || !res.data.user?.id) {
            throw new Error(`Registration of User B failed: ${JSON.stringify(res.data)}`);
        }
        userBToken = res.data.token;
        userBId = res.data.user.id;
    });
    // 4. Verify User B has empty history
    await test('User B has empty history and cannot see any other data', async () => {
        const historyRes = await getJson(`${API_BASE}/history`, userBToken);
        if (historyRes.data.history.length !== 0) {
            throw new Error(`Expected 0 history items for User B, got ${historyRes.data.history.length}`);
        }
    });
    // 5. User A completes a mock test
    let userAAttemptId = '';
    await test('User A starts and submits a mock test', async () => {
        const testsRes = await getJson(`${API_BASE}/tests`);
        const tests = testsRes.data.tests;
        if (!tests || tests.length === 0)
            throw new Error('No tests available in database');
        const testItem = tests[0];
        const startRes = await postJson(`${API_BASE}/tests/${testItem.id}/start`, { devTestMode: true }, userAToken);
        if (!startRes.data.success || !startRes.data.attemptId) {
            throw new Error(`Failed to start test for User A: ${JSON.stringify(startRes.data)}`);
        }
        userAAttemptId = startRes.data.attemptId;
        const answersMap = {};
        for (const q of startRes.data.questions) {
            answersMap[q.id] = {
                selectedOption: 'A',
                status: 'answered',
                timeSpentSeconds: 30,
            };
        }
        const submitRes = await postJson(`${API_BASE}/tests/${testItem.id}/submit`, {
            attemptId: userAAttemptId,
            answers: answersMap,
            timeSpentSeconds: 120,
        }, userAToken);
        if (!submitRes.data.success) {
            throw new Error(`Failed to submit test for User A: ${JSON.stringify(submitRes.data)}`);
        }
    });
    // 6. Verify User A now has exactly 1 attempt in History
    await test('User A history now contains exactly 1 completed attempt', async () => {
        const historyRes = await getJson(`${API_BASE}/history`, userAToken);
        const history = historyRes.data.history;
        if (history.length !== 1) {
            throw new Error(`Expected 1 history item for User A, got ${history.length}`);
        }
        if (history[0].id !== userAAttemptId && history[0].attemptId !== userAAttemptId) {
            throw new Error(`Attempt ID mismatch: expected ${userAAttemptId}, got ${history[0].id}`);
        }
        if (typeof history[0].score !== 'number' || typeof history[0].accuracy !== 'number') {
            throw new Error('History item missing numeric score or accuracy');
        }
    });
    // 7. Verify User A dashboard updated with real database statistics
    await test('User A dashboard updated with actual test metrics', async () => {
        const dashRes = await getJson(`${API_BASE}/dashboard`, userAToken);
        const d = dashRes.data.dashboard;
        if (d.totalTests !== 1) {
            throw new Error(`Expected totalTests=1 for User A, got ${d.totalTests}`);
        }
        if (d.totalQuestions <= 0) {
            throw new Error(`Expected totalQuestions > 0, got ${d.totalQuestions}`);
        }
        if (d.recentAttempts.length !== 1) {
            throw new Error(`Expected 1 recent attempt for User A, got ${d.recentAttempts.length}`);
        }
    });
    // 8. User B MUST NOT see User A's attempt
    await test('User B MUST NOT see User A attempt (Strict User Isolation)', async () => {
        const historyRes = await getJson(`${API_BASE}/history`, userBToken);
        if (historyRes.data.history.length !== 0) {
            throw new Error(`Isolation breach! User B sees ${historyRes.data.history.length} attempts from User A`);
        }
        const dashRes = await getJson(`${API_BASE}/dashboard`, userBToken);
        if (dashRes.data.dashboard.totalTests !== 0) {
            throw new Error(`Isolation breach! User B sees totalTests=${dashRes.data.dashboard.totalTests}`);
        }
    });
    // 9. User B starts and completes a test
    let userBAttemptId = '';
    await test('User B starts and submits their own mock test', async () => {
        const testsRes = await getJson(`${API_BASE}/tests`);
        const testItem = testsRes.data.tests[testsRes.data.tests.length - 1];
        const startRes = await postJson(`${API_BASE}/tests/${testItem.id}/start`, { devTestMode: true }, userBToken);
        userBAttemptId = startRes.data.attemptId;
        const answersMap = {};
        for (const q of startRes.data.questions) {
            answersMap[q.id] = {
                selectedOption: 'B',
                status: 'answered',
                timeSpentSeconds: 40,
            };
        }
        const submitRes = await postJson(`${API_BASE}/tests/${testItem.id}/submit`, {
            attemptId: userBAttemptId,
            answers: answersMap,
            timeSpentSeconds: 150,
        }, userBToken);
        if (!submitRes.data.success) {
            throw new Error(`Failed to submit test for User B: ${JSON.stringify(submitRes.data)}`);
        }
    });
    // 10. User B now sees 1 attempt, User A still sees 1 attempt
    await test('Each user only sees their own respective completed attempt', async () => {
        const historyARes = await getJson(`${API_BASE}/history`, userAToken);
        const historyBRes = await getJson(`${API_BASE}/history`, userBToken);
        if (historyARes.data.history.length !== 1 || historyARes.data.history[0].id !== userAAttemptId) {
            throw new Error('User A history corrupted or seeing wrong attempts');
        }
        if (historyBRes.data.history.length !== 1 || historyBRes.data.history[0].id !== userBAttemptId) {
            throw new Error('User B history corrupted or seeing wrong attempts');
        }
    });
    // 11. Relogin persistence test
    await test('History persists across re-login from PostgreSQL', async () => {
        const loginARes = await postJson(`${API_BASE}/auth/login`, {
            email: userAEmail,
            password: 'password123',
        });
        const freshTokenA = loginARes.data.token;
        const historyARes = await getJson(`${API_BASE}/history`, freshTokenA);
        if (historyARes.data.history.length !== 1 || historyARes.data.history[0].id !== userAAttemptId) {
            throw new Error('User A history failed to reload correctly on re-login');
        }
    });
    // 12. In-progress attempt isolation: In-progress test must NOT appear in completed history
    await test('In-progress (unsubmitted) tests do NOT appear in History', async () => {
        const testsRes = await getJson(`${API_BASE}/tests`);
        const testItem = testsRes.data.tests[0];
        // User A starts a new test but does NOT submit
        await postJson(`${API_BASE}/tests/${testItem.id}/start`, { forceNew: true, devTestMode: true }, userAToken);
        const historyRes = await getJson(`${API_BASE}/history`, userAToken);
        // Should still only show the 1 completed attempt, not the unsubmitted one
        if (historyRes.data.history.length !== 1) {
            throw new Error(`In-progress attempt mistakenly appeared in history! Count: ${historyRes.data.history.length}`);
        }
    });
    console.log('\n======================================================');
    console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
    console.log('======================================================\n');
    if (failed > 0) {
        process.exit(1);
    }
}
run().catch((err) => {
    console.error('Test execution error:', err);
    process.exit(1);
});
