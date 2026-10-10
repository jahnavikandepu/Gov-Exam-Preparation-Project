# GovPrep Backend Engine

Adaptive Government-Exam Preparation Platform & Continuous Diagnostic Engine.

## Overview
GovPrep is an intelligent adaptive learning platform designed for high-stakes government exam aspirants (RRB NTPC, SSC CGL, IBPS PO, APPSC, etc.). Instead of static mock exams, GovPrep continuously learns a student's topic weaknesses and automatically synthesizes their **Next Best Practice Session**.

---

## Technology Stack
- **Runtime**: Node.js v20+ / TypeScript
- **Framework**: Express.js
- **ORM & Database**: Prisma ORM with SQLite (development/local) and PostgreSQL (production)
- **Security**: JWT Authentication, bcrypt password hashing, role-based authorization (USER / ADMIN)
- **AI & Adaptive Intelligence**: Multi-factor weakness scoring algorithm + Gemini AI analysis with zero-failure deterministic fallback

---

## Directory Architecture
```
govprep/backend/
├── src/
│   ├── config/
│   │   └── db.ts                # Prisma client singleton
│   ├── controllers/
│   │   ├── authController.ts        # Register, Login, Me, Logout
│   │   ├── examController.ts        # Exam syllabus, patterns, subjects
│   │   ├── testController.ts        # Test catalog, CBT start, server scoring
│   │   ├── resultController.ts      # Diagnostic results & explanations
│   │   ├── adaptiveController.ts    # Next session, weakness profiles
│   │   ├── aiController.ts          # AI performance analysis & roadmaps
│   │   ├── performanceController.ts # Score velocity, history, progress
│   │   └── adminController.ts       # Questions CRUD, system analytics
│   ├── routes/
│   │   ├── authRoutes.ts
│   │   ├── examRoutes.ts
│   │   ├── testRoutes.ts
│   │   ├── resultRoutes.ts
│   │   ├── adaptiveRoutes.ts
│   │   ├── aiRoutes.ts
│   │   ├── performanceRoutes.ts
│   │   ├── adminRoutes.ts
│   │   └── index.ts             # Root /api router
│   ├── services/
│   │   ├── adaptive/
│   │   │   └── adaptiveEngine.ts    # Weakness weighting & dynamic drill generator
│   │   ├── ai/
│   │   │   └── aiService.ts         # Structured AI mentor & deterministic fallback
│   │   ├── analytics/
│   │   │   └── analyticsService.ts  # Student & admin system telemetry
│   │   └── recommendation/
│   │       └── recommendationService.ts # Next best practice synthesis
│   ├── middleware/
│   │   ├── authMiddleware.ts    # JWT & ADMIN role guards
│   │   └── errorHandler.ts      # Global Express error handler
│   ├── utils/
│   │   ├── jwt.ts               # Token signing & verification
│   │   └── hash.ts              # Bcrypt password utilities
│   └── server.ts                # Express application entrypoint
├── prisma/
│   ├── schema.prisma            # Full relational database schema
│   └── seed.ts                  # Seed script with real questions & exams
├── tests/
│   └── run-tests.ts             # 9 comprehensive automated tests
├── .env.example
├── .env
├── package.json
└── tsconfig.json
```

---

## Environment Variables Configuration
Create a `.env` file in the `backend/` directory:

```env
# Database connection (SQLite local or PostgreSQL)
DATABASE_URL="file:./dev.db"

# Authentication
JWT_SECRET="govprep_super_secret_jwt_key_2026"

# AI Integration (Optional: works seamlessly with built-in deterministic fallback if omitted)
AI_API_KEY=""
AI_MODEL="gemini-2.0-flash"

# Server configuration
PORT=5000
CLIENT_URL="http://localhost:5173"
NODE_ENV="development"
```

---

## Getting Started

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Generate Prisma Client & Sync Database
```bash
npx prisma generate
npx prisma db push
```

### 3. Seed Database with Real Exams & Questions
```bash
npm run prisma:seed
```

### 4. Run Automated Backend Tests
```bash
npm test
```

### 5. Start Backend Server
```bash
# Development mode with hot-reload:
npm run dev

# Or build and start in production:
npm run build
npm start
```

---

## Core API Endpoints

### Authentication
- `POST /api/auth/register` — Create student account (Normal registration always creates `USER` role)
- `POST /api/auth/login` — Login with credentials (returns JWT token)
- `GET /api/auth/me` — Get authenticated student profile
- `POST /api/auth/logout` — Invalidate session

### Exams & Tests
- `GET /api/exams` — List published government examinations
- `GET /api/exams/:slugOrId` — Get exam pattern, subjects, and topics
- `GET /api/tests` — List mock and sectional tests (supports `examSlug`, `type`, `difficulty` filters)
- `GET /api/tests/:id` — Get test details
- `POST /api/tests/:id/start` — Start a test (returns question bank without correct options)
- `POST /api/tests/:id/submit` — Submit test with **server-side scoring** and auto-triggers adaptive update

### Diagnostics & Results
- `GET /api/results/:attemptId` — Scorecard with section breakdown, explanations, and next practice recommendation

### Adaptive Intelligence
- `GET /api/adaptive/next-session` — Get active next recommended practice session
- `POST /api/adaptive/generate-session` — Dynamically compose a custom drill targeting weak topics
- `GET /api/adaptive/weaknesses` — Get categorized topics ("Needs Attention", "Improving", "Strong")
- `GET /api/adaptive/recommendations` — Recommendation history

### AI Mentorship & Progress
- `GET /api/ai/analysis` — Get AI performance diagnosis & strategic roadmap
- `POST /api/ai/analyze-performance` — Trigger on-demand AI analysis
- `GET /api/performance/dashboard` — Live student KPI aggregations
- `GET /api/performance/progress` — Score trajectory and subject mastery
- `GET /api/performance/history` — All past test attempts with deltas

### Syllabus Documents
- `GET /api/syllabus` — List all registered syllabus documents and their disk availability status
- `GET /api/syllabus/:examSlug` — Get metadata and availability for a specific exam syllabus
- `GET /api/syllabus/:examSlug/verify` — Check whether the physical PDF file exists on the server

### Administration (Requires JWT + ADMIN role)
- `GET /api/admin/users` — Student list and test attempt telemetry
- `GET /api/admin/questions` — Question bank with topic tags and status
- `POST /api/admin/questions` — Create approved/published question
- `PUT /api/admin/questions/:id` — Update question
- `DELETE /api/admin/questions/:id` — Delete question
- `GET /api/admin/analytics` — Difficult topics, weak clusters, and missed questions

---

## Syllabus Document System

GovPrep uses official government exam syllabus PDFs as the single source of truth for:
- **Exam subjects & pattern structure**
- **Topics & subtopics hierarchy**
- **AI question generation & difficulty calibration**
- **Question classification & syllabus alignment**
- **Adaptive topic practice recommendations**

### Adding a syllabus PDF

1. **Locate or create the exam folder**:
   ```bash
   backend/data/syllabus/<exam-slug>/
   ```
   *Example*: `backend/data/syllabus/rrb-ntpc/`

2. **Place the official PDF inside it**:
   ```bash
   backend/data/syllabus/rrb-ntpc/syllabus.pdf
   # or
   backend/data/syllabus/rrb-ntpc/rrb-ntpc-syllabus.pdf
   ```

3. **Verify the document is detected**:
   Query the syllabus endpoint or visit in your browser:
   ```bash
   curl http://localhost:5000/api/syllabus/rrb-ntpc
   ```
   The response will automatically recognize the PDF file, report its size, and confirm readiness for future extraction:
   ```json
   {
     "success": true,
     "document": {
       "exam": "RRB NTPC",
       "slug": "rrb-ntpc",
       "fileName": "syllabus.pdf",
       "filePath": "rrb-ntpc/syllabus.pdf",
       "documentType": "SYLLABUS",
       "language": "English",
       "exists": true,
       "fileSizeBytes": 452100,
       "statusMessage": "PDF is ready for future processing and syllabus tree extraction."
     }
   }
   ```

