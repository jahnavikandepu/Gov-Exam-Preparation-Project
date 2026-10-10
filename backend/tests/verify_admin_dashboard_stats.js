import { prisma } from '../src/config/db.js';
import { generateToken } from '../src/utils/jwt.js';
const BASE_URL = 'http://localhost:5000/api';
async function runAdminDashboardStatsVerification() {
    console.log('===============================================================');
    console.log('=== ADMIN DASHBOARD DATABASE-DRIVEN STATISTICS VERIFICATION ===');
    console.log('===============================================================');
    // 1. Fetch direct DB counts
    const dbUserCount = await prisma.user.count({
        where: { status: { notIn: ['Deleted', 'DELETED', 'ARCHIVED'] } },
    });
    const dbQuestionCount = await prisma.question.count();
    const dbTopicTestCount = await prisma.test.count({
        where: { type: 'TOPIC_TEST', status: 'ACTIVE' },
    });
    const dbAttemptCount = await prisma.testAttempt.count();
    console.log('\n[Baseline Database Direct Counts]');
    console.log(`- Registered Users: ${dbUserCount}`);
    console.log(`- Total Questions:  ${dbQuestionCount}`);
    console.log(`- Total Tests:      ${dbTopicTestCount}`);
    console.log(`- Total Attempts:   ${dbAttemptCount}`);
    // Find or create admin user for JWT token
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
        admin = await prisma.user.create({
            data: {
                name: 'Admin Verification User',
                email: `admin_verify_${Date.now()}@govprep.com`,
                password: 'hashed_password_placeholder',
                role: 'ADMIN',
                status: 'Active',
            },
        });
    }
    // Find regular student user for unauthorized test
    let student = await prisma.user.findFirst({ where: { role: 'USER' } });
    if (!student) {
        student = await prisma.user.create({
            data: {
                name: 'Student Verification User',
                email: `student_verify_${Date.now()}@govprep.com`,
                password: 'hashed_password_placeholder',
                role: 'USER',
                status: 'Active',
            },
        });
    }
    const adminToken = generateToken({
        userId: admin.id,
        email: admin.email,
        role: admin.role,
        name: admin.name,
        targetExam: admin.targetExam,
    });
    const studentToken = generateToken({
        userId: student.id,
        email: student.email,
        role: student.role,
        name: student.name,
        targetExam: student.targetExam,
    });
    // TEST CASE 1: Dashboard API loads and returns exact DB counts
    console.log('\n[TEST 1] Querying GET /api/admin/dashboard/stats with ADMIN token...');
    const res1 = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const statsRes1 = await res1.json();
    console.log('API Response:', statsRes1);
    if (statsRes1.success === true &&
        statsRes1.totalUsers === dbUserCount &&
        statsRes1.totalQuestions === dbQuestionCount &&
        statsRes1.totalTests === dbTopicTestCount &&
        statsRes1.totalAttempts === dbAttemptCount) {
        console.log('✅ TEST 1 PASSED: API counts exactly match direct PostgreSQL database queries.');
    }
    else {
        throw new Error(`TEST 1 FAILED: Mismatch between API and DB. API=${JSON.stringify(statsRes1)}`);
    }
    // TEST CASE 7: Non-admin user cannot access admin statistics API (Forbidden 403)
    console.log('\n[TEST 7] Querying GET /api/admin/dashboard/stats with non-admin (USER) token...');
    const resStudent = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${studentToken}` },
    });
    if (resStudent.status === 403) {
        console.log('✅ TEST 7 PASSED: Non-admin correctly rejected with HTTP 403 Forbidden.');
    }
    else {
        throw new Error(`TEST 7 FAILED: Expected status 403, received ${resStudent.status}`);
    }
    // TEST CASE 2: Registering a user increases registered-user count
    console.log('\n[TEST 2] Creating a new registered user and verifying count increment...');
    const tempUser = await prisma.user.create({
        data: {
            name: 'Dynamic Test User',
            email: `dynamic_user_${Date.now()}@govprep.test`,
            password: 'test_password',
            role: 'USER',
            status: 'Active',
        },
    });
    const res2 = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const postUserStats = await res2.json();
    console.log(`User count before: ${dbUserCount}, after creation: ${postUserStats.totalUsers}`);
    if (postUserStats.totalUsers === dbUserCount + 1) {
        console.log('✅ TEST 2 PASSED: Registered user count increased by 1.');
    }
    else {
        throw new Error('TEST 2 FAILED: User count did not increment.');
    }
    // Clean up temp user
    await prisma.user.delete({ where: { id: tempUser.id } });
    // TEST CASE 3: Adding a question updates question count
    console.log('\n[TEST 3] Adding a question and verifying question count increment...');
    const topic = await prisma.topic.findFirst({
        include: { subject: { include: { exam: true } } },
    });
    if (!topic)
        throw new Error('No topic found in database.');
    const tempQuestion = await prisma.question.create({
        data: {
            examId: topic.subject.examId,
            subjectId: topic.subjectId,
            topicId: topic.id,
            questionText: `Automated Test Question ${Date.now()}`,
            options: JSON.stringify([
                { id: 'A', text: 'Option 1' },
                { id: 'B', text: 'Option 2' },
                { id: 'C', text: 'Option 3' },
                { id: 'D', text: 'Option 4' },
            ]),
            correctOption: 'A',
            explanation: 'Explanation for test question',
            difficulty: 'MEDIUM',
            status: 'PUBLISHED',
        },
    });
    const res3 = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const postQStats = await res3.json();
    console.log(`Question count before: ${dbQuestionCount}, after creation: ${postQStats.totalQuestions}`);
    if (postQStats.totalQuestions === dbQuestionCount + 1) {
        console.log('✅ TEST 3 PASSED: Total questions count increased by 1.');
    }
    else {
        throw new Error('TEST 3 FAILED: Question count did not increment.');
    }
    // Clean up temp question
    await prisma.question.delete({ where: { id: tempQuestion.id } });
    // TEST CASE 4: Creating a topic-based test updates test count
    console.log('\n[TEST 4] Creating a topic practice test and verifying test count increment...');
    const tempTest = await prisma.test.create({
        data: {
            examId: topic.subject.examId,
            subjectId: topic.subjectId,
            topicId: topic.id,
            title: `Temp Topic Practice Test ${Date.now()}`,
            slug: `temp-topic-practice-test-${Date.now()}`,
            type: 'TOPIC_TEST',
            difficulty: 'MEDIUM',
            totalQuestions: 50,
            durationMinutes: 60,
            totalMarks: 50,
            negativeMarkingPerQuestion: 0.0,
            marksPerCorrect: 1.0,
            status: 'ACTIVE',
        },
    });
    const res4 = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const postTestStats = await res4.json();
    console.log(`Topic tests count before: ${dbTopicTestCount}, after creation: ${postTestStats.totalTests}`);
    if (postTestStats.totalTests === dbTopicTestCount + 1) {
        console.log('✅ TEST 4 PASSED: Topic tests count increased by 1.');
    }
    else {
        throw new Error('TEST 4 FAILED: Topic tests count did not increment.');
    }
    // Clean up temp test
    await prisma.test.delete({ where: { id: tempTest.id } });
    // TEST CASE 5: Starting an attempt updates attempt count
    console.log('\n[TEST 5] Starting a test attempt and verifying attempt count increment...');
    const tempAttempt = await prisma.testAttempt.create({
        data: {
            userId: student.id,
            testTitle: 'Test Attempt Verification',
            examName: 'Verification Exam',
            status: 'IN_PROGRESS',
            isCompleted: false,
            totalQuestions: 50,
        },
    });
    const res5 = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const postAttemptStats = await res5.json();
    console.log(`Attempt count before: ${dbAttemptCount}, after creation: ${postAttemptStats.totalAttempts}`);
    if (postAttemptStats.totalAttempts === dbAttemptCount + 1) {
        console.log('✅ TEST 5 PASSED: Total attempts count increased by 1.');
    }
    else {
        throw new Error('TEST 5 FAILED: Attempt count did not increment.');
    }
    // Clean up temp attempt
    await prisma.testAttempt.delete({ where: { id: tempAttempt.id } });
    // TEST CASE 6: Re-query to verify return to baseline
    console.log('\n[TEST 6] Re-querying after cleanup to verify return to baseline...');
    const res6 = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
        headers: { Authorization: `Bearer ${adminToken}` },
    });
    const finalStats = await res6.json();
    console.log('Final API response:', finalStats);
    if (finalStats.totalUsers === dbUserCount &&
        finalStats.totalQuestions === dbQuestionCount &&
        finalStats.totalTests === dbTopicTestCount &&
        finalStats.totalAttempts === dbAttemptCount) {
        console.log('✅ TEST 6 PASSED: Refreshing dashboard returns accurate real-time values.');
    }
    else {
        throw new Error('TEST 6 FAILED: Final counts do not match baseline.');
    }
    console.log('\n===============================================================');
    console.log('=== ALL 7 ADMIN DASHBOARD VERIFICATION TESTS PASSED (100%) ===');
    console.log('===============================================================');
}
runAdminDashboardStatsVerification()
    .catch((err) => {
    console.error('VERIFICATION ERROR:', err);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
