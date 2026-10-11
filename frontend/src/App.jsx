import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './routes/ProtectedRoute';

// Public Pages
import { HomePage } from './pages/public/HomePage';
import { AboutPage } from './pages/public/AboutPage';
import { ExamsPage } from './pages/public/ExamsPage';
import { ExamDetailsPage } from './pages/public/ExamDetailsPage';

// Auth Pages
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';

// Student Pages
import { DashboardPage } from './pages/student/DashboardPage';
import { TestsPage } from './pages/student/TestsPage';
import { TestInstructionsPage } from './pages/student/TestInstructionsPage';
import { MockTestPage } from './pages/student/MockTestPage';
import { ResultsPage } from './pages/student/ResultsPage';
import { HistoryPage } from './pages/student/HistoryPage';
import { ProfilePage } from './pages/student/ProfilePage';
import { WeaknessesPage } from './pages/student/WeaknessesPage';
import { ProgressPage } from './pages/student/ProgressPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public & Student Shell (Navbar + Footer) */}
          <Route element={<MainLayout />}>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/exams" element={<ExamsPage />} />
            <Route path="/exams/:slug" element={<ExamDetailsPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />

            {/* Protected Student Routes (role === 'USER') */}
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/tests" element={<TestsPage />} />
              <Route path="/weaknesses" element={<WeaknessesPage />} />
              <Route path="/progress" element={<ProgressPage />} />
              <Route path="/tests/:id/instructions" element={<TestInstructionsPage />} />
              <Route path="/results/:attemptId" element={<ResultsPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>
          </Route>

          {/* Standalone Protected Mock Examination Interface (Fullscreen CBT Shell) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/tests/:id" element={<MockTestPage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
