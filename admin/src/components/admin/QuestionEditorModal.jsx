import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';

export const QuestionEditorModal = ({
  isOpen,
  onClose,
  onSave,
  initialData,
}) => {
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctOption, setCorrectOption] = useState('A');
  const [explanation, setExplanation] = useState('');
  const [difficulty, setDifficulty] = useState('Medium');
  const [topicName, setTopicName] = useState('');
  const [sectionName, setSectionName] = useState('Mathematics');
  const [examName, setExamName] = useState('RRB NTPC');

  useEffect(() => {
    if (initialData) {
      setQuestionText(initialData.questionText);
      setOptA(initialData.options.find((o) => o.id === 'A')?.text || '');
      setOptB(initialData.options.find((o) => o.id === 'B')?.text || '');
      setOptC(initialData.options.find((o) => o.id === 'C')?.text || '');
      setOptD(initialData.options.find((o) => o.id === 'D')?.text || '');
      setCorrectOption(initialData.correctOption || 'A');
      setExplanation(initialData.explanation || '');
      setDifficulty(initialData.difficulty);
      setTopicName(initialData.topicName);
      setSectionName(initialData.sectionName);
      setExamName(initialData.examName || 'RRB NTPC');
    } else {
      setQuestionText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectOption('A');
      setExplanation('');
      setDifficulty('Medium');
      setTopicName('');
      setSectionName('Mathematics');
      setExamName('RRB NTPC');
    }
  }, [initialData, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      id: initialData ? initialData.id : undefined,
      questionText,
      options: [
        { id: 'A', text: optA },
        { id: 'B', text: optB },
        { id: 'C', text: optC },
        { id: 'D', text: optD },
      ],
      correctOption,
      explanation,
      difficulty,
      topicName: topicName || 'General',
      sectionName,
      examName,
    });
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? 'Edit Question' : 'Add New Question to Bank'}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Metadata row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Exam"
            value={examName}
            onChange={(e) => setExamName(e.target.value)}
            options={['RRB NTPC', 'RRB Group D', 'RRB ALP', 'RRB JE', 'IBPS PO', 'APPSC']}
          />
          <Select
            label="Section / Subject"
            value={sectionName}
            onChange={(e) => setSectionName(e.target.value)}
            options={['Mathematics', 'General Intelligence & Reasoning', 'General Awareness', 'English Language', 'General Science']}
          />
          <Select
            label="Difficulty"
            value={difficulty}
            onChange={(e) => setDifficulty(e.target.value)}
            options={['Easy', 'Medium', 'Hard']}
          />
        </div>

        <Input
          label="Topic Name"
          placeholder="e.g. Profit and Loss, Number System, Syllogism"
          value={topicName}
          onChange={(e) => setTopicName(e.target.value)}
          required
        />

        {/* Question Textarea */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Question Text
          </label>
          <textarea
            rows={3}
            className="block w-full rounded-xl border border-slate-300 p-3.5 text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            placeholder="Type your question statement or problem statement here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            required
          />
        </div>

        {/* 4 Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <Input
            label="Option A"
            placeholder="Option A content"
            value={optA}
            onChange={(e) => setOptA(e.target.value)}
            required
          />
          <Input
            label="Option B"
            placeholder="Option B content"
            value={optB}
            onChange={(e) => setOptB(e.target.value)}
            required
          />
          <Input
            label="Option C"
            placeholder="Option C content"
            value={optC}
            onChange={(e) => setOptC(e.target.value)}
            required
          />
          <Input
            label="Option D"
            placeholder="Option D content"
            value={optD}
            onChange={(e) => setOptD(e.target.value)}
            required
          />
        </div>

        {/* Correct Option Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Select
            label="Correct Answer"
            value={correctOption}
            onChange={(e) => setCorrectOption(e.target.value)}
            options={[
              { value: 'A', label: 'Option A is Correct' },
              { value: 'B', label: 'Option B is Correct' },
              { value: 'C', label: 'Option C is Correct' },
              { value: 'D', label: 'Option D is Correct' },
            ]}
          />
        </div>

        {/* Explanation */}
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-slate-700">
            Detailed Solution & Explanation
          </label>
          <textarea
            rows={2}
            className="block w-full rounded-xl border border-slate-300 p-3.5 text-base focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 focus:outline-none"
            placeholder="Explain the step-by-step formula or concept behind the correct answer..."
            value={explanation}
            onChange={(e) => setExplanation(e.target.value)}
            required
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <Button type="button" size="md" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="md" variant="purple">
            {initialData ? 'Update Question' : 'Save Question'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
