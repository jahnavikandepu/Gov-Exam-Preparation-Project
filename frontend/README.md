# GovPrep - Government Exam Preparation Frontend (Role-Based System)

GovPrep is a modern, student-friendly, and responsive web platform for government-exam preparation (RRB NTPC, RRB Group D, RRB ALP, RRB JE, IBPS PO, APPSC).

Built with **React.js, Vite, TypeScript, Tailwind CSS v4, and React Router DOM**.

---

## 🔐 Role-Based Login Flow

GovPrep supports two distinct user roles with full frontend route protection and role-specific navigation:

### 1. Student / User (`USER`)
- **Login Route**: `/login` (Select **👤 USER / Student Login**)
- **Demo Credentials**:
  - **Email**: `student@govprep.com`
  - **Password**: `student123`
- **Redirects to**: `/dashboard`
- **Allowed Routes**:
  - `/dashboard` (Student Performance, continue test, recent tests, weak topics)
  - `/tests` (Full test series catalog)
  - `/tests/:id/instructions` (Rules and exam agreement)
  - `/tests/:id` (Full-screen interactive CBT runner)
  - `/results/:attemptId` (Detailed scorecards & solution reviews)
  - `/history` (Past test attempt history)
  - `/profile` (Candidate preferences & password updates)
- **Restricted**: If a student attempts to access `/admin/*`, they are automatically redirected to `/dashboard`.

---

### 2. Administrator (`ADMIN`)
- **Login Route**: `/login` (Select **🛡 ADMIN / Administrator Login**)
- **Demo Credentials**:
  - **Email**: `admin@govprep.com`
  - **Password**: `admin123`
- **Redirects to**: `/admin`
- **Allowed Routes** (Rendered inside dedicated `AdminLayout` sidebar):
  - `/admin` (System Overview, Total Users, Questions, Attempts, Most-Missed Alerts)
  - `/admin/users` (Registered Students Table, Status Toggle, Candidate Inspector)
  - `/admin/questions` (Question Bank, Approve/Reject, Edit Modal)
  - `/admin/tests` (Test Package Builder, Publisher)
  - `/admin/exams` (Exam Blueprint Catalog & Configuration)
  - `/admin/analytics` (Telemetry, Attempt Volumes, Question Calibration)
  - `/admin/settings` (Global Negative Marking Defaults, Portal Policies)
- **Restricted**: Admin accounts have a dedicated management interface and do not see the student test-taking navigation.

---

## 📁 Architecture & Directory Structure

```text
govprep/
│
├── public/
│   └── favicon.svg
│
├── src/
│   ├── components/
│   │   ├── common/             # Button, Card, Modal, Input, Select, Badge, ProgressBar, FeedbackStates
│   │   ├── layout/             # Navbar, Footer, MainLayout, AdminLayout
│   │   ├── exam/               # ExamCard, ExamPatternTable
│   │   ├── test/               # TestCard, QuestionPanel, OptionList, QuestionPalette, TimerBadge, SectionTabs, ActionBar, SubmitDialog
│   │   ├── dashboard/          # StatCard, PerformanceChart, TopicCard, ContinueTestCard
│   │   └── admin/              # AdminStatsCards, QuestionTable, QuestionEditorModal, TestBuilderModal
│   │
│   ├── pages/
│   │   ├── public/             # HomePage, AboutPage, ExamsPage, ExamDetailsPage
│   │   ├── auth/               # LoginPage (User/Admin Selection), RegisterPage
│   │   ├── student/            # DashboardPage, TestsPage, TestInstructionsPage, MockTestPage, ResultsPage, HistoryPage, ProfilePage
│   │   └── admin/              # AdminDashboardPage, AdminUsersPage, AdminQuestionsPage, AdminTestsPage, AdminExamsPage, AdminAnalyticsPage, AdminSettingsPage
│   │
│   ├── context/
│   │   └── AuthContext.tsx     # React authentication & session context
│   │
│   ├── routes/
│   │   ├── ProtectedRoute.tsx  # Student route guard (USER role)
│   │   └── AdminRoute.tsx      # Administrator route guard (ADMIN role)
│   │
│   ├── data/
│   │   ├── users.ts            # Mock accounts (student@govprep.com & admin@govprep.com)
│   │   ├── exams.ts            # RRB NTPC, Group D, ALP, JE, IBPS PO, APPSC
│   │   ├── tests.ts            # Test packages & mock series
│   │   ├── questions.ts        # CBT questions & admin repository
│   │   ├── dashboard.ts        # Student & admin statistics
│   │   └── results.ts          # Scorecards & question solutions
│   │
│   ├── utils/
│   │   └── auth.ts             # Auth helpers (login, logout, getCurrentUser, getUserRole)
│   │
│   ├── services/
│   │   └── api.ts              # Axios service layer ready for backend endpoints
│   │
│   ├── types/
│   │   └── index.ts            # Full TypeScript definitions
│   │
│   ├── App.tsx                 # Role-based route definitions
│   ├── main.tsx
│   └── index.css               # Tailwind CSS v4 design system
│
├── package.json
├── vite.config.ts
├── tsconfig.json
└── README.md
```

---

## 🛠️ How to Run

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173` in your browser.

4. Build production bundle:
   ```bash
   npm run build
   ```

---

## 🧪 Testing Role-Based Scenarios

1. **Test User Login**:
   - Go to `/login` -> Click **👤 USER / Student Login**.
   - Click "Reset to Default" or enter `student@govprep.com` / `student123`.
   - Click **Login** -> Lands on `/dashboard` with Rahul Kumar's performance metrics.
2. **Test Admin Login**:
   - Logout from profile -> Go to `/login` -> Click **🛡 ADMIN / Administrator Login**.
   - Enter `admin@govprep.com` / `admin123`.
   - Click **Admin Login** -> Lands on `/admin` with GovPrep Administrator console and sidebar.
3. **Test Wrong Credentials**:
   - Enter invalid password -> Displays red error message: `Invalid email or password.`
4. **Test Route Protection**:
   - Log in as Student -> Try typing `/admin` in the browser URL -> Redirected to `/dashboard`.
   - Log out -> Try typing `/dashboard` -> Redirected to `/login`.
