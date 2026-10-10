import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAdminAuth } from '../context/AuthContext';
import { LoadingState } from '../components/common/FeedbackStates';

export const AdminProtectedRoute = () => {
  const { user, isAuthenticated, isLoading } = useAdminAuth();
  const location = useLocation();

  if (isLoading) {
    return <LoadingState message="Verifying administrator security clearance..." fullPage />;
  }

  if (!isAuthenticated || user?.role !== 'ADMIN') {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};
