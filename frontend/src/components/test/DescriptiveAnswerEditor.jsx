import React, { useState } from 'react';
import { FileText, Globe, CheckCircle2, Sparkles, BookOpen } from 'lucide-react';

export const DescriptiveAnswerEditor = ({
  question,
  value = '',
  onChange,
  disabled = false,
}) => {
  const isIbpsPo = question?.examName?.includes('IBPS') ||
    question?.sectionName?.includes('Descriptive Paper') ||
    question?.sectionName?.includes('Descriptive English') ||
    question?.topicName?.includes('Letter') ||
    question?.topicName?.includes('Essay Writing');

  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [showRubric, setShowRubric] = useState(false);

  const wordCount = value.trim() ? value.trim().split(/\s+/).filter(Boolean).length : 0;
  const charCount = value.length;

  const isLetter = question?.questionText?.toLowerCase().includes('letter') ||
    question?.topicName?.toLowerCase().includes('letter');

  const targetWords = isIbpsPo ? '150-250' : '300-500';
  const maxMarks = isIbpsPo ? '12.5 Marks (25 Total)' : '50 Marks';

  const languages = isIbpsPo
    ? [{ code: 'English', label: 'English Only', note: 'Standard Online Keyboard' }]
    : [
        { code: 'English', label: 'English', note: 'Standard Roman script' },
        { code: 'Telugu', label: 'Telugu (తెలుగు)', note: 'ఆంధ్రప్రదేశ్ అధికారిక భాష' },
        { code: 'Urdu', label: 'Urdu (اردو)', note: 'ریاستی تسلیم شدہ زبان' },
      ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
      {/* 1. Header Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
              <FileText className="h-4 w-4" />
            </span>
            <h3 className="text-base font-bold text-slate-900">
              {isIbpsPo
                ? `Descriptive Paper: ${isLetter ? 'Letter Writing' : 'Essay Writing'}`
                : 'Descriptive Essay Answer Editor'}
            </h3>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {isIbpsPo ? 'Descriptive Paper (25 Marks)' : 'Qualifying Paper (50 Marks)'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isIbpsPo
              ? 'Type your response online in English. Candidates must type their own responses using the keyboard.'
              : 'Type your structured essay response below. Answers are continuously saved in real-time.'}
          </p>
        </div>

        {/* Language Indicator */}
        <div className="flex items-center gap-2 shrink-0">
          <Globe className="h-4 w-4 text-slate-400 shrink-0" />
          <span className="text-xs font-medium text-slate-500">Medium:</span>
          {isIbpsPo ? (
            <span className="px-2.5 py-1 text-xs font-bold text-blue-800 bg-blue-50 border border-blue-200 rounded-md">
              English Only
            </span>
          ) : (
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  type="button"
                  onClick={() => setSelectedLanguage(lang.code)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    selectedLanguage === lang.code
                      ? 'bg-white text-blue-700 shadow-xs font-bold border border-slate-200/60'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 2. Official Evaluation Rubric Banner */}
      <div className="bg-slate-50 rounded-xl p-4 border border-slate-200/80">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <Sparkles className="h-4 w-4 text-blue-600" />
            Transparent Diagnostic Evaluation Rubric ({isIbpsPo ? '25 Marks Total' : '50 Marks Total'})
          </div>
          <button
            type="button"
            onClick={() => setShowRubric(!showRubric)}
            className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
          >
            {showRubric ? 'Hide Details' : 'View Rubric'}
          </button>
        </div>

        {showRubric ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3 pt-3 border-t border-slate-200/60 text-xs">
            <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1">
              <span className="font-extrabold text-blue-900">
                1. {isIbpsPo ? 'Topic Content & Relevance' : 'Relevance & Forest Knowledge'}
              </span>
              <p className="text-slate-600">
                {isIbpsPo
                  ? 'Addressing prompt, correct banking/economic facts, thesis clarity.'
                  : 'Addressing topic, environmental facts, laws & local AP forestry context.'}
              </p>
              <span className="font-bold text-blue-600 text-[11px]">
                {isIbpsPo ? 'Weight: 40% (5.0 M)' : 'Max: 20 Marks'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1">
              <span className="font-extrabold text-blue-900">
                2. {isIbpsPo ? 'Format & Coherence' : 'Structure & Coherence'}
              </span>
              <p className="text-slate-600">
                {isIbpsPo
                  ? `${isLetter ? 'Formal letter salutation, body paragraphs, sign-off.' : 'Introduction, body analysis, conclusion.'}`
                  : 'Introduction, logical paragraphs, analytical depth, and clear conclusion.'}
              </p>
              <span className="font-bold text-blue-600 text-[11px]">
                {isIbpsPo ? 'Weight: 30% (3.75 M)' : 'Max: 15 Marks'}
              </span>
            </div>
            <div className="bg-white p-3 rounded-lg border border-slate-200/60 space-y-1">
              <span className="font-extrabold text-blue-900">
                3. {isIbpsPo ? 'Grammar & Professional Tone' : 'Language & Expression'}
              </span>
              <p className="text-slate-600">
                Grammar, vocabulary, spelling, and clarity in English.
              </p>
              <span className="font-bold text-blue-600 text-[11px]">
                {isIbpsPo ? 'Weight: 30% (3.75 M)' : 'Max: 15 Marks'}
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 mt-1">
            {isIbpsPo
              ? 'Content & Relevance (40%) • Format & Structure (30%) • Language & Tone (30%). No negative marking applies.'
              : 'Relevance & Environmental Knowledge (20M) • Structure & Coherence (15M) • Language & Expression (15M).'}
          </p>
        )}
      </div>

      {/* 3. Text Editor Textarea */}
      <div className="space-y-2">
        <textarea
          id="descriptive-essay-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={
            isIbpsPo
              ? `Type your ${isLetter ? 'letter' : 'essay'} response in English here... Recommended length: 150 to 250 words.`
              : `Write your descriptive essay on the above topic in ${selectedLanguage} here... Recommended length: 300 to 500 words.`
          }
          rows={14}
          className="w-full p-4 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none text-slate-800 text-sm sm:text-base leading-relaxed resize-y font-sans transition-all"
        />

        {/* 4. Footer Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2 pt-1">
          <div className="flex items-center gap-4 font-mono font-medium">
            <span>
              Words: <strong className="text-slate-800">{wordCount}</strong>
              <span className="text-slate-400 font-sans ml-1">(Target: {targetWords})</span>
            </span>
            <span>•</span>
            <span>
              Characters: <strong className="text-slate-800">{charCount}</strong>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-600 font-medium">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span>Autosaved to server</span>
          </div>
        </div>
      </div>
    </div>
  );
};
