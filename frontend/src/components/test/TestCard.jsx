import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, HelpCircle, Award, ArrowRight, Play, CheckCircle2, Lock, Tag, ShieldCheck } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export const TestCard = ({ test }) => {
  const { isAuthenticated } = useAuth();

  const getTypeVariant = (type) => {
    switch (type) {
      case 'Full Mock':
      case 'FULL_MOCK': return 'blue';
      case 'Sectional':
      case 'SECTIONAL': return 'purple';
      case 'Topic Test':
      case 'TOPIC_TEST': return 'indigo';
      default: return 'slate';
    }
  };

  const getDifficultyVariant = (diff) => {
    switch (diff?.toLowerCase()) {
      case 'easy': return 'emerald';
      case 'medium': return 'amber';
      case 'hard': return 'rose';
      default: return 'slate';
    }
  };

  const getStatusBadge = (status) => {
    if (!isAuthenticated) {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
          <Lock className="h-3 w-3" /> Locked
        </span>
      );
    }

    switch (status) {
      case 'In Progress':
        return <Badge variant="amber" size="sm">In Progress ({test.completedQuestions || 0}/{test.totalQuestions})</Badge>;
      case 'Completed':
        return <Badge variant="emerald" size="sm" icon={<CheckCircle2 className="h-3 w-3" />}>Completed</Badge>;
      default:
        return <Badge variant="blue" size="sm">New</Badge>;
    }
  };

  const isNoNegative = Number(test.negativeMarkingPerQuestion) === 0;

  return (
    <Card hover padding="none" className="flex flex-col h-full border border-slate-200/90 overflow-hidden shadow-xs hover:shadow-md transition-shadow">
      <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
        {/* Top Badges */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <Badge variant={getTypeVariant(test.type)} size="sm">
              {test.type === 'TOPIC_TEST' ? 'Topic Test' : test.type === 'FULL_MOCK' ? 'Full Mock' : test.type}
            </Badge>
            <Badge variant={getDifficultyVariant(test.difficulty)} size="sm">
              {test.difficulty}
            </Badge>
          </div>
          {getStatusBadge(test.status)}
        </div>

        {/* Exam, Subject & Topic info */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 mb-1">
            <span>{test.examName}</span>
            {test.subjectName && (
              <>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600">{test.subjectName}</span>
              </>
            )}
          </div>
          <h4 className="text-base sm:text-lg font-bold text-slate-900 line-clamp-2">
            {test.title}
          </h4>
          {test.topicName && (
            <div className="inline-flex items-center gap-1.5 mt-2 px-2.5 py-1 bg-indigo-50/80 border border-indigo-100/90 rounded-md text-xs font-semibold text-indigo-700">
              <Tag className="h-3 w-3 text-indigo-500" />
              <span>Topic: {test.topicName}</span>
            </div>
          )}
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-3 gap-2 text-center text-xs sm:text-sm text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-slate-400">
              <HelpCircle className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Questions</span>
            </div>
            <span className="font-extrabold text-slate-900 mt-0.5">{test.totalQuestions} Qs</span>
          </div>
          <div className="flex flex-col items-center justify-center border-x border-slate-200/60">
            <div className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Duration</span>
            </div>
            <span className="font-extrabold text-slate-900 mt-0.5">{test.durationMinutes} Mins</span>
          </div>
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-slate-400">
              <Award className="h-3.5 w-3.5" />
              <span className="text-[10px] uppercase font-bold text-slate-400">Marks</span>
            </div>
            <span className="font-extrabold text-slate-900 mt-0.5">{test.totalMarks} Marks</span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-5 py-3 bg-slate-50/90 border-t border-slate-100 flex items-center justify-between">
        {isNoNegative ? (
          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            No Negative Marking
          </span>
        ) : (
          <span className="text-xs text-rose-700 font-semibold">
            Neg: -{test.negativeMarkingPerQuestion} mark
          </span>
        )}

        {!isAuthenticated ? (
          <Link to="/login">
            <Button size="sm" variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-50" leftIcon={<Lock className="h-3.5 w-3.5" />}>
              Login
            </Button>
          </Link>
        ) : test.status === 'Completed' ? (
          <Link to={`/tests/${test.id}/instructions`}>
            <Button size="sm" variant="outline" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
              Retake Test
            </Button>
          </Link>
        ) : (
          <Link to={`/tests/${test.id}/instructions`}>
            <Button
              size="sm"
              variant={test.status === 'In Progress' ? 'secondary' : 'primary'}
              leftIcon={<Play className="h-3.5 w-3.5 fill-current" />}
            >
              {test.status === 'In Progress' ? 'Resume' : 'Start Test'}
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
};
