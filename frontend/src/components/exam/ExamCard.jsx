import React from 'react';
import { Link } from 'react-router-dom';
import { Clock, HelpCircle, FileText, ArrowRight, CheckCircle2, Layers, Lock } from 'lucide-react';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

export const ExamCard = ({ exam }) => {
  const { isAuthenticated } = useAuth();

  const getCategoryVariant = (cat) => {
    switch (cat) {
      case 'Railways': return 'blue';
      case 'Banking': return 'emerald';
      case 'State PSC': return 'amber';
      case 'SSC': return 'purple';
      default: return 'slate';
    }
  };

  return (
    <Card hover padding="none" className="flex flex-col h-full overflow-hidden border border-slate-200/90 group relative">
      {/* Top Header with Category & Badge */}
      <div className="p-6 pb-4 flex-1">
        <div className="flex items-center justify-between mb-3">
          <Badge variant={getCategoryVariant(exam.category)} size="sm">
            {exam.category}
          </Badge>
          {!isAuthenticated && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-100/90 border border-amber-300/80 px-2.5 py-0.5 rounded-full">
              <Lock className="h-3 w-3" /> Locked
            </span>
          )}
        </div>

        <h3 className="text-xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center justify-between gap-2">
          <span>{exam.name}</span>
          {!isAuthenticated && <Lock className="h-4 w-4 text-amber-600 shrink-0" />}
        </h3>
        <p className="text-sm text-slate-500 font-medium mb-3 truncate">{exam.fullName}</p>
        <p className="text-base text-slate-600 line-clamp-2 leading-relaxed mb-4">
          {exam.shortDescription}
        </p>

        {/* Stages pills if present */}
        {exam.stages && exam.stages.length > 0 && (
          <div className="mb-4 space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 uppercase tracking-wider">
              <Layers className="h-3.5 w-3.5 text-blue-600" />
              <span>Supported Stages</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {exam.stages.map((stg) => (
                <span
                  key={stg.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/60"
                >
                  <span className="font-bold">{stg.name}</span>
                  <span className="text-blue-600/80 text-[11px]">({stg.totalQuestions} Qs • {stg.durationMinutes}m)</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 bg-slate-50 p-3.5 rounded-lg border border-slate-100 text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4 text-blue-500 shrink-0" />
            <span><strong>{exam.durationMinutes}</strong> Mins</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <HelpCircle className="h-4 w-4 text-indigo-500 shrink-0" />
            <span><strong>{exam.totalQuestions}</strong> Questions</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
            <span><strong>{exam.availableTestsCount || exam.stages?.length || 1}</strong> Stages / Tests</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
            <span className="truncate">Neg: <strong>{exam.negativeMarking.includes('1/3') || exam.negativeMarking.includes('0.33') ? '1/3' : '0.25'}</strong></span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between mt-auto">
        <span className="text-sm font-semibold text-slate-600 flex items-center gap-1.5">
          {!isAuthenticated ? (
            <span className="text-amber-700 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" /> Login Required
            </span>
          ) : (
            'Official Pattern Mocks'
          )}
        </span>
        {!isAuthenticated ? (
          <Link to="/login">
            <Button size="md" variant="outline" className="text-amber-800 border-amber-300 hover:bg-amber-50" leftIcon={<Lock className="h-4 w-4" />}>
              Login to Unlock
            </Button>
          </Link>
        ) : (
          <Link to={`/exams/${exam.slug}`}>
            <Button size="md" variant="primary" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Select Stage & Test
            </Button>
          </Link>
        )}
      </div>
    </Card>
  );
};
