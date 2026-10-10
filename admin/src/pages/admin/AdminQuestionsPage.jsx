import React, { useState, useEffect } from 'react';
import { Plus, Search, Database, Sparkles, CheckCircle, Layers } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { QuestionTable } from '../../components/admin/QuestionTable';
import { QuestionEditorModal } from '../../components/admin/QuestionEditorModal';
import { BulkQuestionGeneratorModal } from '../../components/admin/BulkQuestionGeneratorModal';
import { Modal } from '../../components/common/Modal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Select } from '../../components/common/Select';
import { LoadingState } from '../../components/common/FeedbackStates';

export const AdminQuestionsPage = () => {
  const [questions, setQuestions] = useState([]);
  const [poolHealth, setPoolHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [examFilter, setExamFilter] = useState('All');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isBulkGenOpen, setIsBulkGenOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [viewingQuestion, setViewingQuestion] = useState(null);

  const refreshData = () => {
    return Promise.all([
      adminApi.getQuestions(),
      adminApi.getQuestionPoolHealth(),
    ]).then(([qData, healthData]) => {
      setQuestions(qData);
      if (healthData && healthData.success) {
        setPoolHealth(healthData);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleSaveQuestion = async (qData) => {
    if (qData.id) {
      // Edit existing
      try {
        const updated = await adminApi.updateQuestion(qData.id, qData);
        setQuestions((prev) =>
          prev.map((item) => (item.id === qData.id ? { ...item, ...updated } : item))
        );
      } catch {
        setQuestions((prev) =>
          prev.map((item) => (item.id === qData.id ? { ...item, ...qData } : item))
        );
      }
    } else {
      // Add new
      try {
        const newQ = await adminApi.addQuestion(qData);
        setQuestions((prev) => [newQ, ...prev]);
      } catch (err) {
        console.error('Failed to add question:', err);
      }
    }
  };

  const handleApprove = async (id) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'PUBLISHED' } : q))
    );
    try {
      await adminApi.updateQuestion(id, { status: 'PUBLISHED' });
    } catch {
      // ignore
    }
  };

  const handleReject = async (id) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, status: 'DRAFT' } : q))
    );
    try {
      await adminApi.updateQuestion(id, { status: 'DRAFT' });
    } catch {
      // ignore
    }
  };

  const filteredQuestions = questions.filter((q) => {
    const matchesExam = examFilter === 'All' || (q.examName && q.examName.includes(examFilter));
    const matchesSubject = subjectFilter === 'All' || q.sectionName === subjectFilter || q.subject === subjectFilter;
    const matchesDiff = difficultyFilter === 'All' || q.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === 'All' || q.status === statusFilter;
    const matchesSource =
      sourceFilter === 'All' ||
      (sourceFilter === 'AI Generated' && q.source === 'AI_GENERATED') ||
      (sourceFilter === 'Verified Bank' && q.source !== 'AI_GENERATED');
    const matchesSearch =
      q.questionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
      q.topicName.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesExam && matchesSubject && matchesDiff && matchesStatus && matchesSource && matchesSearch;
  });

  if (loading) {
    return <LoadingState message="Loading question bank repository from database..." fullPage />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="purple" size="md">Content Management</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-1">
            Question Bank Manager
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Review, edit, approve, or generate new questions for CBT mock series.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="purple"
            size="md"
            leftIcon={<Sparkles className="h-5 w-5" />}
            onClick={() => setIsBulkGenOpen(true)}
          >
            Bulk Generate with Gemini AI
          </Button>
          <Button
            variant="outline"
            size="md"
            leftIcon={<Plus className="h-5 w-5" />}
            onClick={() => {
              setEditingQuestion(null);
              setIsEditorOpen(true);
            }}
          >
            Add New Question
          </Button>
        </div>
      </div>

      {/* Question Pool Health & Breakdown */}
      {poolHealth && poolHealth.summary && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                <Database className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Questions</p>
                <p className="text-2xl font-bold text-slate-900">{poolHealth.summary.totalQuestions}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Bank</p>
                <p className="text-2xl font-bold text-emerald-600">{poolHealth.summary.verifiedQuestions}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                <Sparkles className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">AI Generated</p>
                <p className="text-2xl font-bold text-purple-600">{poolHealth.summary.aiGeneratedQuestions}</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Exams</p>
                <p className="text-2xl font-bold text-amber-600">{poolHealth.poolHealth?.length || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search questions by keyword or topic..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-base focus:bg-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <Select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            options={['All', 'RRB NTPC', 'RRB Group D', 'RRB ALP', 'IBPS PO', 'APPSC']}
          />

          <Select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            options={['All', 'Mathematics', 'General Intelligence & Reasoning', 'General Awareness']}
          />

          <Select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            options={['All', 'AI Generated', 'Verified Bank']}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={['All', 'Approved', 'Draft', 'Rejected', 'PUBLISHED']}
          />
        </div>

        <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-sm text-slate-600 font-medium">
          <span>Found <strong className="text-slate-900">{filteredQuestions.length}</strong> questions</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-xs font-bold uppercase tracking-wider">Difficulty:</span>
            {['All', 'Easy', 'Medium', 'Hard'].map((diff) => (
              <button
                key={diff}
                onClick={() => setDifficultyFilter(diff)}
                className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                  difficultyFilter === diff
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Questions Table */}
      <QuestionTable
        questions={filteredQuestions}
        onView={(q) => setViewingQuestion(q)}
        onEdit={(q) => {
          setEditingQuestion(q);
          setIsEditorOpen(true);
        }}
        onApprove={handleApprove}
        onReject={handleReject}
      />

      {/* Bulk Question Generator Modal */}
      <BulkQuestionGeneratorModal
        isOpen={isBulkGenOpen}
        onClose={() => setIsBulkGenOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
      />

      {/* Editor Modal */}
      <QuestionEditorModal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setEditingQuestion(null);
        }}
        onSave={handleSaveQuestion}
        initialData={editingQuestion}
      />

      {/* View Question Detail Modal */}
      {viewingQuestion && (
        <Modal
          isOpen={!!viewingQuestion}
          onClose={() => setViewingQuestion(null)}
          title="Question Details & Solution Key"
          maxWidth="lg"
        >
          <div className="space-y-4 text-sm text-slate-700">
            <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-3">
              <Badge variant="blue" size="md">{viewingQuestion.sectionName}</Badge>
              <Badge variant="amber" size="md">{viewingQuestion.topicName}</Badge>
              <Badge variant="slate" size="md">{viewingQuestion.difficulty}</Badge>
            </div>

            <p className="text-base font-semibold text-slate-900 leading-relaxed">
              {viewingQuestion.questionText}
            </p>

            <div className="space-y-2 pt-2">
              {viewingQuestion.options.map((opt) => (
                <div
                  key={opt.id}
                  className={`p-3 rounded-xl border flex items-center justify-between text-sm ${
                    viewingQuestion.correctOption === opt.id
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-700'
                  }`}
                >
                  <span>{opt.id}. {opt.text}</span>
                  {viewingQuestion.correctOption === opt.id && <span className="text-xs uppercase font-bold text-emerald-700">✓ Correct Answer</span>}
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <p className="font-bold text-slate-800 uppercase tracking-wider text-xs">Explanation:</p>
              <p className="text-slate-700 leading-relaxed text-sm">{viewingQuestion.explanation}</p>
            </div>

            <div className="flex justify-end pt-2">
              <Button size="md" variant="outline" onClick={() => setViewingQuestion(null)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
