import React from 'react';
import { AlertCircle, CheckCircle2, HelpCircle, Bookmark, CheckSquare } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';

export const SubmitDialog = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  isSubmitting = false,
  totalQuestions,
  answeredCount,
  unansweredCount,
  markedForReviewCount,
  testTitle,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Test Submission" maxWidth="md">
      <div className="space-y-5">
        <div className="flex items-start gap-3 bg-amber-50 p-4 rounded-xl border border-amber-200/80 text-amber-800">
          <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-sm leading-relaxed">
            Are you sure you want to submit <strong>{testTitle}</strong>? Once submitted, you cannot change your answers.
          </p>
        </div>

        {/* Summary Breakdown Grid */}
        <div className="grid grid-cols-2 gap-3.5">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <HelpCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase">Total Questions</p>
              <p className="text-xl font-bold text-slate-900">{totalQuestions}</p>
            </div>
          </div>

          <div className="bg-emerald-50/60 p-3.5 rounded-xl border border-emerald-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-emerald-700 uppercase">Answered</p>
              <p className="text-xl font-bold text-emerald-900">{answeredCount}</p>
            </div>
          </div>

          <div className="bg-rose-50/60 p-3.5 rounded-xl border border-rose-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <span className="font-bold text-lg">✕</span>
            </div>
            <div>
              <p className="text-xs font-semibold text-rose-700 uppercase">Unanswered</p>
              <p className="text-xl font-bold text-rose-900">{unansweredCount}</p>
            </div>
          </div>

          <div className="bg-purple-50/60 p-3.5 rounded-xl border border-purple-100 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
              <Bookmark className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-purple-700 uppercase">Marked for Review</p>
              <p className="text-xl font-bold text-purple-900">{markedForReviewCount}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" size="md" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            type="button"
            size="md"
            variant="success"
            onClick={onConfirmSubmit}
            isLoading={isSubmitting}
            leftIcon={<CheckSquare className="h-5 w-5" />}
          >
            Submit Test
          </Button>
        </div>
      </div>
    </Modal>
  );
};
