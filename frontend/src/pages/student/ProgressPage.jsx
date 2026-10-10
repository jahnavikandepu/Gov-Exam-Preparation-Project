import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Target, 
  CheckCircle2, 
  BookOpen, 
  ArrowRight, 
  RefreshCw 
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { analyticsApi } from '../../services/analyticsApi';

export const ProgressPage = () => {
  const [progress, setProgress] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      setIsLoading(true);
      try {
        const res = await analyticsApi.getProgress();
        setProgress(res);
      } catch (err) {
        console.error('Error fetching progress:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadProgress();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <p className="text-slate-600 font-medium text-sm">Aggregating historical learning trajectory...</p>
      </div>
    );
  }

  const accuracyTrend = progress?.accuracyTrend || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <Badge variant="blue" size="md" className="mb-1.5">Learning Trajectory</Badge>
          <h1 className="text-3xl font-extrabold text-slate-900 font-heading">
            Preparation Progress & Growth
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Tracking your score velocity, subject mastery, and adaptive refinement over time.
          </p>
        </div>

        <Link to="/weaknesses">
          <Button variant="outline" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
            View Weakness Profile
          </Button>
        </Link>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Overall Accuracy</span>
            <Target className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-heading">
            {progress?.overallAccuracy}%
          </p>
          <p className="text-xs text-slate-500 font-medium">Weighted across all completed test sessions</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Questions Practiced</span>
            <BookOpen className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-heading">
            {progress?.totalQuestionsPracticed}
          </p>
          <p className="text-xs text-slate-500 font-medium">Total questions solved in mock & adaptive modes</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-semibold uppercase">
            <span>Full Tests Completed</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-extrabold text-slate-900 font-heading">
            {progress?.totalTestsCompleted}
          </p>
          <p className="text-xs text-slate-500 font-medium">Calibrated against official examination benchmarks</p>
        </div>
      </div>

      {/* Accuracy Trend Graph / Timeline */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900">Score & Accuracy Growth Over Attempts</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Sequential Test Progression</span>
        </div>

        {accuracyTrend.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-2xl p-10 text-center space-y-3 bg-slate-50/50">
            <div className="h-12 w-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto border border-blue-100">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-heading">
              No Growth Trajectory Yet
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Your accuracy and score progression will be recorded after you complete your first CBT mock test.
            </p>
            <div className="pt-2">
              <Link to="/tests">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
                  Explore Practice Tests
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {accuracyTrend.map((item, idx) => (
              <div key={idx} className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold">
                  <span className="text-slate-800 font-medium">
                    #{item.attemptNumber}: {item.testTitle} ({item.date})
                  </span>
                  <span className="text-blue-700 font-bold">
                    Score: {item.score} | Accuracy: {item.accuracy}%
                  </span>
                </div>
                <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${item.accuracy}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
