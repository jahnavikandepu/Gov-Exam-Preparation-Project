import React from 'react';
import { Badge } from '../common/Badge';

export const QuestionPanel = ({
  question,
  questionNumber,
  totalQuestions,
  marksPerCorrect = 1.0,
  negativeMarks = 0.33,
}) => {
  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-2.5">
          <span className="text-base font-bold text-slate-900 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">
            Question {questionNumber} of {totalQuestions}
          </span>
          <span className="text-sm font-semibold text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200">
            {question.sectionName}
          </span>
          <span className="text-sm text-slate-600 font-medium hidden sm:inline">
            Topic: {question.topicName}
          </span>
        </div>

        <div className="flex items-center gap-3 text-sm">
          <span className="text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200">
            +{Number(marksPerCorrect).toFixed(2)} Marks
          </span>
          <span className="text-rose-700 font-bold bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
            -{Number(negativeMarks).toFixed(2)} Mark
          </span>
          <Badge variant="slate" size="sm">
            {question.difficulty}
          </Badge>
        </div>
      </div>

      {/* Question Text */}
      <div className="prose prose-slate max-w-none pt-2">
        <div className="text-lg sm:text-xl font-medium text-slate-900 whitespace-pre-line leading-relaxed">
          {question.questionText}
        </div>
      </div>
    </div>
  );
};
