import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Check, CheckSquare } from 'lucide-react';

export const TestBuilderModal = ({
  isOpen,
  onClose,
  onSaveTest,
  availableQuestions,
}) => {
  const [title, setTitle] = useState('');
  const [examName, setExamName] = useState('RRB NTPC');
  const [testType, setTestType] = useState('Full Mock');
  const [difficulty, setDifficulty] = useState('Medium');
  const [durationMinutes, setDurationMinutes] = useState(90);
  const [selectedQuestionIds, setSelectedQuestionIds] = useState([]);

  const toggleQuestionSelection = (id) => {
    if (selectedQuestionIds.includes(id)) {
      setSelectedQuestionIds(selectedQuestionIds.filter((qId) => qId !== id));
    } else {
      setSelectedQuestionIds([...selectedQuestionIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedQuestionIds.length === availableQuestions.length) {
      setSelectedQuestionIds([]);
    } else {
      setSelectedQuestionIds(availableQuestions.map((q) => q.id));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveTest({
      title,
      examName,
      examSlug: examName.toLowerCase().replace(/\s+/g, '-'),
      type: testType,
      difficulty,
      durationMinutes: Number(durationMinutes),
      totalQuestions: selectedQuestionIds.length || 50,
      totalMarks: selectedQuestionIds.length || 50,
      negativeMarkingPerQuestion: 0.33,
      marksPerCorrect: 1,
      status: 'New',
      instructions: [
        `This is an official ${examName} test series mock exam.`,
        `Duration: ${durationMinutes} minutes. Total Questions: ${selectedQuestionIds.length || 50}.`,
        '1/3 mark deducted for every incorrect response.',
      ],
      sections: [
        { id: 'maths', name: 'Mathematics', questionsCount: Math.ceil(selectedQuestionIds.length / 2) || 25 },
        { id: 'reasoning', name: 'Reasoning', questionsCount: Math.floor(selectedQuestionIds.length / 2) || 25 },
      ],
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create New Mock Test (Test Builder)" maxWidth="2xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Test Title"
          placeholder="e.g. RRB NTPC Stage-1 Grand Mock Test 05"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Target Exam"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            options={['RRB NTPC', 'RRB Group D', 'RRB ALP', 'RRB JE', 'IBPS PO', 'APPSC']}
          />
          <Select
            label="Test Type"
            value={testType}
            onChange={(e) => setTestType(e.target.value)}
            options={['Full Mock', 'Sectional', 'Topic Test']}
          />
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            options={['Easy', 'Medium', 'Hard']}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Duration (Minutes)"
            type="number"
            min="10"
            max="180"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(Number(e.target.value))}
            required
          />
          <div className="flex flex-col justify-end">
            <p className="text-sm text-slate-600 pb-3 font-medium">
              Selected: <strong className="text-slate-900 font-bold">{selectedQuestionIds.length}</strong> questions
            </p>
          </div>
        </div>

        {/* Question Selector from Bank */}
        <div className="space-y-2.5 border-t border-slate-100 pt-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-800">
              Select Questions from Bank ({selectedQuestionIds.length}/{availableQuestions.length})
            </label>
            <button
              type="button"
              onClick={handleSelectAll}
              className="text-sm font-bold text-purple-600 hover:text-purple-700 cursor-pointer"
            >
              {selectedQuestionIds.length === availableQuestions.length ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          <div className="max-h-52 overflow-y-auto space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50">
            {availableQuestions.map((q) => {
              const isSelected = selectedQuestionIds.includes(q.id);
              return (
                <div
                  key={q.id}
                  onClick={() => toggleQuestionSelection(q.id)}
                  className={`p-3 rounded-xl border text-sm flex items-start gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-purple-50/90 border-purple-400 text-purple-900'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div
                    className={`h-5 w-5 rounded border flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300'
                    }`}
                  >
                    {isSelected && <Check className="h-3.5 w-3.5" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium line-clamp-1 text-slate-900">{q.questionText}</p>
                    <span className="text-xs text-slate-500 font-medium">
                      {q.topicName} • {q.difficulty} • {q.sectionName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" size="md" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="md" variant="purple" leftIcon={<CheckSquare className="h-4 w-4" />}>
            Publish Test Series
          </Button>
        </div>
      </form>
    </Modal>
  );
};
