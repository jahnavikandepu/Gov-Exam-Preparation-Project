import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, 
  XCircle, 
  MinusCircle, 
  ArrowLeft, 
  Check, 
  X, 
  BarChart2,
  RotateCcw,
  Layers
} from 'lucide-react';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { ProgressBar } from '../../components/common/ProgressBar';
import { LoadingState } from '../../components/common/FeedbackStates';
import { resultApi } from '../../services/resultApi';

export const ResultsPage = () => {
  const { attemptId } = useParams();
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [questionFilter, setQuestionFilter] = useState('All');
  const navigate = useNavigate();

  useEffect(() => {
    if (attemptId) {
      resultApi.getResultByAttemptId(attemptId).then((data) => {
        setResult(data);
        setLoading(false);
      });
    }
  }, [attemptId]);

  const handleAttemptAgain = () => {
    if (result?.testId) {
      navigate(`/tests/${result.testId}`, {
        state: { forceNew: true },
      });
    } else {
      navigate('/tests');
    }
  };

  if (loading) {
    return <LoadingState message="Generating comprehensive performance scorecard..." fullPage />;
  }

  if (!result) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <h2 className="text-2xl font-bold text-slate-800 font-heading">Test Result Not Found</h2>
        <p className="text-slate-600 text-sm">We could not find the evaluation records for this test attempt.</p>
        <div className="pt-2">
          <Link to="/history">
            <Button variant="primary" size="md">Go to Test History</Button>
          </Link>
        </div>
      </div>
    );
  }

  const questionReviews = result.questionAnalysis || result.questionReviews || [];
  const filteredQuestions = questionReviews.filter((q) => {
    if (questionFilter === 'Correct') return q.isCorrect;
    if (questionFilter === 'Wrong') return !q.isCorrect && q.status !== 'skipped';
    if (questionFilter === 'Skipped') return q.status === 'skipped';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 bg-slate-50">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-6">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 mb-2 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
              Performance Scorecard & Solutions
            </h1>
            <span className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
              <Layers className="h-3.5 w-3.5" />
              Attempt #{result.attemptNumber || 1}
            </span>
          </div>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {result.testTitle || 'Mock Examination'} • Exam: {result.examName || 'RRB NTPC'}
            {result.stageName ? ` • ${result.stageName}` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="sm"
            variant="primary"
            onClick={handleAttemptAgain}
            leftIcon={<RotateCcw className="h-4 w-4" />}
            className="font-bold shadow-sm"
          >
            Attempt Again (New Questions)
          </Button>
          <Link to="/tests">
            <Button size="sm" variant="outline">
              Browse More Tests
            </Button>
          </Link>
        </div>
      </div>

      {/* Qualifying Component Alert Banner */}
      {result.qualifyingNotice && (
        <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-4 sm:p-5 text-amber-900 flex items-start gap-3.5 shadow-xs">
          <div className="p-2 bg-amber-100/80 rounded-xl text-amber-700 shrink-0 mt-0.5">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-amber-900 font-heading">
                Qualifying Component — AI-Generated Diagnostic Estimate
              </h3>
              <Badge variant="amber" size="sm">Qualifying Paper</Badge>
            </div>
            <p className="text-xs text-amber-800 leading-relaxed font-medium">
              This descriptive essay was evaluated against a transparent 50-mark rubric (Relevance: 20 marks, Structure & Organization: 15 marks, Language & Vocabulary: 15 marks). This score is an AI-assisted diagnostic estimate and is subject to official APPSC evaluation rules.
            </p>
          </div>
        </div>
      )}

      {/* 1. SCORE SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Score Card */}
        <Card padding="md" className="border-2 border-blue-100 bg-gradient-to-br from-blue-50/70 to-white shadow-xs">
          <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            {result.isDescriptive ? 'AI Estimated Score' : 'Your Final Score'}
          </p>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-blue-900 font-heading">
              {Number(result.score).toFixed(1)}
            </span>
            <span className="text-base font-semibold text-slate-500">/ {result.totalMarks || (result.isDescriptive ? 50 : result.totalQuestions)}</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {result.isDescriptive 
              ? 'Qualifying component (50 max marks)' 
              : Number(result.negativePerWrong) === 0 
                ? 'No negative marking applied (+1 per correct)' 
                : `-${result.negativePerWrong} per wrong response (1/3 negative marking)`}
          </p>
        </Card>

        {/* Accuracy / Evaluation Status */}
        <Card padding="md" className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50/70 to-white shadow-xs">
          <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider">
            {result.isDescriptive ? 'Evaluation Status' : 'Accuracy'}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl sm:text-4xl font-extrabold text-emerald-900 font-heading">
              {result.isDescriptive ? 'Completed' : `${result.accuracy}%`}
            </span>
          </div>
          <p className="text-xs text-emerald-700 mt-2 font-medium">
            {result.isDescriptive 
              ? 'Descriptive rubric scored'
              : `${result.correctQuestions || result.correctAnswers || 0} correct out of ${result.attemptedQuestions || 0} attempted`}
          </p>
        </Card>

        {/* Accuracy Distribution / Submission Overview */}
        <Card padding="md" className="border border-slate-200 bg-white shadow-xs space-y-2">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            {result.isDescriptive ? 'Response Overview' : 'Attempt Breakdown'}
          </p>
          {result.isDescriptive ? (
            <div className="text-xs space-y-1 pt-1 font-medium text-slate-600">
              <p>Type: <span className="font-bold text-slate-900">Descriptive Essay</span></p>
              <p>Max Marks: <span className="font-bold text-slate-900">50 Marks</span></p>
              <p>Duration: <span className="font-bold text-slate-900">45 Minutes</span></p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {result.correctQuestions || result.correctAnswers || 0} Correct
                </span>
                <span className="text-rose-700 font-semibold flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" /> {result.wrongQuestions || result.incorrectAnswers || 0} Wrong
                </span>
                <span className="text-slate-500 font-semibold flex items-center gap-1">
                  <MinusCircle className="h-3.5 w-3.5" /> {result.skippedQuestions || 0} Skipped
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full flex overflow-hidden">
                <div style={{ width: `${result.accuracy}%` }} className="bg-emerald-500 h-full" />
                <div style={{ width: `${100 - result.accuracy}%` }} className="bg-rose-400 h-full" />
              </div>
            </>
          )}
        </Card>

        {/* Time Spent */}
        <Card padding="md" className="border border-slate-200 bg-white shadow-xs">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Time Duration</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-3xl font-extrabold text-slate-900 font-heading">
              {Math.round((result.timeSpentSeconds || 1800) / 60)}
            </span>
            <span className="text-sm font-semibold text-slate-500">mins</span>
          </div>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {result.isDescriptive 
              ? 'Allocated time: 45 minutes' 
              : `~${Math.round((result.timeSpentSeconds || 1800) / Math.max(1, result.attemptedQuestions || 1))}s average per question`}
          </p>
        </Card>
      </div>

      {/* 2. YOUR PERFORMANCE ANALYSIS: SECTION & TOPIC BREAKDOWN */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BarChart2 className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900">Your Performance Analysis</h2>
        </div>

        {/* Section Breakdown Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {result.sectionResults?.map((sec) => (
            <div key={sec.sectionId} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">{sec.sectionName}</h3>
                <Badge variant={sec.accuracy >= 70 ? 'emerald' : sec.accuracy >= 50 ? 'amber' : 'rose'} size="sm">
                  {sec.accuracy}% Accuracy
                </Badge>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>Score: {Number(sec.marks).toFixed(2)}{sec.maxMarks ? ` / ${sec.maxMarks}` : ''}</span>
                  <span>{sec.correct}/{sec.attempted} Correct</span>
                </div>
                <ProgressBar value={sec.accuracy} color={sec.accuracy >= 70 ? 'emerald' : sec.accuracy >= 50 ? 'amber' : 'rose'} showPercentage={false} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. QUESTION BY QUESTION DIAGNOSTIC REVIEW */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Question Diagnostics & Detailed Explanations</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Review every answer with full step-by-step reasoning and topic tagging.
            </p>
          </div>

          <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl shadow-xs">
            {['All', 'Correct', 'Wrong', 'Skipped'].map((filter) => (
              <button
                key={filter}
                onClick={() => setQuestionFilter(filter)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  questionFilter === filter
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Questions list */}
        <div className="space-y-4">
          {filteredQuestions.map((q, index) => {
            const isEssayQ = q.isDescriptive || q.questionType === 'DESCRIPTIVE_ESSAY' || result.isDescriptive;
            const wordCount = q.textAnswer ? q.textAnswer.trim().split(/\s+/).filter(Boolean).length : 0;

            return (
              <div
                key={q.questionId || index}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 font-mono">Q{index + 1}</span>
                    <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                      {q.sectionName || q.subject} • {q.topicName || 'General'}
                    </span>
                  </div>
                  <Badge
                    variant={isEssayQ ? 'amber' : q.isCorrect ? 'emerald' : q.status === 'skipped' ? 'slate' : 'rose'}
                    size="sm"
                  >
                    {isEssayQ 
                      ? `Descriptive Response (${q.marksPerCorrect || 12.5} Marks)` 
                      : q.isCorrect ? `Correct (+${Number(q.marksPerCorrect || 1.0).toFixed(2)})` : q.status === 'skipped' ? 'Skipped (0.0)' : `Wrong (-${Number(q.negativePerWrong || 0.25).toFixed(2)})`}
                  </Badge>
                </div>

                <p className="text-base font-medium text-slate-900 leading-relaxed">
                  {q.questionText}
                </p>

                {isEssayQ ? (
                  /* DESCRIPTIVE ESSAY EVALUATION VIEW */
                  <div className="space-y-4 pt-2">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 sm:p-5 space-y-2">
                      <div className="flex items-center justify-between text-xs text-slate-600 font-semibold border-b border-slate-200/80 pb-2">
                        <span className="text-slate-800">Your Submitted Descriptive Response</span>
                        <span className="bg-white px-2.5 py-1 rounded-md border border-slate-200">
                          {wordCount} words • {q.textAnswer?.length || 0} characters
                        </span>
                      </div>
                      <div className="pt-2 text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-sans min-h-[100px]">
                        {q.textAnswer ? (
                          q.textAnswer
                        ) : (
                          <span className="italic text-slate-400">No written answer submitted for this prompt.</span>
                        )}
                      </div>
                    </div>

                    {q.evaluationNotes && (
                      <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-4 sm:p-5 space-y-3 text-xs text-blue-950">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-blue-200/60 pb-2.5">
                          <span className="font-bold text-blue-900 text-sm">
                            AI Rubric Evaluation & Feedback
                          </span>
                          <span className="font-extrabold text-blue-800 bg-blue-100 px-3 py-1 rounded-full border border-blue-300">
                            AI Estimated Score: {q.aiScore ?? result.score ?? 0} / 50 Marks
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap text-slate-700 leading-relaxed font-medium text-xs">
                          {q.evaluationNotes}
                        </div>
                        <p className="text-[11px] text-blue-700/80 italic pt-2 border-t border-blue-100">
                          Disclaimer: Transparent rubric criteria applied (Relevance: 20M, Structure: 15M, Language: 15M). This score is an automated diagnostic estimate. Official evaluation is subject to applicable APPSC evaluation rules.
                        </p>
                      </div>
                    )}

                    {q.explanation && (
                      <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-4 text-xs text-emerald-950 space-y-1">
                        <p className="font-bold text-emerald-900">Key Themes & Model Outline:</p>
                        <p className="leading-relaxed text-slate-700 whitespace-pre-wrap">{q.explanation}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* OBJECTIVE MCQ VIEW */
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      {q.options?.map((opt) => {
                        const isUserSelected = q.userAnswer === opt.id;
                        const isCorrect = q.correctAnswer === opt.id;

                        let optClass = 'border-slate-200 bg-white text-slate-700';
                        if (isCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-semibold';
                        } else if (isUserSelected && !q.isCorrect) {
                          optClass = 'border-rose-500 bg-rose-50 text-rose-950 font-semibold';
                        }

                        return (
                          <div
                            key={opt.id}
                            className={`p-3.5 rounded-xl border flex items-center justify-between text-sm ${optClass}`}
                          >
                            <div className="flex items-center gap-2.5">
                              <span className="font-bold font-mono">{opt.id}.</span>
                              <span>{opt.text}</span>
                            </div>
                            {isCorrect && <Check className="h-4 w-4 text-emerald-600 shrink-0" />}
                            {isUserSelected && !isCorrect && <X className="h-4 w-4 text-rose-600 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {q.explanation && (
                      <div className="bg-blue-50/70 border border-blue-100 rounded-xl p-4 text-xs text-blue-950 space-y-1">
                        <p className="font-bold text-blue-900">Step-by-Step Explanation:</p>
                        <p className="leading-relaxed text-slate-700">{q.explanation}</p>
                      </div>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
