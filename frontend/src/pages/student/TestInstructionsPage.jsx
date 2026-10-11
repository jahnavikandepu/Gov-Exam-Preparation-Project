import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  AlertCircle, 
  Play, 
  ArrowLeft,
  Check,
  Bookmark,
  Tag,
  BookOpen
} from 'lucide-react';
import { testApi } from '../../services/testApi';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { LoadingState, EmptyState } from '../../components/common/FeedbackStates';

export const TestInstructionsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAgreed, setIsAgreed] = useState(false);

  useEffect(() => {
    if (id) {
      testApi.getTestById(id).then((data) => {
        if (data) setTest(data);
        else testApi.getTestById('rrb-ntpc-cbt-1-mock-01').then((fallback) => setTest(fallback || null));
        setLoading(false);
      });
    }
  }, [id]);

  if (loading) {
    return <LoadingState message="Loading official test guidelines & blueprint..." fullPage />;
  }

  if (!test) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          title="Test not found"
          description="The selected test could not be loaded."
          actionText="Browse Available Tests"
          onAction={() => navigate('/tests')}
        />
      </div>
    );
  }

  const isNoNegative = Number(test.negativeMarkingPerQuestion) === 0;

  const handleStartTest = () => {
    if (!isAgreed) return;

    // Trigger browser fullscreen synchronously within the user gesture click
    if (document.fullscreenEnabled && !document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.warn('[EXAM] Fullscreen request on user start click failed/blocked:', err);
      });
    }

    const isRetake = location.state?.forceNew === true || new URLSearchParams(window.location.search).get('retake') === 'true';

    navigate(`/tests/${test.id}`, {
      state: { forceNew: isRetake },
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Back button */}
      <div>
        <Link
          to="/tests"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Tests</span>
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="blue" size="md">{test.examName}</Badge>
            {test.subjectName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                {test.subjectName}
              </span>
            )}
            {test.topicName && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                <Tag className="h-3.5 w-3.5" />
                Topic: {test.topicName}
              </span>
            )}
          </div>
          <Badge variant="amber" size="md">Difficulty: {test.difficulty}</Badge>
        </div>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
          {test.title}
        </h1>

        {/* Highlight strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-slate-50 p-5 rounded-xl border border-slate-200/70 text-center">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Questions</span>
            <p className="text-xl font-extrabold text-slate-900">{test.totalQuestions} Qs</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Duration</span>
            <p className="text-xl font-extrabold text-slate-900">{test.durationMinutes} Minutes</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Maximum Marks</span>
            <p className="text-xl font-extrabold text-slate-900">{test.totalMarks} Marks</p>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Negative Marking</span>
            <p className={`text-xl font-extrabold ${isNoNegative ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isNoNegative ? 'No (0 Marks)' : `-${test.negativeMarkingPerQuestion} Mark`}
            </p>
          </div>
        </div>

        {/* Topic Context strip */}
        {test.topicName && (
          <div className="flex items-center gap-2 p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs font-semibold text-indigo-900">
            <BookOpen className="h-4 w-4 text-indigo-600 shrink-0" />
            <span>This test is strictly focused on <strong>{test.topicName}</strong> ({test.subjectName || test.examName}). Exactly 50 unique questions are evaluated per attempt.</span>
          </div>
        )}
      </div>

      {/* Instructions Content */}
      <Card padding="lg" className="border border-slate-200/90 space-y-6">
        <div>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2.5">
            <AlertCircle className="h-6 w-6 text-blue-600 shrink-0" />
            General Examination Instructions
          </h2>
          <ul className="space-y-3.5 text-base text-slate-700 list-disc pl-6 leading-relaxed">
            {test.instructions && test.instructions.length > 0 ? (
              test.instructions.map((inst, i) => <li key={i}>{inst}</li>)
            ) : (
              <>
                <li>Total test duration is strictly {test.durationMinutes} minutes ({test.durationMinutes === 60 ? '01:00:00' : `${test.durationMinutes} minutes`}).</li>
                <li>{isNoNegative ? 'No negative marking is applied: Each correct answer earns +1 mark, wrong or skipped answers earn 0.' : `Negative marking of -${test.negativeMarkingPerQuestion} mark is deducted for incorrect answers.`}</li>
                <li>You can navigate freely between questions 1 through {test.totalQuestions} using the question palette.</li>
              </>
            )}
            <li>The countdown timer is calculated against the server clock. Refreshing or switching tabs will not alter the remaining time.</li>
            <li>Answers are autosaved continuously in real-time.</li>
            <li>When the countdown reaches 00:00, your test will be submitted automatically.</li>
            <li>Every retake of this topic test generates a fresh, unseen set of questions.</li>
          </ul>
        </div>

        {/* Palette Legend Explanation */}
        <div className="border-t border-slate-200 pt-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">Question Palette Symbols & Legends</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-sm bg-slate-50 p-5 rounded-xl border border-slate-200/60">
            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Check className="h-4 w-4" />
              </span>
              <span className="text-slate-800"><strong>Answered:</strong> You have selected an answer.</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded bg-rose-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                ✕
              </span>
              <span className="text-slate-800"><strong>Not Answered:</strong> Visited but left unanswered.</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-purple-600 text-white flex items-center justify-center font-bold text-sm shrink-0">
                <Bookmark className="h-3.5 w-3.5" />
              </span>
              <span className="text-slate-800"><strong>Marked for Review:</strong> Marked to re-check later.</span>
            </div>

            <div className="flex items-center gap-3">
              <span className="h-7 w-7 rounded-full bg-purple-700 text-white flex items-center justify-center font-bold text-sm relative shrink-0">
                <Bookmark className="h-3.5 w-3.5" />
                <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-purple-700" />
              </span>
              <span className="text-slate-800"><strong>Answered + Marked:</strong> Answered & marked for review.</span>
            </div>

            <div className="flex items-center gap-3 sm:col-span-2">
              <span className="h-7 w-7 rounded bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-sm shrink-0">
                ?
              </span>
              <span className="text-slate-800"><strong>Not Visited:</strong> You have not viewed this question yet.</span>
            </div>
          </div>
        </div>

        {/* Checkbox Declaration */}
        <div className="border-t border-slate-200 pt-6">
          <label className="flex items-start gap-3.5 p-4 rounded-xl border border-blue-200 bg-blue-50/50 cursor-pointer hover:bg-blue-50 transition-colors">
            <input
              type="checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-1 h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span className="text-base font-semibold text-slate-900 leading-snug">
              I have read and understood all the instructions. I declare that I am prepared to begin this test under authentic examination conditions.
            </span>
          </label>
        </div>

        {/* Start Button */}
        <div className="flex items-center justify-end gap-3 pt-3">
          <Button
            type="button"
            size="lg"
            variant="primary"
            disabled={!isAgreed}
            onClick={handleStartTest}
            leftIcon={<Play className="h-5 w-5 fill-current" />}
          >
            Start Test
          </Button>
        </div>
      </Card>
    </div>
  );
};
