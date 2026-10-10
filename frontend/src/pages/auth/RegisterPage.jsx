import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ArrowRight, 
  AlertCircle, 
  MapPin, 
  GraduationCap, 
  Award,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Select } from '../../components/common/Select';
import { Card } from '../../components/common/Card';

export const RegisterPage = () => {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [targetExam, setTargetExam] = useState('RRB NTPC');
  const [category, setCategory] = useState('General');
  const [state, setState] = useState('Andhra Pradesh');
  const [qualification, setQualification] = useState('Graduate / Bachelor\'s Degree');
  const [gender, setGender] = useState('Male');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const validate = () => {
    const errs = {};
    if (!fullName.trim()) {
      errs.fullName = 'Full name is required';
    }

    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }

    if (phone.trim() && !/^\+?[0-9]{10,12}$/.test(phone.replace(/[\s-]/g, ''))) {
      errs.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters';
    }

    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    // Public registration stores all candidate details in database
    const candidateData = {
      name: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      targetExam,
      category,
      state,
      qualification,
      gender,
      password,
    };

    const res = await register(candidateData);
    setIsLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      setErrors({ form: res.error || 'Registration failed' });
    }
  };

  return (
    <div className="min-h-[90vh] flex items-center justify-center px-4 py-10">
      <div className="max-w-2xl w-full space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center text-white shadow-md shadow-blue-500/20 mb-1">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading">
            Student Registration
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-lg mx-auto">
            Create your candidate profile to access AI-powered mock tests, real-time analytics, and rank predictions.
          </p>
        </div>

        {/* Form Card */}
        <Card padding="lg" className="border border-slate-200/90 shadow-xl bg-white rounded-3xl">
          {errors.form && (
            <div className="mb-6 flex items-center gap-2.5 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{errors.form}</span>
            </div>
          )}

          <form onSubmit={handleRegister} className="space-y-6">
            {/* 1. Basic Details */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <User className="h-4 w-4 text-blue-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Candidate Personal Details
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name"
                  placeholder="e.g. Rahul Kumar"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  error={errors.fullName}
                  leftIcon={<User className="h-4.5 w-4.5" />}
                  required
                />

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="e.g. rahul.kumar@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  leftIcon={<Mail className="h-4.5 w-4.5" />}
                  required
                />

                <Input
                  label="Mobile Number (Optional)"
                  type="tel"
                  placeholder="e.g. 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  error={errors.phone}
                  leftIcon={<Phone className="h-4.5 w-4.5" />}
                  helperText="Optional - for test alerts & candidate notifications"
                />

                <Select
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  options={['Male', 'Female', 'Other']}
                />
              </div>
            </div>

            {/* 2. Target Exam & Academic Profile */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <GraduationCap className="h-4 w-4 text-purple-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Target Exam & Academic Profile
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                  helperText="Determines syllabus & adaptive mocks."
                />

                <Select
                  label="Category / Reservation Quota"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  options={[
                    'General',
                    'OBC',
                    'SC',
                    'ST',
                    'EWS',
                  ]}
                  helperText="For cutoff & percentile benchmarking."
                />

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
              </div>
            </div>

            {/* 3. Account Password */}
            <div>
              <div className="flex items-center gap-2 mb-3 pb-2 border-b border-slate-100">
                <Lock className="h-4 w-4 text-emerald-600" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                  Account Security
                </h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Password"
                  type="password"
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  leftIcon={<Lock className="h-4.5 w-4.5" />}
                  required
                />

                <Input
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={errors.confirmPassword}
                  leftIcon={<Lock className="h-4.5 w-4.5" />}
                  required
                />
              </div>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Register & Start Preparing
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center text-sm text-slate-600 border-t border-slate-100 pt-5">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Log in here
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

