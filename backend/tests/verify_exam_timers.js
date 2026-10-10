import { prisma } from '../src/config/db.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../src/utils/jwt.js';

const BASE_URL = 'http://localhost:5000/api';

async function runExamTimerVerification() {
  console.log('================================================================');
  console.log('⏱️  GovPrep Exam Timers & Anti-Tamper Hard-Deadline Verification');
  console.log('================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    process.stdout.write(`🧪 [TEST ${passed + failed + 1}] ${name}... `);
    try {
      await fn();
      console.log('✅ PASS');
      passed++;
    } catch (err) {
      console.log(`❌ FAIL: ${err.message}`);
      failed++;
    }
  }

  // Setup test user
  const email = `timer_audit_${Date.now()}@govprep.test`;
  const password = 'TestTimerPassword123!';
  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name: 'Timer Audit Tester',
      role: 'USER',
    },
  });

  const token = generateToken({ userId: user.id, email: user.email, role: user.role });
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Find exams to test
  const exams = await prisma.exam.findMany({
    include: {
      stages: { include: { sections: true } },
      tests: true,
    },
  });

  const ibpsPoExam = exams.find((e) => e.slug === 'ibps-po');
  const rrbNtpcExam = exams.find((e) => e.slug === 'rrb-ntpc');
  const rrbJeExam = exams.find((e) => e.slug === 'rrb-je');
  const appscExam = exams.find((e) => e.slug === 'appsc-fbo-abo');

  // 1. A 60-minute exam ends after its configured 60 minutes
  await test('1. A 60-minute exam (IBPS PO Prelims) starts with exact 60-minute server deadline (3600s)', async () => {
    const prelimsStage = ibpsPoExam?.stages.find((s) => s.code === 'PRELIMS');
    const prelimsTest = ibpsPoExam?.tests.find((t) => t.stageId === prelimsStage?.id && t.type === 'FULL_MOCK') ||
      ibpsPoExam?.tests.find((t) => t.stageId === prelimsStage?.id);
    if (!prelimsTest) throw new Error('IBPS PO Prelims test not found');

    const res = await fetch(`${BASE_URL}/tests/${prelimsTest.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(`Failed to start test: ${JSON.stringify(data)}`);

    if (data.durationSeconds !== 3600) {
      throw new Error(`Expected 3600 seconds (60 mins), got ${data.durationSeconds}`);
    }

    const startMs = new Date(data.startedAt).getTime();
    const expiryMs = new Date(data.expiresAt).getTime();
    const diffSeconds = Math.round((expiryMs - startMs) / 1000);
    if (diffSeconds !== 3600) {
      throw new Error(`Server deadline diff is ${diffSeconds}s, expected exactly 3600s`);
    }
  });

  // 2. A 90-minute exam ends after its configured 90 minutes
  await test('2. A 90-minute exam (RRB NTPC CBT 1 Official Mock) starts with exact 90-minute server deadline (5400s)', async () => {
    const cbt1Stage = rrbNtpcExam?.stages.find((s) => s.code === 'CBT_1');
    const cbt1Test = rrbNtpcExam?.tests.find((t) => t.stageId === cbt1Stage?.id && t.durationMinutes === 90) ||
      rrbNtpcExam?.tests.find((t) => t.title.includes('RRB NTPC CBT-1 Official Mock'));
    if (!cbt1Test) throw new Error('RRB NTPC CBT 1 Official Mock test not found');

    const res = await fetch(`${BASE_URL}/tests/${cbt1Test.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(`Failed to start test: ${JSON.stringify(data)}`);

    if (data.durationSeconds !== 5400) {
      throw new Error(`Expected 5400 seconds (90 mins), got ${data.durationSeconds}`);
    }

    const startMs = new Date(data.startedAt).getTime();
    const expiryMs = new Date(data.expiresAt).getTime();
    const diffSeconds = Math.round((expiryMs - startMs) / 1000);
    if (diffSeconds !== 5400) {
      throw new Error(`Server deadline diff is ${diffSeconds}s, expected exactly 5400s`);
    }
  });

  // 3. IBPS PO Mains section ends at its configured section deadline
  await test('3. IBPS PO Mains starts with exact sectional timer for Section 1 (60 mins = 3600s) and overall 210 mins (12600s)', async () => {
    const mainsStage = ibpsPoExam?.stages.find((s) => s.code === 'MAINS');
    const mainsTest = ibpsPoExam?.tests.find((t) => t.stageId === mainsStage?.id);
    if (!mainsTest) throw new Error('IBPS PO Mains test not found');

    const res = await fetch(`${BASE_URL}/tests/${mainsTest.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const data = await res.json();
    if (!data.success) throw new Error(`Failed to start Mains: ${JSON.stringify(data)}`);

    if (data.durationSeconds !== 12600) {
      throw new Error(`Expected 12600 seconds (210 mins), got ${data.durationSeconds}`);
    }

    if (!data.sectionExpiresAt) {
      throw new Error('Missing sectionExpiresAt for section-timed exam');
    }

    const startMs = new Date(data.startedAt).getTime();
    const sectionExpiryMs = new Date(data.sectionExpiresAt).getTime();
    const secDiffSeconds = Math.round((sectionExpiryMs - startMs) / 1000);
    // Reasoning & Computer Aptitude is 60 minutes = 3600 seconds
    if (secDiffSeconds !== 3600) {
      throw new Error(`Expected first section duration 3600s, got ${secDiffSeconds}s`);
    }
  });

  // 4. Refreshing does not reset the timer
  let refreshAttemptId = '';
  let originalExpiresAt = '';
  await test('4. Refreshing the browser does NOT reset the timer or create fresh deadline', async () => {
    const cbt1Test = rrbNtpcExam?.tests.find((t) => t.title.includes('RRB NTPC CBT-1 Official Mock')) || rrbNtpcExam?.tests[0];

    // Start attempt
    const res1 = await fetch(`${BASE_URL}/tests/${cbt1Test.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const data1 = await res1.json();
    refreshAttemptId = data1.attemptId;
    originalExpiresAt = data1.expiresAt;

    // Simulate waiting 2 seconds
    await new Promise((r) => setTimeout(r, 2000));

    // Simulate page refresh (calling /start again without forceNew)
    const resRefresh = await fetch(`${BASE_URL}/tests/${cbt1Test.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: false }),
    });
    const dataRefresh = await resRefresh.json();

    if (dataRefresh.attemptId !== refreshAttemptId) {
      throw new Error('Refresh created a different attempt ID instead of resuming');
    }
    if (dataRefresh.expiresAt !== originalExpiresAt) {
      throw new Error('Refresh modified or reset the expiresAt deadline!');
    }
    if (!dataRefresh.isResumed) {
      throw new Error('Refresh did not flag attempt as resumed');
    }
  });

  // 5. Reopening an attempt does not reset the timer
  await test('5. Reopening an attempt via getAttemptState keeps exact same deadline and reduces remainingSeconds', async () => {
    const resState = await fetch(`${BASE_URL}/tests/attempts/${refreshAttemptId}`, {
      headers: authHeaders,
    });
    const dataState = await resState.json();
    if (!dataState.success) throw new Error('Failed to fetch attempt state');

    if (dataState.expiresAt !== originalExpiresAt) {
      throw new Error('Reopening attempt modified expiresAt!');
    }
    // Remaining seconds should be strictly less than 5400
    if (dataState.remainingSeconds >= 5400) {
      throw new Error(`Expected remainingSeconds < 5400, got ${dataState.remainingSeconds}`);
    }
  });

  // 6. Browser clock changes do not extend the deadline
  await test('6. Browser clock changes cannot extend deadline (Server is authoritative; past-deadline reject)', async () => {
    // Attempt with mock 3-second deadline
    const testRecord = rrbNtpcExam?.tests[0];
    const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true, debugDurationSeconds: 3 }),
    });
    const data = await res.json();
    const shortAttemptId = data.attemptId;
    const questions = data.questions;

    // Wait 3.5 seconds for server deadline to expire
    await new Promise((r) => setTimeout(r, 3500));

    // Client pretends its local clock is set backwards to yesterday!
    // Client sends an autosaveAnswer request to /attempts/:id/answer
    const saveRes = await fetch(`${BASE_URL}/tests/attempts/${shortAttemptId}/answer`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        questionId: questions[0]?.id || 'q1',
        selectedOption: 'B',
        clientTimestamp: new Date(Date.now() - 86400000).toISOString(), // 24 hours in past
      }),
    });

    const saveData = await saveRes.json();
    if (saveRes.status !== 403) {
      throw new Error(`Expected HTTP 403 Forbidden on expired attempt, got ${saveRes.status}`);
    }
    if (saveData.error !== 'EXAM_TIMED_OUT') {
      throw new Error(`Expected error EXAM_TIMED_OUT, got ${saveData.error}`);
    }
  });

  // 7. Requests submitted after expiry are rejected
  await test('7. Direct API answer submissions after expiry are rejected with 403 EXAM_TIMED_OUT', async () => {
    // Create an attempt and forcefully expire it in database
    const testRecord = rrbNtpcExam?.tests[0];
    const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const data = await res.json();
    const forcedAttemptId = data.attemptId;

    // Set expiresAt to 1 minute in the past in PostgreSQL
    await prisma.testAttempt.update({
      where: { id: forcedAttemptId },
      data: { expiresAt: new Date(Date.now() - 60000) },
    });

    // Try to autosave an answer
    const autosaveRes = await fetch(`${BASE_URL}/tests/attempts/${forcedAttemptId}/answer`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        questionId: data.questions[0]?.id || 'q1',
        selectedOption: 'A',
      }),
    });

    if (autosaveRes.status !== 403) {
      throw new Error(`Expected 403 on post-expiry autosave, got ${autosaveRes.status}`);
    }
  });

  // 8. Expired attempts are automatically submitted and results are persisted in PostgreSQL
  await test('8. Expired attempts are automatically finalized, scored, and persisted with TIMED_OUT status', async () => {
    const testRecord = rrbNtpcExam?.tests[0];
    const res = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const data = await res.json();
    const expAttemptId = data.attemptId;
    const q1 = data.questions[0];

    // Save one valid answer before expiry
    await fetch(`${BASE_URL}/tests/attempts/${expAttemptId}/answer`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        questionId: q1.id,
        selectedOption: q1.options ? q1.options[0]?.id : 'A',
      }),
    });

    // Force expire in DB
    await prisma.testAttempt.update({
      where: { id: expAttemptId },
      data: { expiresAt: new Date(Date.now() - 5000) },
    });

    // Calling getAttemptState triggers authoritative auto-finalization
    const stateRes = await fetch(`${BASE_URL}/tests/attempts/${expAttemptId}`, {
      headers: authHeaders,
    });
    const stateData = await stateRes.json();

    if (!stateData.isCompleted || !stateData.isExpired) {
      throw new Error(`Expected isCompleted=true and isExpired=true, got ${JSON.stringify(stateData)}`);
    }

    // Verify PostgreSQL record
    const dbAttempt = await prisma.testAttempt.findUnique({
      where: { id: expAttemptId },
    });

    if (!dbAttempt.isCompleted) {
      throw new Error('Database isCompleted is not true');
    }
    if (dbAttempt.status !== 'TIMED_OUT') {
      throw new Error(`Expected DB status TIMED_OUT, got ${dbAttempt.status}`);
    }
    if (dbAttempt.autoSubmitReason !== 'TIME_EXPIRED') {
      throw new Error(`Expected autoSubmitReason TIME_EXPIRED, got ${dbAttempt.autoSubmitReason}`);
    }
    if (dbAttempt.score === null || dbAttempt.score === undefined) {
      throw new Error('Score was not computed and persisted in database');
    }
  });

  // 9. Multiple tabs cannot extend or restart an attempt
  await test('9. Multiple tabs opening the test cannot create fresh deadline or extend time', async () => {
    const testRecord = rrbNtpcExam?.tests[0];

    // Tab 1 starts test
    const tab1Res = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const tab1Data = await tab1Res.json();

    // Tab 2 opens test 1 second later
    await new Promise((r) => setTimeout(r, 1000));
    const tab2Res = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: false }),
    });
    const tab2Data = await tab2Res.json();

    if (tab1Data.attemptId !== tab2Data.attemptId) {
      throw new Error('Tab 2 created a different attempt instead of reusing active one');
    }
    if (tab1Data.expiresAt !== tab2Data.expiresAt) {
      throw new Error('Tab 2 received a different expiresAt deadline!');
    }
  });

  // 10. Network reconnection restores the same deadline
  await test('10. Reconnecting after simulated offline gap restores the original deadline', async () => {
    const testRecord = rrbNtpcExam?.tests[0];
    const startRes = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const startData = await startRes.json();
    const targetAttemptId = startData.attemptId;
    const originalDeadline = startData.expiresAt;

    // Simulate offline gap
    await new Promise((r) => setTimeout(r, 2000));

    // Reconnection request
    const reconnectRes = await fetch(`${BASE_URL}/tests/attempts/${targetAttemptId}`, {
      headers: authHeaders,
    });
    const reconnectData = await reconnectRes.json();

    if (reconnectData.expiresAt !== originalDeadline) {
      throw new Error('Reconnection altered original expiresAt deadline');
    }
  });

  // 11. Retaking an exam creates a separate attempt with its own deadline
  await test('11. Retaking an exam via forceNew creates a brand-new attempt with its own deadline', async () => {
    const testRecord = rrbNtpcExam?.tests[0];

    // Attempt A
    const resA = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const dataA = await resA.json();

    // Submit Attempt A
    await fetch(`${BASE_URL}/tests/${testRecord.id}/submit`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        attemptId: dataA.attemptId,
        answers: {},
        timeSpentSeconds: 60,
      }),
    });

    // Retake (Attempt B with forceNew)
    const resB = await fetch(`${BASE_URL}/tests/${testRecord.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const dataB = await resB.json();

    if (dataA.attemptId === dataB.attemptId) {
      throw new Error('Retake reused old attempt ID instead of creating new attempt');
    }
    if (dataB.attemptNumber <= dataA.attemptNumber) {
      throw new Error(`Expected attemptNumber increment, got ${dataB.attemptNumber}`);
    }
    if (!dataB.expiresAt || dataB.expiresAt === dataA.expiresAt) {
      throw new Error('Retake did not calculate a separate deadline for the new attempt');
    }
  });

  // 12. Other exams retain their existing configured durations
  await test('12. Other exams retain their exact official configured durations in DB and API', async () => {
    // RRB JE CBT 1 -> 90 mins (5400s)
    const rrbJeCbt1 = rrbJeExam?.stages.find((s) => s.code === 'CBT_1');
    const jeTest = rrbJeExam?.tests.find((t) => t.stageId === rrbJeCbt1?.id && t.durationMinutes === 90) ||
      rrbJeExam?.tests.find((t) => t.title.includes('CBT-1') && t.type === 'FULL_MOCK');
    if (!jeTest) throw new Error('RRB JE CBT 1 Full Mock test not found');

    const jeRes = await fetch(`${BASE_URL}/tests/${jeTest.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const jeData = await jeRes.json();
    if (jeData.durationSeconds !== 5400) {
      throw new Error(`RRB JE CBT 1 expected 5400s (90 mins), got ${jeData.durationSeconds}`);
    }

    // APPSC FBO Screening -> 150 mins (9000s)
    const appscScreening = appscExam?.stages.find((s) => s.code === 'SCREENING_TEST');
    const appscTest = appscExam?.tests.find((t) => t.stageId === appscScreening?.id) || appscExam?.tests[0];
    const appscRes = await fetch(`${BASE_URL}/tests/${appscTest.id}/start`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ forceNew: true }),
    });
    const appscData = await appscRes.json();
    if (appscData.durationSeconds !== 9000) {
      throw new Error(`APPSC Screening expected 9000s (150 mins), got ${appscData.durationSeconds}`);
    }
  });

  console.log('\n================================================================');
  console.log(`📊 VERIFICATION SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================');

  if (failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runExamTimerVerification().catch((err) => {
  console.error('Fatal error in timer verification suite:', err);
  process.exit(1);
});
