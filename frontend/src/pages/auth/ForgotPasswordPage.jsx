import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  KeyRound, 
  Mail, 
  Lock, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle2, 
  AlertCircle,
  Eye, 
  EyeOff 
} from 'lucide-react';
import { authApi } from '../../services/authApi';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();

  // Multi-step state: 'EMAIL' -> 'RESET' -> 'SUCCESS'
  const [step, setStep] = useState('EMAIL');
  
  // Fields
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Status states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Step 1: Verify Email
  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter your registered email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await authApi.forgotPassword(email.trim());
    setIsLoading(false);

    if (res.success) {
      setStep('RESET');
    } else {
      setErrorMessage(res.error || 'No registered student account found with this email.');
    }
  };

  // Step 2: Set New Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setErrorMessage('Please fill in both password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Passwords do not match. Please verify and try again.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await authApi.resetPassword(email.trim(), newPassword);
    setIsLoading(false);

    if (res.success) {
      setStep('SUCCESS');
    } else {
      setErrorMessage(res.error || 'Failed to reset password. Please try again.');
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Header Icon & Title */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center text-white shadow-md shadow-blue-500/20 mb-1">
            <KeyRound className="h-7 w-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
            {step === 'SUCCESS' ? 'Password Reset!' : 'Reset Password'}
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-sm mx-auto">
            {step === 'EMAIL' && 'Enter your registered email address to verify your account.'}
            {step === 'RESET' && 'Create a strong new password for your GovPrep account.'}
            {step === 'SUCCESS' && 'Your password has been updated. You can now log in.'}
          </p>
        </div>

        {/* Card Container */}
        <Card padding="lg" className="border border-slate-200/90 shadow-xl">
          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold animate-in shake">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Step 1: Email Form */}
          {step === 'EMAIL' && (
            <form onSubmit={handleVerifyEmail} className="space-y-4">
              <Input
                label="Registered Email Address"
                type="email"
                placeholder="student@govprep.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="h-5 w-5" />}
                required
                autoFocus
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Verify & Continue
              </Button>
            </form>
          )}

          {/* Step 2: New Password Form */}
          {step === 'RESET' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900">
                Resetting password for: <strong className="font-semibold">{email}</strong>
              </div>

              <Input
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="At least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                leftIcon={<Lock className="h-5 w-5" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="cursor-pointer hover:text-slate-700"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                }
                required
                autoFocus
              />

              <Input
                label="Confirm New Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Re-enter your new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="h-5 w-5" />}
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                isLoading={isLoading}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Update Password
              </Button>
            </form>
          )}

          {/* Step 3: Success Screen */}
          {step === 'SUCCESS' && (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex h-14 w-14 rounded-full bg-emerald-100 items-center justify-center text-emerald-600 mb-1">
                <CheckCircle2 className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold text-slate-900">Success!</h3>
                <p className="text-sm text-slate-600">
                  Your password has been reset successfully. You can now use your new password to sign in.
                </p>
              </div>

              <Button
                variant="primary"
                size="lg"
                fullWidth
                onClick={() => navigate('/login')}
                rightIcon={<ArrowRight className="h-5 w-5" />}
              >
                Sign In Now
              </Button>
            </div>
          )}

          {/* Back to Login Link */}
          <div className="mt-5 text-center text-sm text-slate-600 border-t border-slate-100 pt-4">
            <Link to="/login" className="inline-flex items-center gap-1.5 font-bold text-blue-600 hover:underline">
              <ArrowLeft className="h-4 w-4" />
              Back to Sign In
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
