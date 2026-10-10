import React, { useState, useEffect } from 'react';
import { User, Mail, Lock, Check, Save } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../services/authApi';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Button } from '../../components/common/Button';

export const ProfilePage = () => {
  const { user, updateUser } = useAuth();

  // Personal Info Form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [targetExam, setTargetExam] = useState(user?.targetExam || 'RRB NTPC');
  const [category, setCategory] = useState(user?.category || 'General');
  const [state, setState] = useState(user?.state || 'Andhra Pradesh');
  const [qualification, setQualification] = useState(user?.qualification || 'Graduate / Bachelor\'s Degree');
  const [gender, setGender] = useState(user?.gender || 'Male');
  const [infoSaved, setInfoSaved] = useState(false);
  const [infoError, setInfoError] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Change Password Form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwSaved, setPwSaved] = useState(false);
  const [pwError, setPwError] = useState('');
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      if (user.targetExam) setTargetExam(user.targetExam);
      if (user.category) setCategory(user.category);
      if (user.state) setState(user.state);
      if (user.qualification) setQualification(user.qualification);
      if (user.gender) setGender(user.gender);
    }
  }, [user]);

  const handleSaveInfo = async (e) => {
    e.preventDefault();
    setSavingInfo(true);
    setInfoError('');
    try {
      const res = await authApi.updateProfile({ 
        name, 
        phone, 
        targetExam, 
        category, 
        state, 
        qualification, 
        gender 
      });
      if (res.success && res.user) {
        if (updateUser) updateUser(res.user);
        setInfoSaved(true);
        setTimeout(() => setInfoSaved(false), 3000);
      } else {
        setInfoError(res.message || 'Failed to update profile.');
      }
    } catch (err) {
      setInfoError(err.message || 'Failed to update profile.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (!currentPassword) {
      setPwError('Please enter your current password');
      return;
    }
    if (newPassword.length < 6) {
      setPwError('New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setSavingPw(true);
    setPwError('');
    try {
      const res = await authApi.changePassword({ currentPassword, newPassword });
      if (res.success) {
        setPwSaved(true);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPwSaved(false), 3000);
      } else {
        setPwError(res.message || 'Failed to change password.');
      }
    } catch (err) {
      setPwError(err.message || 'Failed to change password.');
    } finally {
      setSavingPw(false);
    }
  };

  const initials = (name || user?.name || 'User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-extrabold text-2xl shadow-md shadow-blue-500/20 shrink-0">
          {initials}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-heading">
            Profile & Account Settings
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Manage your candidate profile, target exam preferences, and login credentials.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. PERSONAL INFORMATION */}
        <Card padding="lg" className="border border-slate-200/90 space-y-6">
          <div className="border-b border-slate-100 pb-3.5">
            <h2 className="text-xl font-bold text-slate-900">Personal & Academic Details</h2>
            <p className="text-sm text-slate-500 mt-0.5">Keep your recruitment details up to date.</p>
          </div>

          <form onSubmit={handleSaveInfo} className="space-y-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              leftIcon={<User className="h-5 w-5" />}
              required
            />

            <Input
              label="Email Address"
              type="email"
              value={email}
              disabled
              helperText="Email address cannot be changed."
              leftIcon={<Mail className="h-5 w-5" />}
              required
            />

            <Input
              label="Mobile Number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="e.g. 9876543210"
              helperText="Used for notifications and candidate verification."
            />

            <Select
              label="Primary Target Exam"
              value={targetExam}
              onChange={(e) => setTargetExam(e.target.value)}
              options={[
                'RRB NTPC',
                'RRB Group D',
                'RRB ALP',
                'RRB JE',
                'IBPS PO',
                'APPSC',
              ]}
              helperText="Determines your customized dashboard suggestions."
            />

            <div className="grid grid-cols-2 gap-3">
              <Select
                label="Category / Quota"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                options={['General', 'OBC', 'SC', 'ST', 'EWS']}
              />

              <Select
                label="Gender"
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                options={['Male', 'Female', 'Other']}
              />
            </div>

            <Select
              label="State / Domicile"
              value={state}
              onChange={(e) => setState(e.target.value)}
              options={[
                'Andhra Pradesh',
                'Telangana',
                'Uttar Pradesh',
                'Bihar',
                'Maharashtra',
                'Rajasthan',
                'Madhya Pradesh',
                'West Bengal',
                'Tamil Nadu',
                'Karnataka',
                'Delhi NCR',
                'Other State / UT',
              ]}
            />

            <Select
              label="Highest Qualification"
              value={qualification}
              onChange={(e) => setQualification(e.target.value)}
              options={[
                'Graduate / Bachelor\'s Degree',
                'Engineering / B.Tech / BE',
                '12th / Intermediate',
                '10th / Matriculation',
                'Post Graduate / Master\'s',
                'Diploma',
              ]}
            />

            {infoSaved && (
              <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 animate-in fade-in">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                Profile updated successfully.
              </div>
            )}

            {infoError && (
              <p className="text-sm font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {infoError}
              </p>
            )}

            <div className="pt-2">
              <Button type="submit" variant="primary" size="md" disabled={savingInfo} leftIcon={<Save className="h-4 w-4" />}>
                {savingInfo ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </Card>

        {/* 2. CHANGE PASSWORD */}
        <Card padding="lg" className="border border-slate-200/90 space-y-6">
          <div className="border-b border-slate-100 pb-3.5">
            <h2 className="text-xl font-bold text-slate-900">Change Password</h2>
            <p className="text-sm text-slate-500 mt-0.5">Ensure your account remains safe and secure.</p>
          </div>

          <form onSubmit={handleSavePassword} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              placeholder="Enter existing password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              leftIcon={<Lock className="h-5 w-5" />}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="Minimum 6 characters"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="h-5 w-5" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="h-5 w-5" />}
              required
            />

            {pwError && (
              <p className="text-sm font-semibold text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200">
                {pwError}
              </p>
            )}

            {pwSaved && (
              <div className="flex items-center gap-2.5 text-sm font-semibold text-emerald-800 bg-emerald-50 p-3 rounded-xl border border-emerald-200 animate-in fade-in">
                <Check className="h-5 w-5 text-emerald-600 shrink-0" />
                Password changed successfully.
              </div>
            )}

            <div className="pt-2">
              <Button type="submit" variant="secondary" size="md" disabled={savingPw}>
                {savingPw ? 'Updating...' : 'Update Password'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};
