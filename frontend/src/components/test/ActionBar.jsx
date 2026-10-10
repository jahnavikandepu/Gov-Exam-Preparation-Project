import React from 'react';
import { Bookmark, RotateCcw, ChevronLeft, ChevronRight, CheckSquare } from 'lucide-react';
import { Button } from '../common/Button';

export const ActionBar = ({
  onMarkForReview,
  onClearResponse,
  onPrevious,
  onSaveAndNext,
  onSubmitTest,
  isFirstQuestion,
  isLastQuestion,
  isMarked,
  hasSelectedOption,
  disabled = false,
}) => {
  return (
    <div className="bg-white border-t border-slate-200 px-4 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      {/* Left side: Review & Clear buttons */}
      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          size="md"
          variant={isMarked ? 'secondary' : 'outline'}
          onClick={onMarkForReview}
          disabled={disabled}
          leftIcon={<Bookmark className={`h-4.5 w-4.5 ${isMarked ? 'fill-purple-400 text-purple-400' : 'text-purple-600'}`} />}
        >
          {isMarked ? 'Unmark Review' : 'Mark for Review'}
        </Button>

        <Button
          type="button"
          size="md"
          variant="ghost"
          onClick={onClearResponse}
          disabled={disabled || !hasSelectedOption}
          leftIcon={<RotateCcw className="h-4 w-4 text-slate-500" />}
        >
          Clear Response
        </Button>
      </div>

      {/* Right side: Navigation & Submit buttons */}
      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          size="md"
          variant="outline"
          onClick={onPrevious}
          disabled={disabled || isFirstQuestion}
          leftIcon={<ChevronLeft className="h-4.5 w-4.5" />}
        >
          Previous
        </Button>

        <Button
          type="button"
          size="md"
          variant="primary"
          onClick={onSaveAndNext}
          disabled={disabled}
          rightIcon={<ChevronRight className="h-4.5 w-4.5" />}
        >
          {isLastQuestion ? 'Save & Review' : 'Save & Next'}
        </Button>

        <Button
          type="button"
          size="md"
          variant="success"
          onClick={onSubmitTest}
          disabled={disabled}
          leftIcon={<CheckSquare className="h-4.5 w-4.5" />}
        >
          Submit Test
        </Button>
      </div>
    </div>
  );
};
