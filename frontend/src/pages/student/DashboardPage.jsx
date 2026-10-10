import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Target, 
  Award, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { StatCard } from '../../components/dashboard/StatCard';
import { PerformanceChart } from '../../components/dashboard/PerformanceChart';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/FeedbackStates';
import { analyticsApi } from '../../services/analyticsApi';

export const DashboardPage = () => {
  const { user: authUser } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      analyticsApi.getDashboard(),
      analyticsApi.getHistory(),
    ]).then(([dData, hData]) => {
      setDashboardData(dData);
      setRecentHistory((hData || []).slice(0, 3));
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading || !dashboardData) {
    return <LoadingState message="Loading your student dashboard..." fullPage />;
  }

  const { stats, scoreTrends } = dashboardData;
  const displayName = authUser?.name || 'Aspirant';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* 1. STUDENT HEADER */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight">
              Welcome back, {displayName.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-300 text-sm max-w-xl">
              Track your mock test results, accuracy trends, and overall performance metrics.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <Link to="/exams">
              <Button size="md" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Explore Exams
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* 2. PERFORMANCE STATS TILES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Overall Accuracy"
          value={stats.testsAttempted > 0 ? `${stats.accuracy}%` : '—'}
          trend={stats.testsAttempted > 0 ? { value: `${stats.accuracy}%`, isPositive: stats.accuracy >= 60 } : undefined}
          icon={<Target className="h-5 w-5 text-blue-600" />}
          variant="blue"
        />
        <StatCard
          title="Tests Completed"
          value={stats.testsAttempted.toString()}
          subtitle="Mock & Sectional"
          icon={<Award className="h-5 w-5 text-emerald-600" />}
          variant="emerald"
        />
        <StatCard
          title="Questions Solved"
          value={stats.questionsPracticed.toString()}
          subtitle="Across all sections"
          icon={<CheckCircle2 className="h-5 w-5 text-indigo-600" />}
          variant="purple"
        />
        <StatCard
          title="Average Score"
          value={stats.testsAttempted > 0 ? stats.averageScore.toString() : '—'}
          subtitle="Per mock attempt"
          icon={<AlertTriangle className="h-5 w-5 text-amber-600" />}
          variant="amber"
        />
      </div>

      {/* 3. PERFORMANCE CHARTS */}
      <div>
        <PerformanceChart data={scoreTrends} />
      </div>

      {/* 4. RECENT ATTEMPTS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold font-heading text-slate-900">
            Recent Mock Test Attempts
          </h2>
          <Link
            to="/history"
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
          >
            View Complete History <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {recentHistory.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
            No completed tests yet. Start your first mock exam to begin tracking performance.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {recentHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>{item.date}</span>
                  <Badge variant="blue" size="sm">Score: {item.score}</Badge>
                </div>
                <h3 className="font-bold text-slate-900 text-sm truncate">{item.testTitle}</h3>
                <div className="flex justify-between items-center text-xs text-slate-600 pt-2 border-t border-slate-100">
                  <span>Accuracy: <strong>{item.accuracy}%</strong></span>
                  <span>Time: <strong>{item.duration || item.timeSpent || '30 mins'}</strong></span>
                </div>
                <Link to={`/results/${item.id}`}>
                  <Button variant="outline" size="sm" fullWidth rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                    View Diagnostics
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
