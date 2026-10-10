import React, { useState, useEffect } from 'react';
import { Plus, Search, Globe, Lock } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import apiClient from '../../services/api';
import { TestBuilderModal } from '../../components/admin/TestBuilderModal';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingState } from '../../components/common/FeedbackStates';

export const AdminTestsPage = () => {
  const [tests, setTests] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    Promise.all([
      apiClient.get('/tests'),
      adminApi.getQuestions(),
    ]).then(([testsRes, questionsData]) => {
      setTests(testsRes.data.tests || []);
      setQuestions(questionsData);
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  const handleSaveTest = (newTestData) => {
    const newTest = {
      id: `test-${Date.now()}`,
      examId: newTestData.examSlug || 'rrb-ntpc',
      examSlug: newTestData.examSlug || 'rrb-ntpc',
      examName: newTestData.examName || 'RRB NTPC',
      title: newTestData.title || 'New Mock Test',
      type: newTestData.type || 'Full Mock',
      difficulty: newTestData.difficulty || 'Medium',
      totalQuestions: newTestData.totalQuestions || 50,
      durationMinutes: newTestData.durationMinutes || 90,
      totalMarks: newTestData.totalMarks || 50,
      negativeMarkingPerQuestion: 0.33,
      marksPerCorrect: 1,
      status: 'ACTIVE',
      instructions: newTestData.instructions || [],
      sections: newTestData.sections || [
        { id: 'maths', name: 'Mathematics', questionsCount: 25 },
        { id: 'reasoning', name: 'Reasoning', questionsCount: 25 },
      ],
    };

    setTests((prev) => [newTest, ...prev]);
  };

  const handleTogglePublish = (id) => {
    setTests((prev) =>
      prev.map((t) => {
        if (t.id === id) {
          const nextStatus = t.status === 'ARCHIVED' || t.status === 'Completed' ? 'ACTIVE' : 'ARCHIVED';
          return { ...t, status: nextStatus };
        }
        return t;
      })
    );
  };

  const filteredTests = tests.filter((t) =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.examName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <LoadingState message="Loading test series repository from database..." fullPage />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Badge variant="purple" size="md">Test Series Management</Badge>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-1">
            Mock Test Builder & Publisher
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Assemble new CBT test series from curated question pools, set timers, and manage live availability.
          </p>
        </div>

        <Button
          variant="purple"
          size="md"
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => setIsBuilderOpen(true)}
        >
          Create New Test
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
            placeholder="Search test packages..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-base focus:bg-white focus:border-purple-500 focus:outline-none"
          />
        </div>

        <span className="text-sm text-slate-600 font-medium hidden sm:block">
          Total Packages: <strong className="text-slate-900">{tests.length}</strong>
        </span>
      </div>

      {/* Tests Management Table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
        <table className="min-w-full divide-y divide-slate-200 text-left text-base">
          <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
            <tr>
              <th scope="col" className="px-6 py-4">Test Title</th>
              <th scope="col" className="px-4 py-4">Target Exam</th>
              <th scope="col" className="px-4 py-4">Type</th>
              <th scope="col" className="px-4 py-4 text-center">Questions</th>
              <th scope="col" className="px-4 py-4 text-center">Duration</th>
              <th scope="col" className="px-4 py-4 text-center">Status</th>
              <th scope="col" className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {filteredTests.map((test) => (
              <tr key={test.id} className="hover:bg-slate-50/60 transition-colors">
                <td className="px-6 py-4 max-w-sm">
                  <p className="font-bold text-slate-900 text-base">{test.title}</p>
                  <span className="text-xs text-slate-500 font-medium">Marks: {test.totalMarks} • Difficulty: {test.difficulty}</span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-md">
                    {test.examName}
                  </span>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-700">
                  {test.type}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center font-bold text-slate-900 text-base">
                  {test.totalQuestions}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center text-sm text-slate-600 font-mono">
                  {test.durationMinutes}m
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <Badge variant={test.status === 'ARCHIVED' || test.status === 'Completed' ? 'slate' : 'emerald'} size="md">
                    {test.status === 'ARCHIVED' || test.status === 'Completed' ? 'Archived' : 'Published'}
                  </Badge>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleTogglePublish(test.id)}
                    title={test.status === 'ARCHIVED' || test.status === 'Completed' ? 'Publish Test' : 'Unpublish / Archive'}
                  >
                    {test.status === 'ARCHIVED' || test.status === 'Completed' ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                        <Globe className="h-4 w-4" /> Publish
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
                        <Lock className="h-4 w-4" /> Archive
                      </span>
                    )}
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Test Builder Modal */}
      <TestBuilderModal
        isOpen={isBuilderOpen}
        onClose={() => setIsBuilderOpen(false)}
        onSaveTest={handleSaveTest}
        availableQuestions={questions}
      />
    </div>
  );
};
