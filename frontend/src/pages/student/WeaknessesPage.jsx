import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Target, 
  ArrowRight, 
  RefreshCw,
  Clock,
  BookOpen
} from 'lucide-react';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { adaptiveApi } from '../../services/adaptiveApi';
import { ProgressBar } from '../../components/common/ProgressBar';

export const WeaknessesPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setIsGenerating] = useState(false);
  const navigate = useNavigate();

  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await adaptiveApi.getWeaknessProfile();
      setData(res);
    } catch (err) {
      console.error('Error loading weakness profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handlePracticeTopic = async (topicId) => {
    setIsGenerating(true);
    try {
      const res = await adaptiveApi.generateSession({
        targetSubjectId: topicId,
        desiredQuestionCount: 15,
      });
      navigate(`/tests/${res.practiceSessionId}`);
    } catch (err) {
      navigate('/tests');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <RefreshCw className="h-8 w-8 text-blue-600 animate-spin" />
        <h3 className="text-slate-800 font-bold text-lg">Evaluating Real-Time Topic Performance</h3>
        <p className="text-slate-500 font-medium text-sm text-center max-w-md">
          Calculating topic accuracy, recent test performance, and negative mark vulnerability across all syllabus sections...
        </p>
      </div>
    );
  }

  const highPriority = data?.topics?.highPriority || data?.topics?.needsAttention?.filter(t => t.accuracy < 50 || t.weaknessScore >= 65) || [];
  const mediumPriority = data?.topics?.mediumPriority || data?.topics?.needsAttention?.filter(t => t.accuracy >= 50 && t.accuracy < 70 && t.weaknessScore < 65) || [];
  const improving = data?.topics?.improving || [];
  const strong = data?.topics?.strong || [];
  const totalTopicsTracked = data?.totalTopicsTracked || (highPriority.length + mediumPriority.length + improving.length + strong.length);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <Badge variant="purple" size="sm">AI Diagnostic Engine</Badge>
          <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight">
            Topic Weakness Diagnostic Profile
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl">
            Real-time evaluation of error rates, topic vulnerability, and negative mark risks across all syllabus sections.
          </p>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">High Priority</span>
            <span className="p-2 bg-rose-100 rounded-xl text-rose-700">
              <AlertTriangle className="h-4 w-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-rose-950 font-heading mt-2">{highPriority.length}</p>
          <p className="text-xs text-rose-700 mt-1 font-medium">&lt; 50% accuracy or high error rate</p>
        </div>

        <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Medium Priority</span>
            <span className="p-2 bg-amber-100 rounded-xl text-amber-700">
              <Target className="h-4 w-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-amber-950 font-heading mt-2">{mediumPriority.length}</p>
          <p className="text-xs text-amber-700 mt-1 font-medium">50%–70% accuracy (Needs Improvement)</p>
        </div>

        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Improving Topics</span>
            <span className="p-2 bg-blue-100 rounded-xl text-blue-700">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-blue-950 font-heading mt-2">{improving.length}</p>
          <p className="text-xs text-blue-700 mt-1 font-medium">Recent accuracy trending upward</p>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-5 relative overflow-hidden shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Mastered Strong</span>
            <span className="p-2 bg-emerald-100 rounded-xl text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
            </span>
          </div>
          <p className="text-3xl font-black text-emerald-950 font-heading mt-2">{strong.length}</p>
          <p className="text-xs text-emerald-700 mt-1 font-medium">&gt; 70% accuracy with low time taken</p>
        </div>
      </div>

      {/* Zero Attempt Empty State */}
      {totalTopicsTracked === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-10 text-center shadow-xs space-y-4 max-w-2xl mx-auto my-6">
          <div className="h-14 w-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto border border-indigo-100">
            <Target className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 font-heading">
            No Test Attempts Recorded Yet
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
            Your topic weakness profile is currently at zero. Complete at least one official CBT mock test or syllabus topic test to unlock real-time AI diagnostic analysis.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={() => navigate('/tests')}
              rightIcon={<ArrowRight className="h-4 w-4" />}
            >
              Start Your First Practice Test
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* 1. High Priority Weaknesses Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-rose-600" />
                <h2 className="text-xl font-bold text-slate-900 font-heading">High Priority Weak Topics</h2>
              </div>
              <span className="text-xs font-semibold text-slate-500">Immediate practice required</span>
            </div>

            {highPriority.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 font-medium">
                🎉 Great job! No critical high-priority weak topics identified.
              </div>
            ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {highPriority.map((t) => (
              <div
                key={t.topicId}
                className="bg-white rounded-2xl border border-rose-200/90 p-6 shadow-xs space-y-4 hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-0.5 rounded-md border border-rose-200">
                      {t.subjectName}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-1.5">{t.topicName}</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-rose-600 text-white text-[10px] font-black uppercase tracking-wider">
                    HIGH PRIORITY
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Overall Accuracy: <strong className="text-rose-700">{t.accuracy}%</strong></span>
                    <span>Recent: <strong className="text-slate-900">{t.recentAccuracy}%</strong></span>
                  </div>
                  <ProgressBar value={t.accuracy} color="rose" showPercentage={false} />
                </div>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1 font-medium">
                    <BookOpen className="h-3.5 w-3.5" />
                    {t.questionsAttempted} Questions Attempted
                  </span>
                  {t.avgTimeSeconds ? (
                    <span className="flex items-center gap-1 font-medium">
                      <Clock className="h-3.5 w-3.5" />
                      ~{t.avgTimeSeconds}s / question
                    </span>
                  ) : null}
                </div>

                <p className="text-xs text-rose-950 bg-rose-50/70 p-3 rounded-xl border border-rose-100 font-medium leading-relaxed">
                  <strong>Recommended Action:</strong> {t.recommendation}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="hover:bg-rose-50 hover:text-rose-700 hover:border-rose-300 font-bold"
                  onClick={() => handlePracticeTopic(t.topicId)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Practice This Topic
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Medium Priority (Needs Improvement) Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-amber-600" />
            <h2 className="text-xl font-bold text-slate-900 font-heading">Medium Priority (Needs Improvement)</h2>
          </div>
          <span className="text-xs font-semibold text-slate-500">50%–70% accuracy range</span>
        </div>

        {mediumPriority.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm font-medium">
            No topics in the medium priority range.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mediumPriority.map((t) => (
              <div
                key={t.topicId}
                className="bg-white rounded-2xl border border-amber-200/90 p-5 shadow-xs space-y-3 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">{t.subjectName}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{t.topicName}</h3>
                  </div>
                  <Badge variant="amber" size="sm">Medium</Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Accuracy: <strong>{t.accuracy}%</strong></span>
                    <span>Recent: <strong>{t.recentAccuracy}%</strong></span>
                  </div>
                  <ProgressBar value={t.accuracy} color="amber" showPercentage={false} />
                </div>

                <p className="text-xs text-slate-700 bg-amber-50/60 p-2.5 rounded-lg border border-amber-100 font-medium">
                  {t.recommendation}
                </p>

                <Button
                  variant="outline"
                  size="sm"
                  fullWidth
                  className="hover:bg-amber-50 hover:text-amber-800"
                  onClick={() => handlePracticeTopic(t.topicId)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Practice Topic
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Improving Topics Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">Improving Topics</h2>
        </div>

        {improving.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm font-medium">
            Topics with positive performance trajectory will appear here as you complete more tests.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {improving.map((t) => (
              <div
                key={t.topicId}
                className="bg-white rounded-2xl border border-blue-200/80 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">{t.subjectName}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{t.topicName}</h3>
                  </div>
                  <Badge variant="blue" size="sm">Improving</Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Overall: {t.accuracy}%</span>
                    <span className="text-emerald-600 font-bold">Recent: {t.recentAccuracy}%</span>
                  </div>
                  <ProgressBar value={t.recentAccuracy || t.accuracy} color="blue" showPercentage={false} />
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                  {t.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 4. Mastered Strong Areas Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-bold text-slate-900 font-heading">Mastered Strong Areas (&gt; 70% Accuracy)</h2>
        </div>

        {strong.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center text-slate-500 text-sm font-medium">
            Complete full mock tests and maintain &gt; 70% accuracy to earn strong topic mastery!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {strong.map((t) => (
              <div
                key={t.topicId}
                className="bg-white rounded-2xl border border-emerald-200/80 p-5 shadow-xs space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-xs text-slate-500 font-medium">{t.subjectName}</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5">{t.topicName}</h3>
                  </div>
                  <Badge variant="emerald" size="sm">Strong</Badge>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs font-medium text-slate-600">
                    <span>Accuracy: <strong>{t.accuracy}%</strong></span>
                    <span>{t.questionsAttempted} Solved</span>
                  </div>
                  <ProgressBar value={t.accuracy} color="emerald" showPercentage={false} />
                </div>

                <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100 font-medium">
                  {t.recommendation}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default WeaknessesPage;
