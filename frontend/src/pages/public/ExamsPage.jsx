import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Lock } from 'lucide-react';
import { examApi } from '../../services/examApi';
import { ExamCard } from '../../components/exam/ExamCard';
import { Button } from '../../components/common/Button';
import { EmptyState, LoadingState } from '../../components/common/FeedbackStates';
import { useAuth } from '../../context/AuthContext';

export const ExamsPage = () => {
  const { isAuthenticated } = useAuth();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState(null);

  useEffect(() => {
    examApi.getExams()
      .then((data) => {
        setExams(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching exams:', err);
        setError('Unable to load exams. Please try again.');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingState message="Loading exams..." fullPage />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header Banner */}
      <div className="space-y-3">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          Explore Government Recruitment Exams
        </h1>
        <p className="text-base text-slate-600 max-w-2xl">
          Browse comprehensive syllabus patterns, question breakdowns, and test series for India's major Central and State government examinations.
        </p>
      </div>

      {/* Locked Stage Banner for Guest Users */}
      {!isAuthenticated && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 border border-amber-200">
              <Lock className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-amber-900">Exams are currently in Locked Stage</h3>
              <p className="text-xs sm:text-sm text-amber-800 mt-0.5">
                Sign in to your GovPrep account to unlock examination blueprints, full mock test papers, and section-wise practice.
              </p>
            </div>
          </div>
          <Link to="/login" className="shrink-0 w-full sm:w-auto">
            <Button size="md" variant="primary" leftIcon={<Lock className="h-4 w-4" />} className="w-full sm:w-auto">
              Login to Unlock All Exams
            </Button>
          </Link>
        </div>
      )}

      {/* Exam Grid */}
      {exams.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exams.map((exam) => (
            <ExamCard key={exam.id} exam={exam} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No exams found"
          description="There are currently no exams available."
          icon={<BookOpen className="h-7 w-7" />}
        />
      )}
    </div>
  );
};
