import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle, AlertCircle, RefreshCw, Cpu, Layers } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Select } from '../common/Select';
import { adminApi } from '../../services/adminApi';

export const BulkQuestionGeneratorModal = ({ isOpen, onClose, onSuccess }) => {
  const [examList, setExamList] = useState([]);
  const [selectedExamId, setSelectedExamId] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('ALL');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [questionCount, setQuestionCount] = useState(10);
  const [status, setStatus] = useState('PUBLISHED');

  const [aiStatus, setAiStatus] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultTelemetry, setResultTelemetry] = useState(null);
  const [error, setError] = useState(null);

  // Load exam metadata from stages/pool-health
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setResultTelemetry(null);

      adminApi.getQuestionPoolHealth().then((data) => {
        if (data && Array.isArray(data.poolHealth)) {
          setExamList(data.poolHealth);
          if (data.poolHealth.length > 0 && !selectedExamId) {
            setSelectedExamId(data.poolHealth[0].examId);
          }
        }
      }).catch(() => {});

      adminApi.getGeminiStatus().then((statusRes) => {
        setAiStatus(statusRes);
      }).catch(() => {});
    }
  }, [isOpen]);

  const currentExam = examList.find((e) => e.examId === selectedExamId);

  // Common subjects/sections based on selected exam
  const getAvailableSubjects = () => {
    if (!currentExam) {
      return [
        { id: 'sub-1', name: 'General Studies & Mental Ability' },
        { id: 'sub-2', name: 'General Science & Mathematics' },
      ];
    }
    const subjects = [];
    if (currentExam.stages && currentExam.stages.length > 0) {
      for (const stg of currentExam.stages) {
        if (stg.sections) {
          for (const sec of stg.sections) {
            if (!subjects.some((s) => s.name === sec.sectionName)) {
              subjects.push({ id: sec.sectionId || sec.sectionName, name: sec.sectionName });
            }
          }
        }
      }
    }
    return subjects.length > 0 ? subjects : [
      { id: 'sub-all', name: 'General Knowledge & Subject Core' }
    ];
  };

  const availableSubjects = getAvailableSubjects();

  useEffect(() => {
    if (availableSubjects.length > 0 && !selectedSubjectId) {
      setSelectedSubjectId(availableSubjects[0].id);
    }
  }, [selectedExamId, availableSubjects]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    setResultTelemetry(null);

    try {
      const payload = {
        examId: selectedExamId,
        subjectId: selectedSubjectId,
        topicId: selectedTopicId === 'ALL' ? undefined : selectedTopicId,
        count: parseInt(String(questionCount), 10) || 10,
        difficulty: difficulty === 'ALL' ? 'ALL' : difficulty.toUpperCase(),
        status: status,
      };

      const res = await adminApi.bulkGenerateQuestions(payload);
      setResultTelemetry(res.telemetry);

      if (onSuccess) {
        onSuccess(res);
      }
    } catch (err) {
      setError(err.message || 'Failed to generate questions with AI.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Gemini AI Bulk Question Generator"
      maxWidth="xl"
    >
      <div className="space-y-6 text-slate-800">
        {/* Model Status Header */}
        <div className="bg-purple-50/70 border border-purple-200/80 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-600 text-white rounded-xl shadow-xs">
              <Cpu className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-slate-900">Gemini Generative Engine</p>
                <Badge variant={aiStatus?.available ? 'success' : 'purple'} size="sm">
                  {aiStatus?.model || 'gemini-3.5-flash-lite'}
                </Badge>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {aiStatus?.message || 'Ready for exam-aligned syllabus question synthesis.'}
              </p>
            </div>
          </div>
          <Badge variant={aiStatus?.configured ? 'success' : 'slate'} size="sm">
            {aiStatus?.configured ? 'API Connected' : 'Configured'}
          </Badge>
        </div>

        {/* Configuration Form */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Target Exam */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Target Examination
            </label>
            <Select
              value={selectedExamId}
              onChange={(e) => {
                setSelectedExamId(e.target.value);
                setSelectedSubjectId('');
              }}
              options={examList.map((e) => ({ label: e.examName, value: e.examId }))}
            />
          </div>

          {/* Subject / Section */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Subject / Paper Section
            </label>
            <Select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              options={availableSubjects.map((s) => ({ label: s.name, value: s.id }))}
            />
          </div>

          {/* Target Difficulty */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Difficulty Calibration
            </label>
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              options={[
                { label: 'Medium (Standard Exam Pattern)', value: 'MEDIUM' },
                { label: 'Easy (Fundamental Conceptual)', value: 'EASY' },
                { label: 'Hard (Advanced Problem Solving)', value: 'HARD' },
                { label: 'Balanced Mix (Easy + Med + Hard)', value: 'ALL' },
              ]}
            />
          </div>

          {/* Number of Questions */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Questions Count
            </label>
            <Select
              value={String(questionCount)}
              onChange={(e) => setQuestionCount(Number(e.target.value))}
              options={[
                { label: '5 Questions (Quick Batch)', value: '5' },
                { label: '10 Questions (Standard Batch)', value: '10' },
                { label: '25 Questions (Section Pool)', value: '25' },
                { label: '50 Questions (Full Topic Test Pool)', value: '50' },
              ]}
            />
          </div>

          {/* Publication Status */}
          <div className="space-y-1.5 sm:col-span-2">
            <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider">
              Default Question Status in Bank
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setStatus('PUBLISHED')}
                className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  status === 'PUBLISHED'
                    ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <CheckCircle className="h-4 w-4 text-purple-600" />
                <span>Published / Verified</span>
              </button>
              <button
                type="button"
                onClick={() => setStatus('DRAFT')}
                className={`p-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                  status === 'DRAFT'
                    ? 'bg-amber-50 border-amber-500 text-amber-900 ring-2 ring-amber-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <Layers className="h-4 w-4 text-amber-600" />
                <span>Pending Review (Draft)</span>
              </button>
            </div>
          </div>
        </div>

        {/* Telemetry Output */}
        {resultTelemetry && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-emerald-900 font-bold">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <span>Generation Successful & Stored in Database</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Requested</p>
                <p className="text-xl font-extrabold text-slate-900">{resultTelemetry.requested}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Validated & Saved</p>
                <p className="text-xl font-extrabold text-emerald-600">{resultTelemetry.saved}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Duplicates Skipped</p>
                <p className="text-xl font-extrabold text-amber-600">{resultTelemetry.duplicatesSkipped}</p>
              </div>
              <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                <p className="text-[11px] font-bold text-slate-500 uppercase">Status</p>
                <p className="text-sm font-bold text-purple-600 mt-1">{status}</p>
              </div>
            </div>
          </div>
        )}

        {/* Error Feedback */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-start gap-3 text-rose-800">
            <AlertCircle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-sm space-y-1">
              <p className="font-bold text-rose-900">Generation Notice</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
          <Button variant="outline" size="md" onClick={onClose} disabled={isGenerating}>
            {resultTelemetry ? 'Done' : 'Cancel'}
          </Button>
          <Button
            variant="purple"
            size="md"
            onClick={handleGenerate}
            isLoading={isGenerating}
            leftIcon={<Sparkles className="h-4 w-4" />}
          >
            {isGenerating ? `Generating ${questionCount} Questions...` : `Generate ${questionCount} Questions`}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
