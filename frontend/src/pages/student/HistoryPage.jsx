import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, Layers } from 'lucide-react';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { EmptyState, LoadingState } from '../../components/common/FeedbackStates';
import { analyticsApi } from '../../services/analyticsApi';

export const HistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('tests');

  useEffect(() => {
    analyticsApi.getHistory().then((data) => {
      setHistory(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <LoadingState message="Loading your attempt history..." fullPage />;
  }

  // Partition into Topic Tests vs Exam Mocks
  const isTopicTest = (item) =>
    item.category === 'TOPIC_TEST' ||
    item.testType === 'TOPIC_TEST' ||
    Boolean(item.topicName) ||
    item.testTitle.toLowerCase().includes('practice test') ||
    item.testTitle.toLowerCase().includes('topic');

  const topicTests = history.filter(isTopicTest);
  const examMocks = history.filter((item) => !isTopicTest(item));

  const currentList = activeTab === 'tests' ? topicTests : examMocks;

  const filteredItems = currentList.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      !searchTerm ||
      item.testTitle.toLowerCase().includes(searchLower) ||
      (item.examName && item.examName.toLowerCase().includes(searchLower)) ||
      (item.topicName && item.topicName.toLowerCase().includes(searchLower)) ||
      (item.subjectName && item.subjectName.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <Badge variant="blue" size="md">Past Performance & Analysis</Badge>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          Attempt History
        </h1>
        <p className="text-base text-slate-600 max-w-2xl leading-relaxed">
          Review your topic tests and full exam mock attempts, track improvements over retakes, and access full question explanations.
        </p>
      </div>

      {/* Main Tab Switcher: Topic Tests vs Exam Mocks */}
      <div className="flex border-b border-slate-200 gap-4 sm:gap-8">
        <button
          onClick={() => setActiveTab('tests')}
          className={`pb-3.5 text-base font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'tests'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          <span>Topic Practice Tests</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
            activeTab === 'tests' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {topicTests.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3.5 text-base font-bold flex items-center gap-2 border-b-2 cursor-pointer transition-colors ${
            activeTab === 'exams'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          <Layers className="h-5 w-5" />
          <span>Exam Mocks & Stages</span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-extrabold ${
            activeTab === 'exams' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-600'
          }`}>
            {examMocks.length}
          </span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            placeholder={
              activeTab === 'tests'
                ? 'Search topic tests by topic name, subject, or exam...'
                : 'Search exam mocks by title, stage, or exam...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
          />
        </div>
      </div>

      {/* History Table */}
      {filteredItems.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 text-left text-sm">
            <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">
                  {activeTab === 'tests' ? 'Topic Practice Test & Attempt' : 'Mock Exam & Stage'}
                </th>
                <th scope="col" className="px-4 py-4">Target Exam</th>
                <th scope="col" className="px-4 py-4">Date</th>
                <th scope="col" className="px-4 py-4 text-center">Score</th>
                <th scope="col" className="px-4 py-4 text-center">Accuracy</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-4 max-w-sm">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900 text-sm truncate">{item.testTitle}</p>
                      <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200 px-2 py-0.5 rounded-full shrink-0">
                        Attempt #{item.attemptNumber || 1}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500 font-normal">
                      <span>Duration: {item.timeSpent || '60 mins'}</span>
                      {item.topicName && (
                        <>
                          <span>•</span>
                          <span className="text-indigo-600 font-semibold">{item.topicName}</span>
                        </>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 text-slate-700">
                      {item.examName || 'GovPrep CBT'}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-xs text-slate-600">
                    {item.date}
                  </td>
                  <td className="px-4 py-4 text-center font-bold text-slate-900">
                    {Number(item.score).toFixed(2)}
                    {item.totalMarks && <span className="text-xs text-slate-400 font-normal"> / {item.totalMarks}</span>}
                  </td>
                  <td className="px-4 py-4 text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                      item.accuracy >= 70 ? 'bg-emerald-100 text-emerald-800' : item.accuracy >= 50 ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {item.accuracy}%
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/results/${item.id}`}>
                        <Button size="sm" variant="outline">
                          Review
                        </Button>
                      </Link>
                      {item.testId && item.testId !== 'session' && (
                        <Link to={`/tests/${item.testId}`} state={{ forceNew: true }}>
                          <Button size="sm" variant="primary">
                            Retake
                          </Button>
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : currentList.length === 0 ? (
        <EmptyState
          title={activeTab === 'tests' ? 'No Topic Tests Attempted Yet' : 'No Exam Mocks Attempted Yet'}
          description={
            activeTab === 'tests'
              ? 'Practice individual syllabus topics with dedicated 50-question tests.'
              : 'Take full-length exam simulation mock tests to benchmark your overall readiness.'
          }
          actionText={activeTab === 'tests' ? 'Explore Topic Tests' : 'Explore Exams'}
          onAction={() => window.location.assign(activeTab === 'tests' ? '/tests' : '/exams')}
        />
      ) : (
        <EmptyState
          title="No Matching Attempts Found"
          description="No completed attempts match your current search term."
          actionText="Clear Search"
          onAction={() => setSearchTerm('')}
        />
      )}
    </div>
  );
};
