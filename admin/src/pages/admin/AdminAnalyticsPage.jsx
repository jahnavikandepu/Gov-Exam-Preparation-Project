import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Award, HelpCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { adminApi } from '../../services/adminApi';
import { LoadingState } from '../../components/common/FeedbackStates';

export const AdminAnalyticsPage = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.getAnalytics().then((data) => {
      setAnalytics(data);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingState message="Loading administrative telemetry from database..." fullPage />;
  }

  const mostDifficult = analytics?.mostDifficultTopics || [];
  const mostFrequentlyWeak = analytics?.mostFrequentlyWeakTopics || [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
        <div>
          <Badge variant="purple" size="md" className="mb-1.5">System Intelligence</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Adaptive Platform Telemetry
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time telemetry on student test attempts, question difficulty calibration, and weak topic clusters.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-emerald-700 font-mono font-bold bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-md">
            ● Adaptive Engine Active
          </span>
        </div>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Registered Students</span>
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-heading mt-2">
            {analytics?.totalStudents || 0}
          </p>
          <span className="text-xs text-blue-600 font-semibold mt-1 inline-block">Active test candidates</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Tests Attempted</span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-heading mt-2">
            {analytics?.totalAttempts || 0}
          </p>
          <span className="text-xs text-emerald-600 font-semibold mt-1 inline-block">Server-scored attempts</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Approved Question Bank</span>
            <HelpCircle className="h-5 w-5 text-purple-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-heading mt-2">
            {analytics?.totalQuestions || 0}
          </p>
          <span className="text-xs text-purple-600 font-semibold mt-1 inline-block">Used by adaptive generator</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Published Tests</span>
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-heading mt-2">
            {analytics?.totalTests || 0}
          </p>
          <span className="text-xs text-amber-600 font-semibold mt-1 inline-block">Topic practice tests</span>
        </div>
      </div>

      {/* Analytics Breakdown Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Most Difficult Topics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <AlertTriangle className="h-5 w-5 text-rose-600" />
            Most Difficult Topics (Lowest Student Accuracy)
          </h3>

          <div className="space-y-4 pt-2">
            {mostDifficult.length > 0 ? (
              mostDifficult.map((row, idx) => (
                <div key={idx} className="space-y-1.5 text-sm">
                  <div className="flex justify-between font-semibold">
                    <span className="text-slate-800">{row.topicName} ({row.subjectName})</span>
                    <span className="text-rose-700 font-bold">{row.accuracy}% Accuracy</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-rose-500" style={{ width: `${row.accuracy}%` }} />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Telemetry will populate automatically as students submit tests.</p>
            )}
          </div>
        </div>

        {/* Most Frequently Weak Topics */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2.5">
            <BarChart3 className="h-5 w-5 text-amber-600" />
            Topics Frequently Identified as Weak
          </h3>

          <div className="space-y-3 pt-2">
            {mostFrequentlyWeak.length > 0 ? (
              mostFrequentlyWeak.map((row, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">{row.topicName}</h4>
                    <p className="text-xs text-slate-500">{row.subjectName}</p>
                  </div>
                  <Badge variant="amber" size="sm">
                    {row.weakStudentCount || 1} Aspirants Flagged
                  </Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">No weak clusters detected yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
