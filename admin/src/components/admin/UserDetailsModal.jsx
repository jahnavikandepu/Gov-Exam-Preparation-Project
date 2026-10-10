import React, { useState, useEffect } from 'react';
import {
  X,
  User as UserIcon,
  Mail,
  Phone,
  Calendar,
  Shield,
  GraduationCap,
  Layers,
  Award,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Percent,
  CheckCircle,
  XCircle,
  MapPin,
  Bookmark,
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { LoadingState, EmptyState } from '../common/FeedbackStates';

export const UserDetailsModal = ({
  userId,
  onClose,
  onStatusChange,
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('summary');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    adminApi
      .getUserDetails(userId)
      .then((res) => {
        setData(res);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load user details:', err);
        setError(err.message || 'Failed to fetch user details.');
        setLoading(false);
      });
  }, [userId]);

  if (!userId) return null;

  const handleToggleStatus = async () => {
    if (!data) return;
    const nextStatus = data.user.status === 'Active' ? 'Disabled' : 'Active';
    setUpdatingStatus(true);
    try {
      await adminApi.updateUserStatus(data.user.id, nextStatus);
      setData((prev) => prev ? { ...prev, user: { ...prev.user, status: nextStatus } } : null);
      if (onStatusChange) {
        onStatusChange(data.user.id, nextStatus);
      }
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return '0s';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    if (m === 0) return `${s}s`;
    return `${m}m ${s}s`;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-200 flex items-center justify-between bg-slate-50/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-sm shadow-purple-500/20">
              {data?.user.name ? data.user.name.slice(0, 2).toUpperCase() : <UserIcon className="h-5 w-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 font-heading">
                  {data?.user.name || 'Candidate Details'}
                </h2>
                {data && (
                  <Badge
                    variant={
                      data.user.status === 'Active'
                        ? 'emerald'
                        : data.user.status === 'Disabled'
                        ? 'rose'
                        : 'slate'
                    }
                    size="sm"
                  >
                    {data.user.status || 'Active'}
                  </Badge>
                )}
                {data?.user.category && (
                  <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-md">
                    {data.user.category}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                Candidate ID: {data?.user.id || userId}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {data && (
              <Button
                size="sm"
                variant={data.user.status === 'Active' ? 'danger' : 'success'}
                onClick={handleToggleStatus}
                isLoading={updatingStatus}
              >
                {data.user.status === 'Active' ? 'Disable Account' : 'Enable Account'}
              </Button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <LoadingState message="Fetching complete candidate metrics and registration data from database..." />
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm font-semibold flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {data && !loading && (
            <>
              {/* Profile Demographic & Academic Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-indigo-500" /> Email
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 font-mono truncate" title={data.user.email}>
                    {data.user.email}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-emerald-500" /> Phone
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 font-mono">
                    {data.user.phone || 'Not provided'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <GraduationCap className="h-3.5 w-3.5 text-purple-500" /> Target Exam
                  </span>
                  <p className="text-xs font-bold text-purple-800 mt-1 truncate" title={data.user.targetExam}>
                    {data.user.targetExam || 'General'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bookmark className="h-3.5 w-3.5 text-amber-500" /> Category
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1">
                    {data.user.category || 'General'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-rose-500" /> Domicile State
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={data.user.state}>
                    {data.user.state || 'Not specified'}
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/90">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-blue-500" /> Registered
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-1 truncate" title={formatDate(data.user.createdAt || data.user.joinedDate)}>
                    {data.user.joinedDate || formatDate(data.user.createdAt)}
                  </p>
                </div>
              </div>

              {/* Secondary Details Row (Qualification, Gender, Target Year) */}
              <div className="flex flex-wrap items-center gap-4 bg-slate-50/80 p-3 rounded-2xl border border-slate-200/70 text-xs text-slate-600">
                <div>
                  <span className="text-slate-400 font-semibold mr-1.5">Qualification:</span>
                  <strong className="text-slate-800 font-bold">{data.user.qualification || 'Graduate'}</strong>
                </div>
                <span className="text-slate-300">•</span>
                <div>
                  <span className="text-slate-400 font-semibold mr-1.5">Gender:</span>
                  <strong className="text-slate-800 font-bold">{data.user.gender || 'Not specified'}</strong>
                </div>
                <span className="text-slate-300">•</span>
                <div>
                  <span className="text-slate-400 font-semibold mr-1.5">Target Year:</span>
                  <strong className="text-purple-700 font-bold">{data.user.targetYear || '2026'}</strong>
                </div>
                <span className="text-slate-300">•</span>
                <div>
                  <span className="text-slate-400 font-semibold mr-1.5">Role:</span>
                  <strong className="text-slate-800 font-bold">{data.user.role} (Student)</strong>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-200 space-x-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('summary')}
                  className={`py-3 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 cursor-pointer ${
                    activeTab === 'summary'
                      ? 'border-purple-600 text-purple-700 bg-purple-50/50 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  Performance & Diagnostics
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('exams')}
                  className={`py-3 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                    activeTab === 'exams'
                      ? 'border-purple-600 text-purple-700 bg-purple-50/50 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Award className="h-4 w-4" />
                  <span>Official Exam Attempts</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {data.examAttempts.length}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('topicTests')}
                  className={`py-3 px-4 font-semibold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 cursor-pointer ${
                    activeTab === 'topicTests'
                      ? 'border-purple-600 text-purple-700 bg-purple-50/50 font-bold'
                      : 'border-transparent text-slate-500 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="h-4 w-4" />
                  <span>Topic-Based Practice Tests</span>
                  <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                    {data.topicAttempts.length}
                  </span>
                </button>
              </div>

              {/* Tab 1: Performance Summary */}
              {activeTab === 'summary' && (
                <div className="space-y-6 animate-in fade-in duration-150">
                  {/* Performance Metric Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Attempts</span>
                        <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                          <TrendingUp className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-slate-900 mt-1">
                        {data.summary.totalAttempts}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        {data.summary.totalExamAttempts} Exams • {data.summary.totalTopicAttempts} Topic Tests
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Average Score</span>
                        <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                          <CheckCircle2 className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-emerald-700 mt-1">
                        {data.summary.averageScore}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Across completed submissions
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accuracy Rate</span>
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                          <Percent className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-blue-700 mt-1">
                        {data.summary.averageAccuracy}%
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Correct vs attempted questions
                      </p>
                    </div>

                    <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Completed Tests</span>
                        <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                          <FileText className="h-4 w-4" />
                        </div>
                      </div>
                      <p className="text-3xl font-extrabold text-slate-900 mt-1">
                        {data.summary.completedAttemptsCount}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Successfully finalized tests
                      </p>
                    </div>
                  </div>

                  {/* Diagnostic Topic Breakdown */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Strong Topics */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2 text-emerald-800">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <h3 className="font-bold text-base">Strong Topic Mastery</h3>
                      </div>
                      <p className="text-xs text-slate-500">
                        Topics where candidate scored high accuracy (≥70%).
                      </p>
                      {data.summary.strongTopics && data.summary.strongTopics.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          {data.summary.strongTopics.map((t, idx) => (
                            <div key={idx} className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{t.topicName}</p>
                                <span className="text-xs text-slate-500">{t.subjectName}</span>
                              </div>
                              <span className="text-sm font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                                {t.accuracyRate}% Accuracy
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-sm text-slate-400">
                          No mastered topics identified yet. Candidate needs more test attempts.
                        </div>
                      )}
                    </div>

                    {/* Weak Topics */}
                    <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                      <div className="flex items-center gap-2 text-rose-800">
                        <XCircle className="h-5 w-5 text-rose-600" />
                        <h3 className="font-bold text-base">Weakness & Error Focus Areas</h3>
                      </div>
                      <p className="text-xs text-slate-500">
                        Topics requiring revision or adaptive drills (&lt;50% accuracy).
                      </p>
                      {data.summary.weakTopics && data.summary.weakTopics.length > 0 ? (
                        <div className="space-y-2 pt-1">
                          {data.summary.weakTopics.map((t, idx) => (
                            <div key={idx} className="p-3 bg-rose-50/50 rounded-xl border border-rose-100 flex items-center justify-between">
                              <div>
                                <p className="font-bold text-slate-900 text-sm">{t.topicName}</p>
                                <span className="text-xs text-slate-500">{t.subjectName}</span>
                              </div>
                              <span className="text-sm font-extrabold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">
                                {t.accuracyRate}% Accuracy
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="py-6 text-center text-sm text-slate-400">
                          No critical weakness clusters detected.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Official Exam Attempts */}
              {activeTab === 'exams' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {data.examAttempts.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3.5">Exam & Stage</th>
                            <th className="px-4 py-3.5">Attempt Date</th>
                            <th className="px-4 py-3.5 text-center">Questions</th>
                            <th className="px-4 py-3.5 text-center">Score / Total</th>
                            <th className="px-4 py-3.5 text-center">Accuracy</th>
                            <th className="px-4 py-3.5 text-center">Time Taken</th>
                            <th className="px-5 py-3.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {data.examAttempts.map((attempt) => (
                            <tr key={attempt.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <p className="font-bold text-slate-900 text-sm">{attempt.examName}</p>
                                <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                                  {attempt.stageName || attempt.testTitle}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                                {formatDate(attempt.startedAt || attempt.submittedAt)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-slate-700">
                                {attempt.attemptedQuestions} / {attempt.totalQuestions}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center font-bold text-slate-900 text-sm">
                                {attempt.score} <span className="text-slate-400 text-xs font-normal">/ {attempt.totalMarks}</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <span className={`font-bold text-xs px-2.5 py-1 rounded-md ${
                                  attempt.accuracy >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  attempt.accuracy >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {attempt.accuracy}%
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-slate-600 font-mono">
                                {formatDuration(attempt.durationSeconds)}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-right">
                                <Badge variant={attempt.isCompleted ? 'emerald' : 'amber'} size="sm">
                                  {attempt.status || (attempt.isCompleted ? 'COMPLETED' : 'IN_PROGRESS')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                      <EmptyState
                        title="No Official Exam Attempts"
                        description="This candidate has not attempted any official government examination stage mocks yet."
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Topic-Based Practice Tests */}
              {activeTab === 'topicTests' && (
                <div className="space-y-4 animate-in fade-in duration-150">
                  {data.topicAttempts.length > 0 ? (
                    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-2xs">
                      <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
                        <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
                          <tr>
                            <th className="px-5 py-3.5">Topic & Exam</th>
                            <th className="px-4 py-3.5">Subject</th>
                            <th className="px-4 py-3.5">Attempt Date</th>
                            <th className="px-4 py-3.5 text-center">Score (Out of 50)</th>
                            <th className="px-4 py-3.5 text-center">Accuracy</th>
                            <th className="px-4 py-3.5 text-center">Time Taken</th>
                            <th className="px-5 py-3.5 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-medium">
                          {data.topicAttempts.map((attempt) => (
                            <tr key={attempt.id} className="hover:bg-slate-50/70 transition-colors">
                              <td className="px-5 py-4 whitespace-nowrap">
                                <p className="font-bold text-slate-900 text-sm">{attempt.topicName || attempt.testTitle}</p>
                                <span className="text-xs text-slate-500 font-medium">
                                  {attempt.examName}
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-xs text-purple-700 font-semibold">
                                {attempt.subjectName}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-xs text-slate-500 font-mono">
                                {formatDate(attempt.startedAt || attempt.submittedAt)}
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center font-bold text-slate-900 text-sm">
                                {attempt.score} <span className="text-slate-400 text-xs font-normal">/ 50</span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center">
                                <span className={`font-bold text-xs px-2.5 py-1 rounded-md ${
                                  attempt.accuracy >= 70 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                  attempt.accuracy >= 50 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                  'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}>
                                  {attempt.accuracy}%
                                </span>
                              </td>
                              <td className="px-4 py-4 whitespace-nowrap text-center text-xs text-slate-600 font-mono">
                                {formatDuration(attempt.durationSeconds)}
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap text-right">
                                <Badge variant={attempt.isCompleted ? 'emerald' : 'amber'} size="sm">
                                  {attempt.status || (attempt.isCompleted ? 'COMPLETED' : 'IN_PROGRESS')}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center">
                      <EmptyState
                        title="No Topic Test Attempts"
                        description="This candidate has not attempted any 50-question topic practice tests yet."
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 px-6 border-t border-slate-200 bg-slate-50 flex items-center justify-between shrink-0">
          <p className="text-xs text-slate-400 font-medium">
            GovPrep Candidate Inspector • Verified Database Records
          </p>
          <Button size="md" variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
