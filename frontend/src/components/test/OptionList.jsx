import React from 'react';
import { CheckCircle } from 'lucide-react';

export const OptionList = ({
  options,
  selectedOption,
  onSelectOption,
  disabled = false,
}) => {
  return (
    <div className="space-y-3 pt-2">
      <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Select your answer:</p>
      <div className="grid grid-cols-1 gap-3">
        {options.map((option) => {
          const isSelected = selectedOption === option.id;

          return (
            <button
              key={option.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectOption(option.id)}
              className={`w-full flex items-start gap-4 p-4 rounded-xl text-left border transition-all duration-150 cursor-pointer ${
                isSelected
                  ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/80 shadow-2xs'
              }`}
            >
              {/* Option Key Badge (A, B, C, D) */}
              <div
                className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}
              >
                {isSelected ? <CheckCircle className="h-5 w-5" /> : option.id}
              </div>

              {/* Option Text */}
              <div className="flex-1 text-base font-medium text-slate-800 pt-0.5 leading-relaxed">
                {option.text}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
