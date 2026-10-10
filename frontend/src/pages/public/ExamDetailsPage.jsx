import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  Clock, 
  HelpCircle, 
  Award, 
  CheckCircle2, 
  ArrowLeft, 
  Zap, 
  BookOpen, 
  CheckSquare, 
  ChevronRight,
  Layers,
  FileCheck,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { examApi } from '../../services/examApi';
import { testApi } from '../../services/testApi';
import { ExamPatternTable } from '../../components/exam/ExamPatternTable';
import { TestCard } from '../../components/test/TestCard';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState, LoadingState } from '../../components/common/FeedbackStates';
import { useAuth } from '../../context/AuthContext';

export const ExamDetailsPage = () => {
  const { isAuthenticated } = useAuth();
  const { slug } = useParams();
  const [activeTab, setActiveTab] = useState('stages');
  const [exam, setExam] = useState(null);
  const [examTests, setExamTests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    Promise.all([
      examApi.getExamBySlug(slug),
      testApi.getTests({ examSlug: slug }),
    ])
      .then(([examData, testsData]) => {
        if (examData) {
          setExam(examData);
          const filtered = testsData.filter((t) => t.examSlug === slug || t.examId === examData.id);
          setExamTests(filtered);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching exam details:', err);
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return <LoadingState message="Loading exam blueprint and syllabus..." fullPage />;
  }

  if (!exam) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          title="Exam Not Found"
          description="The requested examination details could not be found or has been moved."
          actionText="Back to All Exams"
          onAction={() => window.history.back()}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Back link */}
      <div>
        <Link
          to="/exams"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to All Exams</span>
        </Link>
      </div>

      {/* Guest Locked Notice Banner */}
      {!isAuthenticated && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3.5">
            <div className="h-11 w-11 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300/80">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-amber-900">Examination is currently in Locked Stage</h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Sign in to GovPrep to unlock full CBT test interfaces, stage simulators, and topic-level analytics.
              </p>
            </div>
          </div>
          <Link to="/login" className="shrink-0 w-full sm:w-auto">
            <Button size="md" variant="primary" leftIcon={<Lock className="h-4 w-4" />} className="w-full sm:w-auto">
              Login to Unlock
            </Button>
          </Link>
        </div>
      )}

      {/* 1. EXAM HEADER BANNER */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-6 sm:p-10 shadow-xs relative overflow-hidden">
        <div className="max-w-3xl space-y-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <Badge variant="blue" size="md">
              {exam.category}
            </Badge>
            {!isAuthenticated && (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-800 bg-amber-100/90 border border-amber-300/80 px-3 py-1 rounded-full">
                <Lock className="h-3.5 w-3.5" /> Locked Stage
              </span>
            )}
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 font-heading tracking-tight flex items-center gap-3 flex-wrap">
            <span>{exam.name}</span>
            {!isAuthenticated && <Lock className="h-6 w-6 text-amber-600 shrink-0" />}
          </h1>
          <p className="text-base sm:text-lg font-semibold text-slate-600">{exam.fullName}</p>
          <p className="text-base text-slate-600 leading-relaxed">
            {exam.shortDescription}
          </p>

          {/* Quick Metrics */}
          {exam.slug === 'ibps-po' ? (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-blue-600" />
                <span><strong>210 Mins</strong> Standard (180 Mins Objective + 30 Mins Descriptive)</span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-600" />
                <span><strong>157 Qs</strong> (155 Objective + 2 Descriptive)</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-amber-600" />
                <span><strong>225 Marks</strong> (200 Objective + 25 Descriptive)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-rose-600" />
                <span>Negative: <strong>-0.25 Marks (1/4th)</strong> for objective, None for descriptive</span>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-4 sm:gap-6 pt-2 text-sm font-medium text-slate-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4.5 w-4.5 text-blue-600" />
                <span><strong>{exam.durationMinutes}</strong> Minutes Standard</span>
              </div>
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4.5 w-4.5 text-indigo-600" />
                <span><strong>{exam.totalQuestions}</strong> Questions</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="h-4.5 w-4.5 text-amber-600" />
                <span><strong>{exam.totalMarks}</strong> Marks</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4.5 w-4.5 text-rose-600" />
                <span>Negative: <strong>{exam.negativeMarking?.includes('1/3') || exam.negativeMarking?.includes('0.33') ? '1/3 mark' : exam.negativeMarking}</strong></span>
              </div>
            </div>
          )}

          <div className="pt-4 flex flex-wrap items-center gap-3">
            {!isAuthenticated ? (
              <Link to="/login">
                <Button size="lg" variant="primary" leftIcon={<Lock className="h-4 w-4" />}>
                  Login to Unlock Exam & Tests
                </Button>
              </Link>
            ) : (
              <button
                type="button"
                onClick={() => setActiveTab('stages')}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors shadow-sm cursor-pointer"
              >
                <Zap className="h-5 w-5" />
                <span>Choose Exam Stage & Start</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setActiveTab('syllabus')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-slate-300 text-base font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
            >
              <BookOpen className="h-4.5 w-4.5 text-slate-500" />
              <span>Browse Syllabus</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex items-center gap-6 sm:gap-8 text-base font-bold overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('stages')}
          className={`pb-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'stages'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Layers className="h-5 w-5" />
          Examination Stages ({exam.stages?.length || 1})
        </button>
        <button
          onClick={() => setActiveTab('syllabus')}
          className={`pb-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'syllabus'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          Syllabus & Topics
        </button>
        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileCheck className="h-5 w-5" />
          All Mock Tests ({examTests.length})
        </button>
        <button
          onClick={() => setActiveTab('pattern')}
          className={`pb-4 border-b-2 transition-colors cursor-pointer flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'pattern'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="h-5 w-5" />
          Marking Scheme
        </button>
      </div>

      {/* TAB 1: EXAMINATION STAGES SELECTION */}
      {activeTab === 'stages' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Supported Examination Stages</h2>
            <p className="text-sm text-slate-500 mt-1">
              Select your target examination stage to launch an authentic, calibrated CBT mock test adhering to official notification blueprints.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {exam.stages && exam.stages.length > 0 ? (
              exam.stages.map((stage) => {
                const stageTest =
                  examTests.find((t) => t.stageId === stage.id && (t.type === 'Full Mock' || t.rawType === 'FULL_MOCK')) ||
                  examTests.find((t) => t.stageId === stage.id) ||
                  examTests[0];
                return (
                  <div
                    key={stage.id}
                    className="bg-white rounded-2xl border-2 border-slate-200/90 hover:border-blue-500 transition-all p-6 sm:p-7 shadow-xs flex flex-col justify-between group"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-100 text-blue-800">
                          <Layers className="h-3.5 w-3.5" />
                          {stage.name}
                        </span>
                        {stage.isScreening && (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full">
                            Screening Stage
                          </span>
                        )}
                        {stage.isMerit && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                            Merit Scoring Stage
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="text-2xl font-extrabold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {stage.paperName || stage.name}
                        </h3>
                        <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">
                          {stage.description || `Official CBT test structure for ${exam.name} ${stage.name}.`}
                        </p>
                      </div>

                      {/* Specs Matrix */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70 text-center">
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Questions</span>
                          <p className="text-base font-extrabold text-slate-900">{stage.totalQuestions} Qs</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Duration</span>
                          <p className="text-base font-extrabold text-slate-900">{stage.durationMinutes} Mins</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Marks</span>
                          <p className="text-base font-extrabold text-slate-900">{stage.totalMarks} Marks</p>
                        </div>
                        <div className="space-y-0.5">
                          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Negative</span>
                          <p className="text-base font-extrabold text-rose-600">-{stage.negativeMarks} Mark</p>
                        </div>
                      </div>

                      {/* Scribe note if applicable */}
                      {stage.scribeDurationMinutes && (
                        <p className="text-xs text-slate-500 flex items-center gap-1.5">
                          <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>PwBD Candidates accompanied by Scribe: <strong>{stage.scribeDurationMinutes} Minutes</strong></span>
                        </p>
                      )}

                      {/* Section breakdown */}
                      {stage.sections && stage.sections.length > 0 && (
                        <div className="space-y-2 pt-2 border-t border-slate-100">
                          <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Official Component Breakdown
                          </span>
                          <div className="space-y-2">
                            {stage.sections.map((sec) => {
                              // Multi-paper stages (such as APPSC Mains) have standalone test papers per component.
                              // Single-session exams like RRB NTPC, RRB JE, and IBPS PO are taken as complete mock stages.
                              const isMultiPaperSection = 
                                !['rrb-ntpc', 'rrb-je', 'ibps-po', 'rrb-group-d'].includes(exam.slug?.toLowerCase()) &&
                                ['ESSAY', 'PAPER_1', 'PAPER_2'].includes(sec.code);

                              const matchingTest = isMultiPaperSection
                                ? examTests.find(
                                    (t) =>
                                      t.stageId === stage.id &&
                                      t.slug?.includes(sec.code?.toLowerCase().replace(/_/g, '-'))
                                  )
                                : null;
                              return (
                                <div
                                  key={sec.id}
                                  className="flex flex-col sm:flex-row sm:items-center justify-between text-xs sm:text-sm bg-slate-100/70 p-3 rounded-xl gap-2 border border-slate-200/50"
                                >
                                  <div>
                                    <span className="font-bold text-slate-800 block">{sec.name}</span>
                                    <span className="text-[11px] text-slate-500 font-medium">
                                      {sec.questionCount} {sec.questionType === 'DESCRIPTIVE_ESSAY' || sec.code?.includes('DESCRIPTIVE') ? (sec.questionCount === 1 ? 'Descriptive Prompt' : 'Descriptive Prompts') : 'Questions'} • {sec.durationMinutes ? `${sec.durationMinutes} Mins` : ''} • {sec.totalMarks ? `${sec.totalMarks} Marks` : ''}
                                      {sec.negativeMarks > 0 ? ` • -${sec.negativeMarks} Neg` : ' • Qualifying'}
                                    </span>
                                  </div>
                                  {matchingTest && (
                                    <div className="shrink-0 self-end sm:self-center">
                                      {!isAuthenticated ? (
                                        <Link to="/login">
                                          <Button size="xs" variant="outline" className="text-amber-800 border-amber-300">
                                            Login
                                          </Button>
                                        </Link>
                                      ) : (
                                        <Link to={`/tests/${matchingTest.slug || matchingTest.id}/instructions`}>
                                          <Button size="xs" variant="primary" rightIcon={<Zap className="h-3 w-3 fill-current" />}>
                                            Start {sec.code === 'ESSAY' ? 'Essay' : sec.code === 'PAPER_1' ? 'Paper 1' : sec.code === 'PAPER_2' ? 'Paper 2' : 'Test'}
                                          </Button>
                                        </Link>
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Notification metadata */}
                      {stage.notificationReference && (
                        <div className="text-[11px] text-slate-500 pt-1">
                          Source Reference: <span className="font-semibold text-slate-700">{stage.notificationReference} ({stage.notificationYear})</span>
                        </div>
                      )}
                    </div>

                    {/* Launch CTA */}
                    <div className="pt-6 border-t border-slate-100 mt-6 flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-500">
                        {stage.language}
                      </span>
                      {!isAuthenticated ? (
                        <Link to="/login">
                          <Button size="md" variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-50" leftIcon={<Lock className="h-4 w-4" />}>
                            Login to Unlock Mock
                          </Button>
                        </Link>
                      ) : (
                        <Link to={`/tests/${stageTest?.slug || stageTest?.id || 'rrb-ntpc-cbt1-mock-01'}/instructions`}>
                          <Button size="lg" variant="primary" rightIcon={<Zap className="h-4 w-4 fill-current" />}>
                            Start {stage.name} Mock
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-full">
                <EmptyState
                  title="Stages being configured"
                  description="Detailed stages for this examination are being finalized."
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* 2. SYLLABUS TAB */}
      {activeTab === 'syllabus' && (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Detailed Section-wise Syllabus</h2>
            <p className="text-sm text-slate-500 mt-1">
              Curated topic list based on official {exam.name} recruitment notifications.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {exam.sections.map((section) => (
              <div
                key={section.id}
                className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3.5 mb-4">
                    <h3 className="text-lg font-bold text-slate-900">{section.name}</h3>
                    {section.questionsCount && (
                      <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md">
                        {section.questionsCount} Qs
                      </span>
                    )}
                  </div>

                  <ul className="space-y-3">
                    {section.topics.map((topic) => (
                      <li key={topic.id} className="flex items-center gap-2.5 text-sm text-slate-700">
                        <span className="h-1.5 w-1.5 rounded-full bg-blue-600 shrink-0" />
                        <span className="font-medium">{topic.name}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6 border-t border-slate-100 mt-6">
                  <Link to="/tests">
                    <Button size="md" variant="ghost" fullWidth rightIcon={<ChevronRight className="h-4 w-4" />}>
                      Practice {section.name}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {exam.eligibility && (
            <div className="bg-slate-100/80 p-5 rounded-xl border border-slate-200 text-sm text-slate-700">
              <strong className="text-slate-900">Eligibility Criteria:</strong> {exam.eligibility}
            </div>
          )}
        </div>
      )}

      {/* 3. AVAILABLE TESTS TAB */}
      {activeTab === 'tests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Available Tests for {exam.name}</h2>
              <p className="text-xs text-slate-500 mt-1">Full Mocks, Sectional Speeds, and Stage-Calibrated Tests.</p>
            </div>
          </div>

          {examTests.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {examTests.map((t) => (
                <TestCard key={t.id} test={t} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No specific tests yet"
              description="New mock tests for this exam category are being published weekly by our editorial team."
              actionText="Browse All Tests"
              onAction={() => setActiveTab('stages')}
            />
          )}
        </div>
      )}

      {/* 4. EXAM PATTERN TAB */}
      {activeTab === 'pattern' && (
        <div className="space-y-6 max-w-3xl">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Official Exam Pattern & Marking Scheme</h2>
            <p className="text-xs text-slate-500 mt-1">
              Verify question weightage, negative scoring penalty, and test duration.
            </p>
          </div>

          <ExamPatternTable pattern={exam.pattern} />
        </div>
      )}
    </div>
  );
};
