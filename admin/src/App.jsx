import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AdminProtectedRoute } from './routes/AdminProtectedRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { AdminLoginPage } from './pages/auth/AdminLoginPage';
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage';
import { AdminUsersPage } from './pages/admin/AdminUsersPage';
import { AdminQuestionsPage } from './pages/admin/AdminQuestionsPage';
import { AdminTestsPage } from './pages/admin/AdminTestsPage';
import { AdminExamsPage } from './pages/admin/AdminExamsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';

export const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Admin Login Route */}
          <Route path="/login" element={<AdminLoginPage />} />

          {/* Protected Admin Routes */}
          <Route element={<AdminProtectedRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<AdminDashboardPage />} />
              <Route path="/users" element={<AdminUsersPage />} />
              <Route path="/questions" element={<AdminQuestionsPage />} />
              <Route path="/tests" element={<AdminTestsPage />} />
              <Route path="/exams" element={<AdminExamsPage />} />
              <Route path="/settings" element={<AdminSettingsPage />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
