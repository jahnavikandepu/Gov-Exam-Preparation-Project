import React from 'react';
import { Check, Bookmark, HelpCircle } from 'lucide-react';

export const QuestionPalette = ({
  items,
  currentIndex,
  onSelectQuestion,
}) => {
  // Compute counts
  const answeredCount = items.filter((i) => i.status === 'answered').length;
  const notAnsweredCount = items.filter((i) => i.status === 'not-answered').length;
  const notVisitedCount = items.filter((i) => i.status === 'not-visited').length;
  const markedReviewCount = items.filter((i) => i.status === 'marked-review').length;
  const answeredMarkedCount = items.filter((i) => i.status === 'answered-marked').length;

  const getStatusStyles = (status, isCurrent) => {
    const ringStyle = isCurrent ? 'ring-2 ring-slate-900 ring-offset-2 scale-105 z-10' : '';

    switch (status) {
      case 'answered':
        return `bg-emerald-600 text-white border-emerald-700 ${ringStyle}`;
      case 'not-answered':
        return `bg-rose-600 text-white border-rose-700 ${ringStyle}`;
      case 'marked-review':
        return `bg-purple-600 text-white border-purple-700 rounded-full ${ringStyle}`;
      case 'answered-marked':
        return `bg-purple-700 text-white border-purple-800 rounded-full relative ${ringStyle}`;
      case 'not-visited':
      default:
        return `bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 ${ringStyle}`;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-xs">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <h4 className="text-sm font-bold uppercase tracking-wider text-slate-700">Question Palette</h4>
        <span className="text-sm font-mono font-semibold text-slate-500">{items.length} Total</span>
      </div>

      {/* Numbered Grid */}
      <div className="max-h-64 overflow-y-auto pr-1">
        <div className="grid grid-cols-5 gap-2">
          {items.map((item, idx) => {
            const isCurrent = idx === currentIndex;
            const statusClass = getStatusStyles(item.status, isCurrent);

            const isLocked = Boolean(item.isLocked);

            return (
              <button
                key={item.questionId}
                type="button"
                disabled={isLocked}
                onClick={() => !isLocked && onSelectQuestion(idx)}
                className={`h-10 w-full flex items-center justify-center font-bold text-sm rounded-lg border transition-transform ${
                  isLocked
                    ? 'opacity-40 bg-slate-100 text-slate-400 cursor-not-allowed border-slate-200'
                    : `cursor-pointer ${statusClass}`
                }`}
                title={isLocked ? `Question ${item.number} - Section Locked` : `Question ${item.number} - Status: ${item.status}`}
                aria-label={`Question ${item.number}, Status: ${item.status}${isCurrent ? ', Current question' : ''}`}
              >
                {item.status === 'answered-marked' ? (
                  <span className="flex items-center gap-0.5">
                    {item.number}
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-300"></span>
                  </span>
                ) : (
                  item.number
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Detailed Status Legend with Accessible Symbols & Counts */}
      <div className="border-t border-slate-100 pt-3 space-y-2.5 text-xs">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Legend</p>

        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-emerald-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              <Check className="h-3.5 w-3.5" />
            </span>
            <span className="text-slate-700">Answered (<strong>{answeredCount}</strong>)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded bg-rose-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              ✕
            </span>
            <span className="text-slate-700">Not Answered (<strong>{notAnsweredCount}</strong>)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
              <Bookmark className="h-3 w-3" />
            </span>
            <span className="text-slate-700">Marked (<strong>{markedReviewCount}</strong>)</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="h-5 w-5 rounded-full bg-purple-700 text-white flex items-center justify-center text-xs font-bold relative shrink-0">
              <Bookmark className="h-3 w-3" />
              <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 border border-purple-700" />
            </span>
            <span className="text-slate-700">Ans + Marked (<strong>{answeredMarkedCount}</strong>)</span>
          </div>

          <div className="flex items-center gap-2 col-span-2">
            <span className="h-5 w-5 rounded bg-slate-100 text-slate-700 border border-slate-300 flex items-center justify-center text-xs font-bold shrink-0">
              <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
            </span>
            <span className="text-slate-700">Not Visited (<strong>{notVisitedCount}</strong>)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
