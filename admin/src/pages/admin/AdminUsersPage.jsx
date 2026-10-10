import React, { useState, useEffect } from 'react';
import { Search, Eye } from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { EmptyState, LoadingState } from '../../components/common/FeedbackStates';
import { UserDetailsModal } from '../../components/admin/UserDetailsModal';

export const AdminUsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [examFilter, setExamFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedUserId, setSelectedUserId] = useState(null);

  useEffect(() => {
    adminApi
      .getUsers()
      .then((data) => {
        setUsers(data.filter((u) => u.role === 'USER' || !u.role));
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        setLoading(false);
      });
  }, []);

  const toggleUserStatus = async (userId) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const nextStatus = targetUser.status === 'Active' ? 'Disabled' : 'Active';

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: nextStatus } : u))
    );

    await adminApi.updateUserStatus(userId, nextStatus);
  };

  const handleModalStatusChange = (userId, newStatus) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, status: newStatus } : u))
    );
  };

  const filteredUsers = users.filter((u) => {
    const matchesExam = examFilter === 'All' || u.targetExam === examFilter;
    const matchesCategory = categoryFilter === 'All' || u.category === categoryFilter;
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      u.name.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      (u.phone && u.phone.toLowerCase().includes(term)) ||
      (u.state && u.state.toLowerCase().includes(term)) ||
      (u.targetExam && u.targetExam.toLowerCase().includes(term));

    return matchesExam && matchesCategory && matchesSearch;
  });

  if (loading) {
    return <LoadingState message="Loading registered student records from database..." fullPage />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="purple" size="md">User Directory</Badge>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Registered Student Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time candidate registrations, contact details, recruitment category & exam diagnostic history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 text-sm text-slate-600 shadow-xs">
            Total Students: <strong className="text-slate-900 font-bold text-base">{users.length}</strong>
          </div>
          <div className="bg-emerald-50 px-4 py-2.5 rounded-xl border border-emerald-200 text-sm text-emerald-800 shadow-xs">
            Active: <strong className="text-emerald-900 font-bold text-base">{users.filter(u => u.status === 'Active').length}</strong>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-xs space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="sm:col-span-2">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="h-5 w-5" />
              </div>
              <input
                type="text"
                placeholder="Search by name, email, phone or state..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 text-slate-900 rounded-xl text-base focus:bg-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>

          <Select
            value={examFilter}
            onChange={(e) => setExamFilter(e.target.value)}
            options={['All', 'RRB NTPC', 'RRB Group D', 'RRB ALP', 'RRB JE', 'IBPS PO', 'APPSC']}
          />

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={['All', 'General', 'OBC', 'SC', 'ST', 'EWS']}
          />
        </div>
      </div>

      {/* Users Table */}
      {filteredUsers.length > 0 ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-xs">
          <table className="min-w-full divide-y divide-slate-200 text-left text-base">
            <thead className="bg-slate-50 text-xs font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th scope="col" className="px-6 py-4">Student Name</th>
                <th scope="col" className="px-4 py-4">Contact Info</th>
                <th scope="col" className="px-4 py-4">Target Exam & Category</th>
                <th scope="col" className="px-4 py-4">Domicile State</th>
                <th scope="col" className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-full bg-purple-50 border border-purple-200 text-purple-700 flex items-center justify-center font-bold text-sm shrink-0">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-base block">{user.name}</span>
                        <span className="text-[11px] text-slate-400 font-mono">Reg: {user.joinedDate || 'Recent'}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <p className="text-sm text-slate-900 font-mono">{user.email}</p>
                    <p className="text-xs text-slate-500 font-mono">{user.phone || 'No phone'}</p>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-purple-700 bg-purple-50 border border-purple-100 px-2 py-0.5 rounded-md">
                        {user.targetExam || 'General'}
                      </span>
                      {user.category && (
                        <span className="text-xs font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                          {user.category}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-slate-600">
                    {user.state || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <Eye className="h-4 w-4 mr-1.5" /> View
                    </Button>

                    <Button
                      size="sm"
                      variant={user.status === 'Active' ? 'danger' : 'success'}
                      onClick={() => toggleUserStatus(user.id)}
                    >
                      {user.status === 'Active' ? 'Disable' : 'Enable'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white p-8 rounded-2xl border border-slate-200">
          <EmptyState
            title={users.length === 0 ? "No registered candidate accounts yet" : "No students match the criteria"}
            description={users.length === 0 
              ? "When new students register or log in to take practice tests, their candidate profiles, attempt counts, and scores will appear here in real time."
              : "Try changing your search term or exam filters."
            }
            actionText={users.length === 0 ? undefined : "Clear Filters"}
            onAction={users.length === 0 ? undefined : () => {
              setSearchTerm('');
              setExamFilter('All');
            }}
          />
        </div>
      )}

      {/* User Detail Modal */}
      {selectedUserId && (
        <UserDetailsModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
          onStatusChange={handleModalStatusChange}
        />
      )}
    </div>
  );
};
