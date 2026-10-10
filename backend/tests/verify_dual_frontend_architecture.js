import { prisma } from '../src/config/db.js';
const BASE_URL = 'http://localhost:5000/api';
async function runDualFrontendVerification() {
    console.log('===============================================================');
    console.log('=== VERIFYING DUAL FRONTEND ARCHITECTURE & ROLE ENFORCEMENT ===');
    console.log('===============================================================');
    try {
        // 1. Verify Admin User Exists
        const adminUser = await prisma.user.findFirst({
            where: { role: 'ADMIN' },
        });
        console.log(`[CHECK 1] Admin Account: ${adminUser ? adminUser.email : 'NOT FOUND'}`);
        if (!adminUser)
            throw new Error('No ADMIN user found in database');
        // 2. Verify Student User Exists
        let studentUser = await prisma.user.findUnique({
            where: { email: 'student@govprep.com' },
        });
        if (!studentUser) {
            studentUser = await prisma.user.findFirst({
                where: { role: 'USER' },
            });
        }
        console.log(`[CHECK 2] Student Account: ${studentUser ? studentUser.email : 'NOT FOUND'}`);
        if (!studentUser)
            throw new Error('No USER (student) user found in database');
        // 3. Test Student Login Flow with Student Account
        console.log('\n[TEST 1] Logging in with student credentials...');
        const studentLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: studentUser.email,
                password: 'student123',
                role: 'USER',
            }),
        });
        const studentData = await studentLoginRes.json();
        console.log(`Student Login Status: ${studentLoginRes.status}`);
        const studentToken = studentData.token;
        if (studentLoginRes.status !== 200 || !studentToken) {
            throw new Error(`Student login failed: ${JSON.stringify(studentData)}`);
        }
        console.log('✅ TEST 1 PASSED: Student login succeeded.');
        // 4. Test Student Role Rejection for Admin Endpoints
        console.log('\n[TEST 2] Verifying Student Token CANNOT access Admin Endpoints...');
        const studentAccessAdminRes = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
            headers: { Authorization: `Bearer ${studentToken}` },
        });
        console.log(`Student accessing Admin Stats received status ${studentAccessAdminRes.status} (Expected 403).`);
        if (studentAccessAdminRes.status !== 403) {
            throw new Error(`Expected 403 Forbidden for student accessing admin endpoints, got ${studentAccessAdminRes.status}`);
        }
        console.log('✅ TEST 2 PASSED: Server-side RBAC strictly blocked student access to Admin APIs (403 Forbidden).');
        // 5. Test Admin Login Flow
        console.log('\n[TEST 3] Logging in with Admin credentials for Admin Portal...');
        const adminLoginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: adminUser.email,
                password: 'admin123',
                role: 'ADMIN',
            }),
        });
        const adminData = await adminLoginRes.json();
        console.log(`Admin Login Status: ${adminLoginRes.status}`);
        const adminToken = adminData.token;
        if (adminLoginRes.status !== 200 || !adminToken) {
            throw new Error(`Admin login failed: ${JSON.stringify(adminData)}`);
        }
        console.log('✅ TEST 3 PASSED: Admin login succeeded.');
        // 6. Test Admin Token Access to Admin Stats
        console.log('\n[TEST 4] Verifying Admin Token CAN access Admin Stats and returns live PostgreSQL counts...');
        const adminStatsRes = await fetch(`${BASE_URL}/admin/dashboard/stats`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const adminStatsData = await adminStatsRes.json();
        console.log(`Admin Stats response:`, adminStatsData);
        if (adminStatsRes.status !== 200 || !adminStatsData.success) {
            throw new Error(`Admin stats request failed: ${JSON.stringify(adminStatsData)}`);
        }
        const { totalUsers, totalQuestions, totalTests, totalAttempts } = adminStatsData;
        console.log(`- Total Users: ${totalUsers}`);
        console.log(`- Total Questions: ${totalQuestions}`);
        console.log(`- Total Tests: ${totalTests}`);
        console.log(`- Total Attempts: ${totalAttempts}`);
        if (totalUsers <= 0 || totalQuestions <= 0 || totalTests <= 0 || totalAttempts <= 0) {
            throw new Error('Stats returned non-positive numbers');
        }
        console.log('✅ TEST 4 PASSED: Admin token successfully retrieved live database stats.');
        // 7. Test Non-Admin Rejection in Admin Login
        console.log('\n[TEST 5] Verifying Student user cannot authenticate as ADMIN in admin login...');
        const studentAsAdminRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: studentUser.email,
                password: 'student123',
                role: 'ADMIN',
            }),
        });
        console.log(`Student trying Admin Login received status ${studentAsAdminRes.status} (Expected 403 or 400).`);
        if (studentAsAdminRes.status === 200) {
            throw new Error('Student account should not be allowed to authenticate with role=ADMIN');
        }
        console.log('✅ TEST 5 PASSED: Admin portal rejects non-admin users.');
        // 8. Test Admin GET /api/admin/users/:id
        console.log('\n[TEST 6] Verifying Admin CAN fetch comprehensive user details...');
        const userDetailsRes = await fetch(`${BASE_URL}/admin/users/${studentUser.id}`, {
            headers: { Authorization: `Bearer ${adminToken}` },
        });
        const userDetailsData = await userDetailsRes.json();
        console.log(`User Details status: ${userDetailsRes.status}, success: ${userDetailsData.success}`);
        if (userDetailsRes.status !== 200 || !userDetailsData.success) {
            throw new Error(`Failed to fetch user details: ${JSON.stringify(userDetailsData)}`);
        }
        if (userDetailsData.user.password) {
            throw new Error('Security violation: password hash exposed in user details response!');
        }
        console.log(`- Candidate Name: ${userDetailsData.user.name}`);
        console.log(`- Official Exam Attempts: ${userDetailsData.examAttempts.length}`);
        console.log(`- Topic Test Attempts: ${userDetailsData.topicAttempts.length}`);
        console.log(`- Average Score: ${userDetailsData.summary.averageScore}%`);
        console.log(`- Average Accuracy: ${userDetailsData.summary.averageAccuracy}%`);
        console.log('✅ TEST 6 PASSED: Admin successfully fetched complete user details with separated exam & topic tests, without exposing sensitive fields.');
        // 9. Test Student CANNOT fetch /api/admin/users/:id
        console.log('\n[TEST 7] Verifying Student CANNOT access /api/admin/users/:id...');
        const studentAccessDetailsRes = await fetch(`${BASE_URL}/admin/users/${studentUser.id}`, {
            headers: { Authorization: `Bearer ${studentToken}` },
        });
        console.log(`Student accessing /admin/users/:id status: ${studentAccessDetailsRes.status} (Expected 403).`);
        if (studentAccessDetailsRes.status !== 403) {
            throw new Error(`Expected 403 Forbidden for student accessing user details API, got ${studentAccessDetailsRes.status}`);
        }
        console.log('✅ TEST 7 PASSED: Server-side RBAC blocked student access to user details API.');
        console.log('\n===============================================================');
        console.log('🎉 ALL DUAL FRONTEND ARCHITECTURE TESTS PASSED SUCCESSFULLY! 🎉');
        console.log('===============================================================');
    }
    catch (error) {
        console.error('❌ Verification failed:', error);
        process.exit(1);
    }
    finally {
        await prisma.$disconnect();
        process.exit(0);
    }
}
runDualFrontendVerification();
