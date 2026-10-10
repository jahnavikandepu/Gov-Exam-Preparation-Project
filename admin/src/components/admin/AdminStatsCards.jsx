import React from 'react';
import { Users, FileQuestion, GraduationCap, BookOpen, Layers, Award } from 'lucide-react';
import { Card } from '../common/Card';

export const AdminStatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Total Registered Users',
      subtitle: 'Active candidate accounts',
      value: stats.totalUsers.toLocaleString(),
      icon: <Users className="h-5 w-5 text-blue-600" />,
      bg: 'bg-blue-50 border-blue-100',
    },
    {
      title: 'Total Questions',
      subtitle: 'In PostgreSQL question bank',
      value: stats.totalQuestions.toLocaleString(),
      icon: <FileQuestion className="h-5 w-5 text-indigo-600" />,
      bg: 'bg-indigo-50 border-indigo-100',
    },
    {
      title: 'Total Exams',
      subtitle: 'Official government exam blueprints',
      value: (stats.totalExams ?? 5).toLocaleString(),
      icon: <GraduationCap className="h-5 w-5 text-cyan-600" />,
      bg: 'bg-cyan-50 border-cyan-100',
    },
    {
      title: 'Total Topic Tests',
      subtitle: 'Standardized 50-Q practice tests',
      value: stats.totalTests.toLocaleString(),
      icon: <BookOpen className="h-5 w-5 text-purple-600" />,
      bg: 'bg-purple-50 border-purple-100',
    },
    {
      title: 'Tests Attempted',
      subtitle: 'Topic-based test attempts',
      value: (stats.totalTopicAttempts ?? 0).toLocaleString(),
      icon: <Layers className="h-5 w-5 text-emerald-600" />,
      bg: 'bg-emerald-50 border-emerald-100',
    },
    {
      title: 'Exams Attempted',
      subtitle: 'Official exam stage attempts',
      value: (stats.totalExamAttempts ?? 0).toLocaleString(),
      icon: <Award className="h-5 w-5 text-amber-600" />,
      bg: 'bg-amber-50 border-amber-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {cards.map((c, i) => (
        <Card key={i} padding="md" className="border border-slate-200/90 hover:shadow-md transition-shadow bg-white">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{c.title}</p>
            <div className={`p-2 rounded-xl border ${c.bg} shrink-0`}>
              {c.icon}
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading mt-2">{c.value}</p>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">{c.subtitle}</p>
        </Card>
      ))}
    </div>
  );
};
