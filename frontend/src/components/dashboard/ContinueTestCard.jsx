import React from 'react';
import { Link } from 'react-router-dom';
import { PlayCircle, Clock } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';

export const ContinueTestCard = ({
  testId,
  testTitle,
  examName,
  completedQuestions,
  totalQuestions,
  timeLeftMinutes,
}) => {
  const percentage = Math.round((completedQuestions / totalQuestions) * 100);

  return (
    <Card padding="md" className="border-2 border-blue-200 bg-gradient-to-r from-blue-50/50 to-indigo-50/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              {examName}
            </span>
            <span className="text-sm text-amber-700 font-semibold flex items-center gap-1.5 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
              <Clock className="h-4 w-4" />
              {timeLeftMinutes} mins remaining
            </span>
          </div>

          <h3 className="text-xl font-bold text-slate-900">{testTitle}</h3>

          <div className="max-w-md space-y-1.5">
            <div className="flex justify-between text-sm text-slate-700 font-medium">
              <span>{completedQuestions} / {totalQuestions} Questions Completed</span>
              <span className="font-bold text-blue-700">{percentage}%</span>
            </div>
            <ProgressBar value={percentage} color="blue" size="sm" showPercentage={false} />
          </div>
        </div>

        <div className="shrink-0">
          <Link to={`/tests/${testId}`}>
            <Button
              size="md"
              variant="primary"
              leftIcon={<PlayCircle className="h-4 w-4" />}
            >
              Continue Test
            </Button>
          </Link>
        </div>
      </div>
    </Card>
  );
};
