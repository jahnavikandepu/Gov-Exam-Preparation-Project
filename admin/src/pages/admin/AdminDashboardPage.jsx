import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Plus, 
  HelpCircle, 
  Mail, 
  User as UserIcon, 
  RefreshCw, 
  AlertCircle 
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { useAdminAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/FeedbackStates';
import { AdminStatsCards } from '../../components/admin/AdminStatsCards';

export const AdminDashboardPage = () => {
  const { user } = useAdminAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (err) {
      console.error('[AdminDashboardPage] Error loading statistics:', err);
      setError(err?.response?.data?.message || err?.message || 'Failed to connect to database for statistics.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return <LoadingState message="Connecting to database and calculating live platform statistics..." fullPage />;
  }

  return (
    <div className="space-y-8">
      {/* 1. LIGHT ADMIN WELCOME & CREDENTIALS BANNER */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 text-slate-900 border border-slate-200/90 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Badge variant="purple" size="md">
                Administrator Console
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-slate-900">
              Welcome, Admin
            </h1>
            <p className="text-sm sm:text-base text-slate-500">
              GovPrep Master Control Console • Real-time database metrics, question management & test monitoring
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              size="md"
              variant="outline"
              onClick={() => fetchStats(true)}
              isLoading={refreshing}
              leftIcon={<RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />}
            >
              Refresh Stats
            </Button>
            <Link to="/questions">
              <Button size="md" variant="outline" leftIcon={<HelpCircle className="h-4 w-4" />}>
                Question Bank
              </Button>
            </Link>
            <Link to="/tests">
              <Button size="md" variant="purple" leftIcon={<Plus className="h-4 w-4" />}>
                Create Test
              </Button>
            </Link>
          </div>
        </div>

        {/* Administrator Information Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
            <UserIcon className="h-5 w-5 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Name</p>
              <p className="font-bold text-slate-900 text-sm">{user?.name || 'GovPrep Administrator'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
            <Mail className="h-5 w-5 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Email</p>
              <p className="font-bold text-slate-900 text-sm">{user?.email || 'admin@govprep.com'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
            <ShieldCheck className="h-5 w-5 text-purple-600 shrink-0" />
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Role</p>
              <p className="font-bold text-purple-700 text-sm">Administrator</p>
            </div>
          </div>
        </div>
      </div>

      {/* ERROR FEEDBACK STATE */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-6 w-6 text-rose-600 shrink-0" />
            <div>
              <p className="font-bold text-rose-900">Database Connection Error</p>
              <p className="text-sm text-rose-700">{error}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
            >
              Re-login as Admin
            </Button>
            <Button size="sm" variant="danger" onClick={() => fetchStats(false)}>
              Retry Connection
            </Button>
          </div>
        </div>
      )}

      {/* 2. CORE STATISTICS CARDS (DATABASE-DRIVEN: SEPARATE TESTS ATTEMPTED & EXAMS ATTEMPTED) */}
      {stats && <AdminStatsCards stats={stats} />}
    </div>
  );
};
