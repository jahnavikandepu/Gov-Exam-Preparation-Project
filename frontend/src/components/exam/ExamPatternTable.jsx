import React from 'react';
import { Clock, ShieldCheck, CheckCircle2, AlertCircle, Timer } from 'lucide-react';

export const ExamPatternTable = ({ pattern = [] }) => {
  const isSectionWise = pattern.length > 0 && pattern[0]?.questions !== undefined;

  if (isSectionWise) {
    return (
      <div className="space-y-6">
        {/* Exact Section-Wise Pattern Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm sm:text-base">
            <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-5 sm:px-6 py-4">Section</th>
                <th scope="col" className="px-4 sm:px-6 py-4 text-right">Questions/Tasks</th>
                <th scope="col" className="px-4 sm:px-6 py-4 text-right">Maximum Marks</th>
                <th scope="col" className="px-4 sm:px-6 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {pattern.map((row, idx) => {
                const isSubtotal = row.isSubtotal;
                const isTotal = row.isTotal;

                if (isTotal) {
                  return (
                    <tr key={idx} className="bg-blue-50/80 font-extrabold text-blue-900 border-t-2 border-blue-200">
                      <td className="px-5 sm:px-6 py-4">{row.item}</td>
                      <td className="px-4 sm:px-6 py-4 text-right font-mono">{row.questions}</td>
                      <td className="px-4 sm:px-6 py-4 text-right font-mono">{row.marks}</td>
                      <td className="px-4 sm:px-6 py-4 text-right">{row.time}</td>
                    </tr>
                  );
                }

                if (isSubtotal) {
                  return (
                    <tr key={idx} className="bg-slate-100/80 font-bold text-slate-900 border-t border-b border-slate-200">
                      <td className="px-5 sm:px-6 py-3.5">{row.item}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-right font-mono">{row.questions}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-right font-mono">{row.marks}</td>
                      <td className="px-4 sm:px-6 py-3.5 text-right">{row.time}</td>
                    </tr>
                  );
                }

                return (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white hover:bg-slate-50/60' : 'bg-slate-50/40 hover:bg-slate-50/80'}>
                    <td className="px-5 sm:px-6 py-4 font-semibold text-slate-900">{row.item}</td>
                    <td className="px-4 sm:px-6 py-4 text-right text-slate-700 font-mono">{row.questions}</td>
                    <td className="px-4 sm:px-6 py-4 text-right text-slate-700 font-mono">{row.marks}</td>
                    <td className="px-4 sm:px-6 py-4 text-right text-slate-600">{row.time}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Key Examination Specification Metrics */}
        {/* Key Examination Specification Metrics */}
        {(() => {
          const subtotalRow = pattern.find((r) => r.isSubtotal);
          const totalRow = pattern.find((r) => r.isTotal);
          const descriptiveRow = pattern.find((r) => r.item?.toLowerCase().includes('descriptive'));

          const objQs = subtotalRow?.questions || 155;
          const objMarks = subtotalRow?.marks || 200;
          const objTime = subtotalRow?.time || '180 minutes';

          const descQs = descriptiveRow?.questions || 2;
          const descMarks = descriptiveRow?.marks || 25;
          const descTime = descriptiveRow?.time || '30 minutes';

          return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Objective Test</span>
                <p className="text-base font-extrabold text-slate-900">{objQs} questions, {objMarks} marks</p>
                <p className="text-xs text-slate-500">4 sections with negative marking</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Descriptive Test</span>
                <p className="text-base font-extrabold text-slate-900">{descQs} descriptive prompts, {descMarks} marks</p>
                <p className="text-xs text-slate-500">Essay & Letter writing (English only, Qualifying)</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-xs space-y-1">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Total Duration</span>
                <p className="text-base font-extrabold text-slate-900">3 hours 30 minutes (210 Mins)</p>
                <p className="text-xs text-slate-500">{objTime} objective + {descTime} descriptive</p>
              </div>

              <div className="p-4 rounded-xl border border-rose-200/80 bg-rose-50/50 shadow-xs space-y-1">
                <span className="text-xs font-bold text-rose-700 uppercase tracking-wider block">Objective Negative Marking</span>
                <p className="text-base font-extrabold text-rose-900">-0.25 Marks (1/4th per wrong answer)</p>
                <p className="text-xs text-rose-700">Deducted for incorrect objective responses</p>
              </div>

              <div className="p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/50 shadow-xs space-y-1">
                <span className="text-xs font-bold text-emerald-700 uppercase tracking-wider block">Descriptive Negative Marking</span>
                <p className="text-base font-extrabold text-emerald-900">None</p>
                <p className="text-xs text-emerald-700">No penalty for descriptive responses</p>
              </div>

              <div className="p-4 rounded-xl border border-blue-200/80 bg-blue-50/50 shadow-xs space-y-1">
                <span className="text-xs font-bold text-blue-700 uppercase tracking-wider block">Section-Wise Timers</span>
                <p className="text-base font-extrabold text-blue-900">Mandatory Sectional Timers</p>
                <p className="text-xs text-blue-700">Each section has its own configured time limit</p>
              </div>
            </div>
          );
        })()}
      </div>
    );
  }

  // Fallback 2-column table for exams with standard key-value pattern
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-left text-base">
        <thead className="bg-slate-50 text-sm font-bold text-slate-700 uppercase tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-4">Examination Component</th>
            <th scope="col" className="px-6 py-4">Official Details / Specification</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {pattern.map((row, idx) => (
            <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
              <td className="px-6 py-4 font-semibold text-slate-900 w-1/3">{row.item}</td>
              <td className="px-6 py-4 text-slate-700">{row.details}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
