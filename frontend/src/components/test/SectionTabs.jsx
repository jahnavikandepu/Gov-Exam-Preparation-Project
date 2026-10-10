import React from 'react';
import { Lock } from 'lucide-react';

export const SectionTabs = ({
  sections,
  activeSectionId,
  onSelectSection,
  sectionTiming = false,
}) => {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-200 bg-slate-100/70 p-1.5 rounded-xl">
      {sections.map((sec) => {
        const isActive = sec.id === activeSectionId;
        const isLocked = sectionTiming && !isActive;

        return (
          <button
            key={sec.id}
            type="button"
            disabled={isLocked}
            onClick={() => onSelectSection(sec.id)}
            title={isLocked ? 'Section locked due to official sectional timing' : undefined}
            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap flex items-center gap-2 transition-all ${
              isActive
                ? 'bg-white text-blue-700 shadow-xs border border-slate-200 cursor-pointer'
                : isLocked
                ? 'text-slate-400 bg-slate-100/50 cursor-not-allowed opacity-75'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 cursor-pointer'
            }`}
          >
            {isLocked && <Lock className="h-3.5 w-3.5 text-slate-400" />}
            <span>{sec.name}</span>
            {sec.durationMinutes && (
              <span className="text-[11px] text-slate-400 font-mono">({sec.durationMinutes}m)</span>
            )}
            {sec.questionsCount !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  isActive ? 'bg-blue-100 text-blue-800' : 'bg-slate-200 text-slate-500'
                }`}
              >
                {sec.questionsCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
