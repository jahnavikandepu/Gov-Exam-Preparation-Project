import React, { useState } from 'react';
import { Card } from '../common/Card';
import { TrendingUp } from 'lucide-react';

export const PerformanceChart = ({ data }) => {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  const barMaxHeight = 120; // height in px for 100%

  return (
    <Card padding="lg" className="border border-slate-200/90 shadow-xs">
      {/* Top Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2 font-heading">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Score & Accuracy Trend
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Progression across your recent mock tests
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-blue-600 shrink-0"></span>
            <span className="text-slate-700">Score (%)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-xs bg-emerald-500 shrink-0"></span>
            <span className="text-slate-700">Accuracy (%)</span>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {(!data || data.length === 0) ? (
        <div className="flex flex-col items-center justify-center py-12 text-center text-slate-400">
          <TrendingUp className="h-8 w-8 mb-2 text-slate-300" />
          <p className="text-sm font-bold text-slate-700">No performance data yet</p>
          <p className="text-xs text-slate-500 mt-1">Complete your first mock test to see your progression.</p>
        </div>
      ) : (
        /* Multi-Row Responsive Grid that grows down naturally without overlapping anything */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
          {data.map((item, idx) => {
            const effectiveMax = item.maxScore || 100;
            const scorePercentage = Math.min(100, Math.max(0, (item.score / effectiveMax) * 100));
            const accuracyVal = Math.min(100, Math.max(0, item.accuracy || 0));

            const scoreHeight = Math.max(8, (scorePercentage / 100) * barMaxHeight);
            const accuracyHeight = Math.max(8, (accuracyVal / 100) * barMaxHeight);
            const isHovered = hoveredIdx === idx;

            return (
              <div
                key={idx}
                className="flex flex-col items-center justify-between bg-slate-50/70 hover:bg-blue-50/30 border border-slate-200/80 hover:border-blue-300 rounded-xl p-3 transition-all relative group"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {/* Floating Tooltip */}
                {isHovered && (
                  <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-slate-900 text-white rounded-lg p-2.5 shadow-xl z-30 pointer-events-none min-w-[180px] border border-slate-700 animate-in fade-in zoom-in-95 text-left">
                    <p className="text-[11px] font-bold text-slate-100 border-b border-slate-800 pb-1 mb-1 leading-snug line-clamp-2">
                      {item.testName}
                    </p>
                    <div className="space-y-0.5 text-[10px]">
                      <div className="flex justify-between text-slate-300">
                        <span>Score:</span>
                        <span className="font-bold text-blue-400 font-mono">
                          {item.score} / {effectiveMax} ({scorePercentage.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Accuracy:</span>
                        <span className="font-bold text-emerald-400 font-mono">
                          {accuracyVal}%
                        </span>
                      </div>
                      {item.date && (
                        <div className="text-slate-400 font-mono pt-1 border-t border-slate-800">
                          {item.date}
                        </div>
                      )}
                    </div>
                    {/* Arrow */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px] border-4 border-transparent border-t-slate-900" />
                  </div>
                )}

                {/* Bars Area */}
                <div 
                  className="w-full flex items-end justify-center gap-2 pb-2 relative"
                  style={{ height: `${barMaxHeight}px` }}
                >
                  {/* Subtle Grid baseline */}
                  <div className="absolute inset-x-0 bottom-0 border-b border-slate-200 pointer-events-none" />

                  {/* Score Bar */}
                  <div className="flex flex-col items-center justify-end h-full">
                    <span className="text-[9px] font-bold text-blue-700 font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">
                      {scorePercentage.toFixed(0)}%
                    </span>
                    <div
                      className="w-3.5 sm:w-4 bg-gradient-to-t from-blue-700 to-blue-500 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${scoreHeight}px` }}
                    />
                  </div>

                  {/* Accuracy Bar */}
                  <div className="flex flex-col items-center justify-end h-full">
                    <span className="text-[9px] font-bold text-emerald-700 font-mono opacity-0 group-hover:opacity-100 transition-opacity mb-0.5">
                      {accuracyVal}%
                    </span>
                    <div
                      className="w-3.5 sm:w-4 bg-gradient-to-t from-emerald-600 to-emerald-400 rounded-t-md transition-all duration-300 group-hover:brightness-110"
                      style={{ height: `${accuracyHeight}px` }}
                    />
                  </div>
                </div>

                {/* Test Title & Date (cleanly contained) */}
                <div className="w-full text-center pt-2 border-t border-slate-200/60 mt-1">
                  <p 
                    className="text-xs font-bold text-slate-800 truncate leading-tight group-hover:text-blue-600 transition-colors"
                    title={item.testName}
                  >
                    {item.testName}
                  </p>
                  <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5">
                    {item.date || `Test #${idx + 1}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};
