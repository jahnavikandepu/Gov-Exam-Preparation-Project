import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Target } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ProgressBar } from '../common/ProgressBar';

export const TopicCard = ({
  topicName,
  subject,
  accuracy,
  attemptedCount,
}) => {
  const getColor = (acc) => {
    if (acc < 50) return 'rose';
    if (acc < 70) return 'amber';
    return 'emerald';
  };

  return (
    <Card padding="sm" className="border border-slate-200/80 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            {subject}
          </span>
          <h4 className="text-base font-bold text-slate-900">{topicName}</h4>
        </div>
        <div className="h-8 w-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
          <Target className="h-4 w-4" />
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600 font-medium">Accuracy</span>
          <span className="font-bold text-slate-900">{accuracy}%</span>
        </div>
        <ProgressBar value={accuracy} color={getColor(accuracy)} size="sm" showPercentage={false} />
        <p className="text-xs text-slate-500">{attemptedCount} questions practiced</p>
      </div>

      <Link to="/tests">
        <Button size="md" variant="outline" fullWidth rightIcon={<ArrowRight className="h-4 w-4" />}>
          Practice Topic
        </Button>
      </Link>
    </Card>
  );
};
