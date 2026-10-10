import React, { useState, useEffect } from 'react';
import { Search, Layers } from 'lucide-react';
import { testService } from '../../services/api';
import { TestCard } from '../../components/test/TestCard';
import { Badge } from '../../components/common/Badge';
import { Select } from '../../components/common/Select';
import { EmptyState, LoadingState } from '../../components/common/FeedbackStates';

export const TestsPage = () => {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [selectedExam, setSelectedExam] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    testService.getTests({ type: 'TOPIC_TEST' }).then((data) => {
      const topicOnly = (data || []).filter((t) => t.type === 'Topic Test' || t.rawType === 'TOPIC_TEST' || Boolean(t.topicName));
      setTests(topicOnly);
      setLoading(false);
    });
  }, []);

  const filteredTests = tests.filter((t) => {
    const matchesExam = selectedExam === 'All' || selectedExam === 'All Exams' || t.examName.toLowerCase().includes(selectedExam.toLowerCase());
    
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      t.title.toLowerCase().includes(searchLower) ||
      t.examName.toLowerCase().includes(searchLower) ||
      (t.topicName && t.topicName.toLowerCase().includes(searchLower)) ||
      (t.subjectName && t.subjectName.toLowerCase().includes(searchLower));

    return matchesExam && matchesSearch;
  });

  if (loading) {
    return <LoadingState message="Loading syllabus-aligned topic practice tests..." fullPage />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge variant="blue" size="sm">Topic-Specific Test Series</Badge>
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
            50 Qs • 60 Mins • 0 Negative Marking
          </span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
          Syllabus Topic Practice Tests
        </h1>
        <p className="text-base text-slate-600 max-w-3xl">
          Practice individual syllabus topics with dedicated 50-question practice tests (60 mins, zero negative marking) with fresh unique questions on every retake.
        </p>
      </div>

      {/* Filter Panel */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs">
        {/* Search & Exam row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="sm:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search by topic name, subject or exam..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-base focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <Select
              value={selectedExam}
              onChange={(e) => setSelectedExam(e.target.value)}
              options={['All Exams', 'RRB NTPC', 'RRB Group D', 'RRB JE', 'IBPS PO', 'APPSC FBO & ABO']}
            />
          </div>
        </div>
      </div>

      {/* Tests Grid */}
      {filteredTests.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTests.map((test) => (
            <TestCard key={test.id} test={test} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No tests found matching your criteria"
          description="Try adjusting your search or selecting a different exam to see more topic tests."
          actionText="Reset All Filters"
          onAction={() => {
            setSelectedExam('All');
            setSearchTerm('');
          }}
          icon={<Layers className="h-7 w-7" />}
        />
      )}
    </div>
  );
};
