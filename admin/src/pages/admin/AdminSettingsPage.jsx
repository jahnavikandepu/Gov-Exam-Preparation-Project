import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, Input } from '../../components/common';
import { Shield, CheckCircle2 } from 'lucide-react';

export const AdminSettingsPage = () => {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Admin System Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Platform administration and active administrator profile credentials.</p>
      </div>

      <div className="max-w-2xl">
        {/* Administrator Profile Card */}
        <Card className="p-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Current Administrator</h2>
              <p className="text-xs text-slate-500">Active session credentials & security role</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Full Name</label>
              <Input type="text" value={user?.name || 'Administrator'} disabled className="bg-slate-50 font-medium text-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email Address</label>
              <Input type="email" value={user?.email || ''} disabled className="bg-slate-50 font-medium text-slate-800" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Security Role</label>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                ADMIN (Full Privileges)
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
