import React, { useState, useEffect } from 'react';
import { Plus, Search, Layers, ChevronDown, ChevronUp } from 'lucide-react';
import apiClient from '../../services/api';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { LoadingState } from '../../components/common/FeedbackStates';

export const AdminExamsPage = () => {
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedExamId, setExpandedExamId] = useState(null);

  useEffect(() => {
    apiClient.get('/exams')
      .then((res) => {
        const data = res.data.exams || [];
        setExams(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load exams:', err);
        setLoading(false);
      });
  }, []);

  const filteredExams = exams.filter((e) =>
    e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading exam catalog from database..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="purple" size="md">Exam Blueprint & Stage Engine</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Government Exam & Stage Configuration
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage hierarchical stages (CBT-1, CBT-2, Screening, Mains), section quotas, timing, and marking formulas.
          </p>
        </div>

        <Button
          size="md"
          variant="purple"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => alert('New Exam blueprint creator is managed via Server-Side Configurations.')}
        >
          Add Exam Blueprint
        </Button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="relative w-full max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder="Search exams by name, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-base focus:bg-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <span className="text-sm text-slate-600 font-medium hidden sm:block">
          Configured Exams: <strong className="text-slate-900">{exams.length}</strong>
        </span>
      </div>

      {/* Exam Hierarchy List */}
      <div className="space-y-6">
        {filteredExams.map((exam) => {
          const isExpanded = expandedExamId === exam.id;
          return (
            <div
              key={exam.id}
              className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden transition-all"
            >
              {/* Exam Header Summary */}
              <div
                onClick={() => setExpandedExamId(isExpanded ? null : exam.id)}
                className="p-6 cursor-pointer hover:bg-slate-50/70 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 select-none"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <Badge variant="purple" size="sm">{exam.category}</Badge>
                    <span className="font-mono text-xs font-bold text-slate-500">{exam.code || exam.slug}</span>
                    <Badge variant={exam.status === 'Archived' ? 'slate' : 'emerald'} size="sm">
                      {exam.status === 'Archived' ? 'Archived' : 'Active'}
                    </Badge>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">{exam.name}</h3>
                  <p className="text-sm text-slate-500 truncate max-w-2xl">{exam.fullName}</p>
                </div>

                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Stages</span>
                      <strong className="text-sm text-slate-900">{exam.stages?.length || 1} Stages</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Standard Qs</span>
                      <strong className="text-sm text-slate-900">{exam.totalQuestions} Qs</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 uppercase tracking-wider block text-[10px]">Duration</span>
                      <strong className="text-sm text-slate-900">{exam.durationMinutes}m</strong>
                    </div>
                  </div>

                  <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              {/* Expanded Stages Breakdown */}
              {isExpanded && (
                <div className="px-6 pb-6 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="h-4 w-4 text-purple-600" />
                    Configured Stages for {exam.name}
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {exam.stages && exam.stages.length > 0 ? (
                      exam.stages.map((stage) => (
                        <div
                          key={stage.id}
                          className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-2xs space-y-3"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-base text-slate-900">{stage.name}</span>
                            <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              {stage.code}
                            </span>
                          </div>

                          <p className="text-xs text-slate-600 line-clamp-2">{stage.paperName || stage.description}</p>

                          <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-center text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">QUESTIONS</span>
                              <strong className="text-slate-800">{stage.totalQuestions}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">DURATION</span>
                              <strong className="text-slate-800">{stage.durationMinutes}m</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">MARKS</span>
                              <strong className="text-slate-800">{stage.totalMarks}</strong>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 font-bold block">NEGATIVE</span>
                              <strong className="text-rose-600">-{stage.negativeMarks}</strong>
                            </div>
                          </div>

                          {/* Sections inside stage */}
                          {stage.sections && stage.sections.length > 0 && (
                            <div className="space-y-1 text-xs pt-1">
                              <span className="text-[11px] font-bold text-slate-500 uppercase">Section Quotas:</span>
                              <div className="space-y-1">
                                {stage.sections.map((sec) => (
                                  <div
                                    key={sec.id}
                                    className="flex items-center justify-between bg-slate-50 px-2.5 py-1 rounded text-slate-700 text-[11px]"
                                  >
                                    <span>{sec.name}</span>
                                    <strong className="text-purple-600">{sec.questionCount} Qs</strong>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {stage.notificationReference && (
                            <div className="text-[10px] text-slate-400 pt-1">
                              Ref: {stage.notificationReference} ({stage.notificationYear})
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500">No specific stages configured yet.</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
