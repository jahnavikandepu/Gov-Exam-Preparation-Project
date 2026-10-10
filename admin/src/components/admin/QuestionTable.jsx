import React from 'react';
import { Eye, Edit3, Check, X } from 'lucide-react';
import { Badge } from '../common/Badge';

export const QuestionTable = ({
  questions,
  onView,
  onEdit,
  onApprove,
  onReject,
}) => {
  const getDifficultyBadge = (diff) => {
    switch (diff) {
      case 'Easy': return <Badge variant="emerald" size="md">Easy</Badge>;
      case 'Medium': return <Badge variant="amber" size="md">Medium</Badge>;
      case 'Hard': return <Badge variant="rose" size="md">Hard</Badge>;
      default: return <Badge variant="slate" size="md">{diff}</Badge>;
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
      case 'PUBLISHED': return <Badge variant="emerald" size="md">Approved</Badge>;
      case 'Draft':
      case 'DRAFT': return <Badge variant="amber" size="md">Draft</Badge>;
      case 'Rejected':
      case 'REJECTED': return <Badge variant="rose" size="md">Rejected</Badge>;
      default: return <Badge variant="slate" size="md">Draft</Badge>;
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
      <table className="min-w-full divide-y divide-slate-200 text-left text-base">
        <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
          <tr>
            <th scope="col" className="px-6 py-4">
              Question Content
            </th>
            <th scope="col" className="px-4 py-4">
              Topic / Subject
            </th>
            <th scope="col" className="px-4 py-4">
              Difficulty
            </th>
            <th scope="col" className="px-4 py-4">
              Source
            </th>
            <th scope="col" className="px-4 py-4">
              Status
            </th>
            <th scope="col" className="px-6 py-4 text-right">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {questions.map((q) => (
            <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
              <td className="px-6 py-4 max-w-md">
                <p className="font-medium text-slate-900 line-clamp-2 text-base">{q.questionText}</p>
                <span className="text-xs text-slate-500 font-mono">Exam: {q.examName || 'General'}</span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                <p className="font-bold text-sm text-slate-800">{q.topicName}</p>
                <p className="text-xs text-slate-500">{q.sectionName}</p>
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {getDifficultyBadge(q.difficulty)}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {q.source === 'AI_GENERATED' ? (
                  <Badge variant="purple" size="sm">Gemini AI</Badge>
                ) : (
                  <Badge variant="blue" size="sm">{q.source || 'Verified Bank'}</Badge>
                )}
              </td>
              <td className="px-4 py-4 whitespace-nowrap">
                {getStatusBadge(q.status)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right space-x-1.5">
                <button
                  type="button"
                  onClick={() => onView(q)}
                  className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-800 cursor-pointer transition-colors"
                  title="View Details"
                >
                  <Eye className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onEdit(q)}
                  className="p-2 rounded-lg text-blue-600 hover:bg-blue-50 cursor-pointer transition-colors"
                  title="Edit Question"
                >
                  <Edit3 className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onApprove(q.id)}
                  className="p-2 rounded-lg text-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors"
                  title="Approve Question"
                >
                  <Check className="h-4.5 w-4.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onReject(q.id)}
                  className="p-2 rounded-lg text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
                  title="Reject Question"
                >
                  <X className="h-4.5 w-4.5" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
