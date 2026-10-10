import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { ShieldCheck, Maximize2, Minimize2, AlertCircle, Clock, Lock, AlertTriangle } from 'lucide-react';
import { testApi } from '../../services/testApi';
import { TimerBadge } from '../../components/test/TimerBadge';
import { SectionTabs } from '../../components/test/SectionTabs';
import { QuestionPanel } from '../../components/test/QuestionPanel';
import { OptionList } from '../../components/test/OptionList';
import { DescriptiveAnswerEditor } from '../../components/test/DescriptiveAnswerEditor';
import { QuestionPalette } from '../../components/test/QuestionPalette';
import { ActionBar } from '../../components/test/ActionBar';
import { SubmitDialog } from '../../components/test/SubmitDialog';
import { LoadingState, EmptyState } from '../../components/common/FeedbackStates';

export const MockTestPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const containerRef = useRef(null);
  const [test, setTest] = useState(null);
  const [attemptId, setAttemptId] = useState('');
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [expiresAt, setExpiresAt] = useState(null);
  const [sectionExpiresAt, setSectionExpiresAt] = useState(null);
  const [serverTime, setServerTime] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [activeSectionId, setActiveSectionId] = useState('');
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [fullscreenNotice, setFullscreenNotice] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [cursorWarningSeconds, setCursorWarningSeconds] = useState(0);
  const [autoSubmitMessage, setAutoSubmitMessage] = useState(null);
  const [sectionNotification, setSectionNotification] = useState(null);

  const isSubmittingRef = useRef(false);
  const tabSwitchingRef = useRef(false);
  const hasAttemptedFullscreenRef = useRef(false);
  const cursorWarningTimerRef = useRef(null);

  // Timer interval for total time elapsed
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Listen to fullscreen changes across the document
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Request fullscreen function
  const requestContainerFullscreen = () => {
    const targetElement = containerRef.current || document.documentElement;
    if (targetElement && !document.fullscreenElement) {
      targetElement
        .requestFullscreen()
        .then(() => {
          setIsFullscreen(true);
          setFullscreenNotice(null);
        })
        .catch((err) => {
          console.warn('Auto-fullscreen prevented by browser policy:', err);
          setFullscreenNotice('Fullscreen could not be enabled automatically. Click the Maximize icon anytime.');
          setTimeout(() => setFullscreenNotice(null), 5000);
        });
    }
  };

  // Toggle fullscreen mode manually
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      requestContainerFullscreen();
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // Load test details and start / resume attempt
  useEffect(() => {
    if (id) {
      const debugDurationSeconds = location.state?.debugDurationSeconds;
      const forceNew = location.state?.forceNew === true || new URLSearchParams(location.search).get('retake') === 'true';
      testApi.startTest(id, { debugDurationSeconds, forceNew }).then(async (data) => {
        // If attempt has already ended or expired, immediately redirect to results
        if (data.isCompleted || data.isExpired) {
          setAutoSubmitMessage(data.message || 'Time is up. Your exam has been automatically submitted.');
          setTimeout(() => {
            navigate(`/results/${data.attemptId}`);
          }, 1200);
          return;
        }

        if (data.test) {
          setTest(data.test);
          setAttemptId(data.attemptId);
          setAttemptNumber(data.attemptNumber || 1);
          setExpiresAt(data.expiresAt || null);
          setSectionExpiresAt(data.sectionExpiresAt || null);
          setServerTime(data.serverTime || null);
          setQuestions(data.questions);
          setTabSwitchCount(data.tabSwitchCount || 0);

          // Store active attempt ID in session storage for refresh resilience
          sessionStorage.setItem(`active_attempt_${id}`, data.attemptId);

          // Initialize sections
          if (data.currentSectionId) {
            setActiveSectionId(data.currentSectionId);
            setActiveSectionIndex(data.currentSectionIndex ?? 0);
          } else if (data.test.sections && data.test.sections.length > 0) {
            setActiveSectionId(data.test.sections[0].id);
            setActiveSectionIndex(0);
          } else if (data.questions.length > 0) {
            setActiveSectionId(data.questions[0].sectionId);
            setActiveSectionIndex(0);
          }

          // If attempt is resumed, load saved answers and server section state
          let savedAnswersMap = {};
          if (data.isResumed && data.attemptId) {
            try {
              const state = await testApi.getAttemptState(data.attemptId);
              if (state) {
                if (state.isCompleted || state.isExpired) {
                  setAutoSubmitMessage('Time is up. Your exam has been automatically submitted.');
                  setTimeout(() => {
                    navigate(`/results/${data.attemptId}`);
                  }, 1200);
                  return;
                }
                if (state.serverTime) setServerTime(state.serverTime);
                if (state.expiresAt) setExpiresAt(state.expiresAt);
                if (state.savedAnswers) savedAnswersMap = state.savedAnswers;
                if (state.sectionExpiresAt) setSectionExpiresAt(state.sectionExpiresAt);
                if (state.currentSectionId) setActiveSectionId(state.currentSectionId);
                if (state.currentSectionIndex !== undefined) setActiveSectionIndex(state.currentSectionIndex);
              }
            } catch (err) {
              console.warn('Could not load saved answers on resume:', err);
            }
          }

          // Initialize answer states
          const initialAnswers = {};
          data.questions.forEach((q, idx) => {
            const existing = savedAnswersMap[q.id];
            const hasAnswer = Boolean(existing?.selectedOption || (existing?.textAnswer && existing.textAnswer.trim().length > 0));
            if (existing) {
              initialAnswers[q.id] = {
                selectedOption: existing.selectedOption || null,
                textAnswer: existing.textAnswer || '',
                status: existing.status || (hasAnswer ? 'answered' : 'not-answered'),
                isMarkedForReview: existing.status === 'marked-review' || existing.status === 'answered-marked',
                timeSpentSeconds: existing.timeSpentSeconds || 0,
              };
            } else {
              initialAnswers[q.id] = {
                selectedOption: null,
                textAnswer: '',
                status: idx === 0 ? 'not-answered' : 'not-visited',
                isMarkedForReview: false,
                timeSpentSeconds: 0,
              };
            }
          });
          setUserAnswers(initialAnswers);
        }
        setLoading(false);
      }).catch((err) => {
        console.error('Failed to start test session:', err);
        setLoading(false);
      });
    }
  }, [id, location.state, location.search, navigate]);

  // Attempt auto-fullscreen once data is loaded
  useEffect(() => {
    if (!loading && test && !hasAttemptedFullscreenRef.current) {
      hasAttemptedFullscreenRef.current = true;
      // Slight delay to allow DOM to render
      const timer = setTimeout(() => {
        requestContainerFullscreen();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [loading, test]);

  // Tab switch / visibility change detection with backend sync
  useEffect(() => {
    if (!attemptId || isSubmittingRef.current || loading) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden') {
        if (isSubmittingRef.current || tabSwitchingRef.current) return;
        tabSwitchingRef.current = true;

        try {
          const res = await testApi.recordTabSwitch(attemptId);
          const currentCount = res.tabSwitchCount;
          setTabSwitchCount(currentCount);

          if (res.shouldSubmit || currentCount >= 2) {
            // Second tab switch -> Auto-submit
            setAutoSubmitMessage('The exam was automatically submitted because you switched away from the exam window twice.');
            setTimeout(() => {
              handleSubmitWithReason('TAB_SWITCH');
            }, 1200);
          } else {
            // First tab switch -> Show warning for ~1 second
            setShowTabWarning(true);
            setTimeout(() => {
              setShowTabWarning(false);
              tabSwitchingRef.current = false;
            }, 1000);
          }
        } catch (err) {
          console.warn('Error recording tab switch:', err);
          tabSwitchingRef.current = false;
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [attemptId, loading]);

  // Trigger cursor exit warning for 10 seconds
  const triggerCursorExitWarning = () => {
    if (isSubmittingRef.current || loading) return;

    setCursorWarningSeconds(10);

    if (cursorWarningTimerRef.current) {
      clearInterval(cursorWarningTimerRef.current);
    }

    cursorWarningTimerRef.current = setInterval(() => {
      setCursorWarningSeconds((prev) => {
        if (prev <= 1) {
          if (cursorWarningTimerRef.current) {
            clearInterval(cursorWarningTimerRef.current);
            cursorWarningTimerRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Listen for cursor leaving the window / document
  useEffect(() => {
    if (loading || !attemptId) return;

    const handleMouseLeave = (e) => {
      // Check if mouse left the document viewport
      if (!e.relatedTarget && (e.clientY <= 0 || e.clientX <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight)) {
        triggerCursorExitWarning();
      }
    };

    const handleWindowBlur = () => {
      if (document.visibilityState === 'visible') {
        triggerCursorExitWarning();
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('blur', handleWindowBlur);
      if (cursorWarningTimerRef.current) {
        clearInterval(cursorWarningTimerRef.current);
      }
    };
  }, [loading, attemptId]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = currentQuestion && userAnswers[currentQuestion.id]
    ? userAnswers[currentQuestion.id]
    : { selectedOption: null, textAnswer: '', status: 'not-visited', isMarkedForReview: false, timeSpentSeconds: 0 };

  // Current active section metadata
  const currentSection = test?.sections ? test.sections[activeSectionIndex] : null;
  const isSectionTiming = !!test?.sectionTiming;

  // Autosave answer helper (handles both MCQ options and descriptive essay text)
  const triggerAutosave = (qId, opt, status, timeSpent, textAns) => {
    if (attemptId && qId && !isSubmittingRef.current && !autoSubmitMessage) {
      testApi.autosaveAnswer(attemptId, {
        questionId: qId,
        selectedOption: opt,
        textAnswer: textAns,
        status,
        timeSpentSeconds: timeSpent,
      });
    }
  };

  // Select an option (A, B, C, D)
  const handleSelectOption = (optionId) => {
    if (!currentQuestion || isSubmittingRef.current || autoSubmitMessage) return;
    setUserAnswers((prev) => {
      const isMarked = prev[currentQuestion.id]?.isMarkedForReview || false;
      const nextStatus = isMarked ? 'answered-marked' : 'answered';
      const updated = {
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          selectedOption: optionId,
          status: nextStatus,
        },
      };

      triggerAutosave(currentQuestion.id, optionId, nextStatus, updated[currentQuestion.id].timeSpentSeconds, prev[currentQuestion.id]?.textAnswer);
      return updated;
    });
  };

  // Descriptive Essay text answer change handler
  const handleTextAnswerChange = (text) => {
    if (!currentQuestion || isSubmittingRef.current || autoSubmitMessage) return;
    const hasContent = Boolean(text && text.trim().length > 0);
    const nextStatus = hasContent ? 'answered' : 'not-answered';
    setUserAnswers((prev) => {
      const updated = {
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          textAnswer: text,
          status: nextStatus,
        },
      };

      triggerAutosave(currentQuestion.id, null, nextStatus, updated[currentQuestion.id]?.timeSpentSeconds || 0, text);
      return updated;
    });
  };

  // Clear current response
  const handleClearResponse = () => {
    if (!currentQuestion || isSubmittingRef.current || autoSubmitMessage) return;
    setUserAnswers((prev) => {
      const isMarked = prev[currentQuestion.id]?.isMarkedForReview || false;
      const nextStatus = isMarked ? 'marked-review' : 'not-answered';
      const updated = {
        ...prev,
        [currentQuestion.id]: {
          ...prev[currentQuestion.id],
          selectedOption: null,
          textAnswer: '',
          status: nextStatus,
        },
      };

      triggerAutosave(currentQuestion.id, null, nextStatus, updated[currentQuestion.id].timeSpentSeconds, '');
      return updated;
    });
  };

  // Mark / Unmark for Review
  const handleMarkReview = () => {
    if (!currentQuestion || isSubmittingRef.current || autoSubmitMessage) return;
    setUserAnswers((prev) => {
      const current = prev[currentQuestion.id];
      const nextMarked = !current.isMarkedForReview;
      let nextStatus = 'not-answered';

      if (nextMarked) {
        nextStatus = current.selectedOption ? 'answered-marked' : 'marked-review';
      } else {
        nextStatus = current.selectedOption ? 'answered' : 'not-answered';
      }

      const updated = {
        ...prev,
        [currentQuestion.id]: {
          ...current,
          isMarkedForReview: nextMarked,
          status: nextStatus,
        },
      };

      triggerAutosave(currentQuestion.id, current.selectedOption, nextStatus, current.timeSpentSeconds);
      return updated;
    });
  };

  // Save & Next
  const handleSaveAndNext = () => {
    if (isSubmittingRef.current || autoSubmitMessage) return;
    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      const nextQ = questions[nextIndex];

      // In sectional timing exams, prevent navigating into other sections
      if (isSectionTiming && nextQ.sectionId !== activeSectionId) {
        return;
      }

      setUserAnswers((prev) => {
        if (prev[nextQ.id]?.status === 'not-visited') {
          return {
            ...prev,
            [nextQ.id]: {
              ...prev[nextQ.id],
              status: 'not-answered',
            },
          };
        }
        return prev;
      });

      setCurrentQuestionIndex(nextIndex);
      if (nextQ.sectionId) {
        setActiveSectionId(nextQ.sectionId);
      }
    }
  };

  // Previous question
  const handlePrevious = () => {
    if (isSubmittingRef.current || autoSubmitMessage) return;
    if (currentQuestionIndex > 0) {
      const prevIndex = currentQuestionIndex - 1;
      const prevQ = questions[prevIndex];

      // In sectional timing exams, prevent navigating into previous section
      if (isSectionTiming && prevQ.sectionId !== activeSectionId) {
        return;
      }

      setCurrentQuestionIndex(prevIndex);
      if (prevQ.sectionId) {
        setActiveSectionId(prevQ.sectionId);
      }
    }
  };

  // Direct Jump from Palette
  const handleJumpToQuestion = (targetIndex) => {
    if (isSubmittingRef.current || autoSubmitMessage) return;
    if (targetIndex >= 0 && targetIndex < questions.length) {
      const targetQ = questions[targetIndex];

      // In sectional timing exams, candidate cannot jump to a question outside the active section
      if (isSectionTiming && targetQ.sectionId !== activeSectionId) {
        return;
      }

      setUserAnswers((prev) => {
        if (prev[targetQ.id]?.status === 'not-visited') {
          return {
            ...prev,
            [targetQ.id]: {
              ...prev[targetQ.id],
              status: 'not-answered',
            },
          };
        }
        return prev;
      });

      setCurrentQuestionIndex(targetIndex);
      if (targetQ.sectionId) {
        setActiveSectionId(targetQ.sectionId);
      }
    }
  };

  // Section Switcher
  const handleSelectSection = (secId) => {
    if (isSubmittingRef.current || autoSubmitMessage) return;
    // In sectional timing exams, candidate cannot manually jump between sections
    if (isSectionTiming) {
      return;
    }
    setActiveSectionId(secId);
    const firstQIndex = questions.findIndex((q) => q.sectionId === secId);
    if (firstQIndex !== -1) {
      handleJumpToQuestion(firstQIndex);
    }
  };

  // Generic Submit handler with reason tracking
  const handleSubmitWithReason = async (reason) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const res = await testApi.submitAttempt({
        testId: id || test?.id,
        attemptId,
        answers: userAnswers,
        timeSpentSeconds: elapsedSeconds,
        autoSubmitReason: reason,
      });
      setIsSubmitting(false);
      setIsSubmitDialogOpen(false);
      sessionStorage.removeItem(`active_attempt_${id}`);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      navigate(`/results/${res.attemptId}`);
    } catch (err) {
      setIsSubmitting(false);
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      navigate(`/results/${attemptId || 'att-mock-fallback'}`);
    }
  };

  // Manual submission confirmation
  const handleConfirmSubmit = () => {
    handleSubmitWithReason('MANUAL');
  };

  // Handle section timer or overall timer expiration
  const handleTimeUp = async () => {
    if (isSectionTiming && test?.sections && activeSectionIndex < test.sections.length - 1) {
      // Transition to next section via server submitSection
      const currentSec = test.sections[activeSectionIndex];
      const nextSec = test.sections[activeSectionIndex + 1];
      setSectionNotification(`Time is over for ${currentSec?.name || 'current section'}. Submitting section and unlocking ${nextSec?.name}...`);

      try {
        const secRes = await testApi.submitSection(attemptId, {
          answers: userAnswers,
          timeSpentSeconds: elapsedSeconds,
        });

        if (secRes && secRes.sectionExpiresAt) {
          setSectionExpiresAt(secRes.sectionExpiresAt);
        }
      } catch (err) {
        console.warn('Error during section transition:', err);
      }

      setTimeout(() => {
        setSectionNotification(null);
        const nextSecIndex = activeSectionIndex + 1;
        setActiveSectionIndex(nextSecIndex);
        setActiveSectionId(nextSec.id);
        const firstQIndex = questions.findIndex((q) => q.sectionId === nextSec.id);
        if (firstQIndex !== -1) {
          handleJumpToQuestion(firstQIndex);
        }
      }, 1500);
    } else {
      // Auto-submit whole test due to time expiration
      setAutoSubmitMessage('Time is up. Your exam has been automatically submitted.');
      setTimeout(() => {
        handleSubmitWithReason('TIME_EXPIRED');
      }, 1200);
    }
  };

  if (loading) {
    return <LoadingState message="Initializing online examination simulator..." fullPage />;
  }

  if (!test || questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          title="Questions could not be loaded"
          description="Please check your test configuration or choose another exam."
          actionText="Back to Test Catalog"
          onAction={() => navigate('/tests')}
        />
      </div>
    );
  }

  // Filter palette items for active section if sectionTiming is enabled
  const paletteItems = questions.map((q, idx) => ({
    number: idx + 1,
    questionId: q.id,
    status: userAnswers[q.id]?.status || 'not-visited',
    isLocked: isSectionTiming && q.sectionId !== activeSectionId,
  }));

  const answeredCount = Object.values(userAnswers).filter(
    (a) => a.status === 'answered' || a.status === 'answered-marked'
  ).length;

  const notAnsweredCount = Object.values(userAnswers).filter(
    (a) => a.status === 'not-answered'
  ).length;

  const markedReviewCount = Object.values(userAnswers).filter(
    (a) => a.status === 'marked-review' || a.status === 'answered-marked'
  ).length;

  const notVisitedCount = Object.values(userAnswers).filter(
    (a) => a.status === 'not-visited'
  ).length;

  // Section Duration for active section
  const activeSectionMinutes = isSectionTiming
    ? currentSection?.durationMinutes || Math.floor((test.durationMinutes || 60) / (test.sections?.length || 3))
    : test.durationMinutes || 90;

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-screen bg-slate-100 overflow-hidden select-none font-sans relative"
    >
      {/* Tab Switch First Warning Floating Banner (approx 1s) */}
      {showTabWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce transition-all duration-300 pointer-events-none">
          <div className="bg-amber-600 text-white px-6 py-3.5 rounded-2xl shadow-2xl flex items-center gap-3.5 border-2 border-amber-300 max-w-lg">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-200 animate-pulse" />
            <div>
              <p className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-amber-100">
                ⚠ Tab Switch Warning (1 of 2)
              </p>
              <p className="text-xs font-semibold text-white mt-0.5">
                You left the exam window. One more tab switch will automatically submit your exam.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cursor Left Exam Window Warning (10 seconds) */}
      {cursorWarningSeconds > 0 && !showTabWarning && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 animate-bounce transition-all duration-300 pointer-events-none">
          <div className="bg-rose-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 border-2 border-rose-300 max-w-lg">
            <AlertTriangle className="h-7 w-7 shrink-0 text-rose-200 animate-pulse" />
            <div>
              <div className="flex items-center justify-between gap-3">
                <p className="font-extrabold text-xs sm:text-sm uppercase tracking-wider text-rose-100">
                  ⚠ Warning: Cursor Left Exam Area
                </p>
                <span className="text-xs bg-rose-800/90 px-2.5 py-0.5 rounded-full font-mono font-bold border border-rose-400/50">
                  {cursorWarningSeconds}s
                </span>
              </div>
              <p className="text-xs font-medium text-white mt-1">
                Please keep your mouse cursor inside the examination window throughout the test.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Fullscreen Notice (if auto-fullscreen was restricted) */}
      {fullscreenNotice && (
        <div className="absolute top-16 right-4 z-40 bg-slate-900/90 text-slate-200 text-xs px-4 py-2.5 rounded-xl border border-slate-700 shadow-lg flex items-center gap-2">
          <span>{fullscreenNotice}</span>
        </div>
      )}

      {/* Auto Submit Notification Overlay */}
      {autoSubmitMessage && (
        <div className="absolute inset-0 bg-slate-900/85 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center space-y-4 shadow-2xl border border-blue-200">
            <div className="h-14 w-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="h-8 w-8 animate-pulse" />
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">Exam Automatically Submitted</h3>
            <p className="text-sm font-semibold text-slate-600">{autoSubmitMessage}</p>
            <div className="text-xs text-blue-600 font-bold animate-pulse">
              Compiling and saving your answers to server...
            </div>
          </div>
        </div>
      )}

      {/* Section Transition Overlay */}
      {sectionNotification && (
        <div className="absolute inset-0 bg-slate-900/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-3 shadow-xl border border-blue-300">
            <div className="h-12 w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
              <Clock className="h-6 w-6 animate-spin" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Section Time Completed</h3>
            <p className="text-sm text-slate-600 font-medium">{sectionNotification}</p>
          </div>
        </div>
      )}

      {/* 1. TOP EXAMINATION BANNER (TCS iON CBT Style) */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-white shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold truncate max-w-xs sm:max-w-md flex items-center gap-2">
              <span>{test.title}</span>
              <span className="text-[10px] font-extrabold bg-blue-500/30 text-blue-300 border border-blue-400/40 px-2 py-0.5 rounded-full">
                Attempt #{attemptNumber}
              </span>
            </h1>
            <p className="text-[11px] text-slate-400 flex items-center gap-1.5">
              {test.stageName ? `${test.stageName} • ` : ''}
              {isSectionTiming ? (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Sectional Timer: {currentSection?.name || 'Active Section'}
                </span>
              ) : (
                'GovPrep CBT Server Timer'
              )}
            </p>
          </div>
        </div>

        {/* Center Countdown Timer (HH:MM:SS) */}
        <div className="flex items-center gap-4">
          <TimerBadge
            key={`timer_${activeSectionId}_${sectionExpiresAt || expiresAt}`}
            initialMinutes={activeSectionMinutes}
            expiresAt={isSectionTiming ? (sectionExpiresAt || expiresAt) : expiresAt}
            serverTime={serverTime}
            onTimeUp={handleTimeUp}
          />

          {/* Fullscreen Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer hidden sm:block"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* 2. SECTION TABS BAR */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between shadow-xs shrink-0">
        <SectionTabs
          sections={test.sections || [{ id: 'general', name: 'General Section', questionsCount: questions.length }]}
          activeSectionId={activeSectionId}
          onSelectSection={handleSelectSection}
          sectionTiming={isSectionTiming}
        />
        <div className="text-xs font-semibold text-slate-500 hidden md:block">
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      </div>

      {/* 3. MAIN SPLIT VIEW (Question Panel + Palette Sidebar) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Question & Options Viewport */}
        <main className="flex-1 flex flex-col bg-white overflow-y-auto border-r border-slate-200 p-6 sm:p-8">
          {currentQuestion && (
            <div className="max-w-3xl space-y-6">
              <QuestionPanel
                question={currentQuestion}
                questionNumber={currentQuestionIndex + 1}
                totalQuestions={questions.length}
                marksPerCorrect={currentSection?.marksPerQuestion ?? currentQuestion.marksPerCorrect ?? test.marksPerCorrect ?? 1.0}
                negativeMarks={currentSection?.negativeMarks ?? currentQuestion.negativeMarks ?? test.negativeMarkingPerQuestion ?? 0.33}
              />

              {currentQuestion.questionType === 'DESCRIPTIVE_ESSAY' || test.type === 'DESCRIPTIVE' || test.rawType === 'DESCRIPTIVE' ? (
                <DescriptiveAnswerEditor
                  question={currentQuestion}
                  value={currentAnswer.textAnswer || ''}
                  onChange={handleTextAnswerChange}
                  disabled={isSubmitting || !!autoSubmitMessage}
                />
              ) : (
                <OptionList
                  options={currentQuestion.options}
                  selectedOption={currentAnswer.selectedOption}
                  onSelectOption={handleSelectOption}
                  disabled={isSubmitting || !!autoSubmitMessage}
                />
              )}
            </div>
          )}
        </main>

        {/* Right: Question Palette Sidebar */}
        <aside className="w-80 bg-slate-50 flex flex-col shrink-0 overflow-y-auto p-4 space-y-4 border-l border-slate-200">
          <QuestionPalette
            items={paletteItems}
            currentIndex={currentQuestionIndex}
            onSelectQuestion={handleJumpToQuestion}
          />
        </aside>
      </div>

      {/* 4. BOTTOM ACTION CONTROL BAR */}
      <ActionBar
        onMarkForReview={handleMarkReview}
        onClearResponse={handleClearResponse}
        onPrevious={handlePrevious}
        onSaveAndNext={handleSaveAndNext}
        onSubmitTest={() => setIsSubmitDialogOpen(true)}
        isFirstQuestion={currentQuestionIndex === 0}
        isLastQuestion={currentQuestionIndex === questions.length - 1}
        isMarked={currentAnswer.isMarkedForReview}
        hasSelectedOption={Boolean(currentAnswer.selectedOption || (currentAnswer.textAnswer && currentAnswer.textAnswer.trim().length > 0))}
        disabled={isSubmitting || !!autoSubmitMessage}
      />

      {/* 5. SUBMIT CONFIRMATION MODAL */}
      <SubmitDialog
        isOpen={isSubmitDialogOpen}
        onClose={() => setIsSubmitDialogOpen(false)}
        onConfirmSubmit={handleConfirmSubmit}
        isSubmitting={isSubmitting}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        unansweredCount={notAnsweredCount + notVisitedCount}
        markedForReviewCount={markedReviewCount}
        testTitle={test.title}
      />
    </div>
  );
};

export default MockTestPage;
