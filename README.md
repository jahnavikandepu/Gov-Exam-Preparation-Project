# GovPrep: Multi-Frontend Government Exam Preparation Platform

> **Architecture Overview**: GovPrep is structured as **two separate frontend web applications** (Student Portal & Admin Portal) powered by a single **shared Express/Node.js backend API** and **PostgreSQL database**.

---

## 1. System Architecture

```text
GovPrep/
├── frontend/                     # Student Frontend Application (Port 5173)
│   ├── src/
│   │   ├── components/           # Student UI, exam CBT shell, common components
│   │   ├── context/              # Student AuthContext (USER role only)
│   │   ├── pages/
│   │   │   ├── public/           # Home, About, Exams, ExamDetails
│   │   │   ├── auth/             # Student Login, Student Registration
│   │   │   └── student/          # Dashboard, Tests, Mocks, Weaknesses, Progress, Results, History
│   │   ├── services/             # Student API client
│   │   └── types/                # TypeScript schemas
│   ├── .env                      # VITE_API_URL=http://localhost:5000/api
│   ├── vite.config.ts            # Vite config (Port 5173)
│   └── package.json
│
├── admin/                        # Standalone Admin Application (Port 5174)
│   ├── src/
│   │   ├── components/           # Admin stats cards, question editor, test builder
│   │   ├── context/              # Admin AuthContext (Enforcing ADMIN role)
│   │   ├── layouts/              # Admin Layout with Sidebar navigation
│   │   ├── pages/
│   │   │   ├── auth/             # Dedicated Admin Login
│   │   │   └── admin/            # Admin Dashboard, Users, Questions, Tests, Exams, Analytics, Settings
│   │   ├── routes/               # AdminProtectedRoute guard
│   │   ├── services/             # Admin API client
│   │   └── types/                # Admin TypeScript schemas
│   ├── .env                      # VITE_API_URL=http://localhost:5000/api
│   ├── vite.config.ts            # Vite config (Port 5174)
│   └── package.json
│
├── backend/                      # Shared Backend API & Database (Port 5000)
│   ├── prisma/
│   │   ├── schema.prisma         # PostgreSQL schema (Users, Exams, Questions, Tests, Attempts)
│   │   └── seed.ts               # Database seed scripts
│   ├── src/
│   │   ├── config/               # Database and environment configuration
│   │   ├── controllers/          # Auth, Admin, Exam, Test, Results, AI controllers
│   │   ├── middleware/           # authMiddleware (authenticateJWT, requireAdmin)
│   │   ├── routes/               # REST API endpoints (/api/*)
│   │   ├── services/             # Question selection, test sync, AI integration, scoring
│   │   └── server.ts             # Express server with CORS for both frontends
│   ├── tests/                    # Automated regression & RBAC test suite
│   ├── .env                      # DATABASE_URL, JWT_SECRET, GEMINI_API_KEY, CLIENT_URL, ADMIN_URL
│   └── package.json
│
└── README.md
```

---

## 2. Key Access & Role Separation

### 🎓 Student Website (`frontend/`)
- **Access**: Strictly for students (`USER` role).
- **Features**: Home page, official exams, 30 standardized topic-based tests (50 questions, 60 min, 0 negative marking), CBT exam interface, timer, instant scorecards, weakness tracking, test history, profile.
- **Login Behavior**: Clean student-only login. No admin tabs, no role-selection dropdowns. If an `ADMIN` account attempts login, it is denied with a directive message to use the Admin Portal. Public registration strictly creates `USER` accounts.

### 🛡️ Admin Website (`admin/`)
- **Access**: Strictly for administrators (`ADMIN` role).
- **Features**: Dedicated Admin login, Admin Dashboard with real-time PostgreSQL database counts, registered user directory & status toggle, question bank manager, test builder, exam blueprint stages, system analytics, test pool synchronization.
- **Theme**: Clean, high-contrast light theme.
- **Security**: Backed by server-side `requireAdmin` middleware. Requests without a valid admin token return `403 Forbidden`.

---

## 3. Environment Configuration

### Backend (`backend/.env`)
```env
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/govprep?schema=public"
JWT_SECRET="govprep_super_secret_jwt_key_2026"
GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
PORT=5000
CLIENT_URL="http://localhost:5173"
ADMIN_URL="http://localhost:5174"
NODE_ENV="development"
```

### Student Frontend (`frontend/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

### Admin Frontend (`admin/.env`)
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 4. Local Development

Open three terminal windows to run the stack locally:

### Terminal 1: Shared Backend
```bash
cd backend
npm install
npx prisma generate
npx prisma db push
npm run dev
```
*Backend runs on `http://localhost:5000` (API mounted at `/api`)*

### Terminal 2: Student Frontend
```bash
cd frontend
npm install
npm run dev
```
*Student Portal runs on `http://localhost:5173`*

### Terminal 3: Admin Frontend
```bash
cd admin
npm install
npm run dev
```
*Admin Portal runs on `http://localhost:5174`*

---

## 5. Seed Credentials

| Portal | Email | Password | Role |
| :--- | :--- | :--- | :--- |
| **Student Portal** (`http://localhost:5173`) | `student@govprep.com` | `student123` | `USER` |
| **Admin Portal** (`http://localhost:5174`) | `admin@govprep.com` | `admin123` | `ADMIN` |

---

## 6. Verification & Automated Test Suites

Run the following test suites to verify role-based security, live database counts, and exam/test separation:

```bash
# In backend/
npx tsx tests/verify_dual_frontend_architecture.ts
npx tsx tests/verify_admin_dashboard_stats.ts
npx tsx tests/verify_exam_and_topic_separation.ts
```

Build verification for both frontend applications:

```bash
# Build Student frontend:
cd frontend && npm run build

# Build Admin frontend:
cd admin && npm run build
```

---

## 7. Production Deployment Instructions

Both frontends and the backend can be deployed independently to modern cloud platforms (e.g., Vercel, Netlify, Render, Railway, AWS, DigitalOcean).

### Target Production Topology (Example)
- **Student Website**: `https://govprep.com`
- **Admin Website**: `https://admin.govprep.com`
- **Shared Backend API**: `https://api.govprep.com`
- **PostgreSQL Database**: Managed PostgreSQL (AWS RDS / Supabase / Neon)

### Steps to Deploy:

#### Step 1: Deploy PostgreSQL Database
- Provision a managed PostgreSQL instance and obtain the connection string (`DATABASE_URL`).

#### Step 2: Deploy Shared Backend API
- Deploy `backend/` as a Node.js web service (e.g., Render / Railway / AWS App Runner / Heroku).
- Set Environment Variables:
  - `DATABASE_URL=postgresql://user:pass@host:5432/govprep`
  - `JWT_SECRET=your_production_secret_key`
  - `GEMINI_API_KEY=your_gemini_api_key`
  - `CLIENT_URL=https://govprep.com`
  - `ADMIN_URL=https://admin.govprep.com`
  - `NODE_ENV=production`
- Build command: `npm install && npx prisma generate && npm run build`
- Start command: `npm start`

#### Step 3: Deploy Student Frontend
- Deploy `frontend/` as a Static Site (e.g., Vercel / Netlify / Cloudflare Pages).
- Set Environment Variable:
  - `VITE_API_URL=https://api.govprep.com/api`
- Root Directory: `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Map custom domain: `govprep.com`

#### Step 4: Deploy Admin Frontend
- Deploy `admin/` as a Static Site (e.g., Vercel / Netlify / Cloudflare Pages).
- Set Environment Variable:
  - `VITE_API_URL=https://api.govprep.com/api`
- Root Directory: `admin`
- Build Command: `npm run build`
- Output Directory: `dist`
- Map custom domain: `admin.govprep.com`
