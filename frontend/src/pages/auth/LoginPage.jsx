import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isAuthenticated, role: currentRole, logout } = useAuth();

  // If user is already authenticated as a student, redirect to dashboard
  React.useEffect(() => {
    if (isAuthenticated) {
      if (currentRole === 'ADMIN') {
        // If an admin token is found in student app, clear it out
        logout();
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, [isAuthenticated, currentRole, navigate, logout]);

  // Form Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Submit Handler
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please fill in both email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    // Attempt student login
    const res = await login(email, password, 'USER');
    setIsLoading(false);

    if (res.success) {
      navigate('/dashboard');
    } else {
      // Check if the rejection or returned error indicates an admin account
      if (res.error && (res.error.toLowerCase().includes('admin') || res.error.includes('administrator'))) {
        setErrorMessage('This account has Administrator privileges. Please access the separate Admin Portal to log in.');
      } else {
        setErrorMessage(res.error || 'Invalid email or password.');
      }
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 items-center justify-center text-white shadow-md shadow-blue-500/20 mb-1">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-heading tracking-tight">
            Login
          </h1>
          <p className="text-sm sm:text-base text-slate-500 max-w-sm mx-auto">
            Sign in to access your government exam mock tests, test history, and AI analysis.
          </p>
        </div>

        {/* Login Form Card */}
        <Card padding="lg" className="border border-slate-200/90 shadow-xl">
          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2.5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold animate-in shake">
              <AlertCircle className="h-5 w-5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email Address"
              type="email"
              placeholder="student@govprep.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-5 w-5" />}
              required
            />

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-semibold text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Sign In
            </Button>
          </form>

          <div className="mt-5 text-center text-sm text-slate-600">
            Don't have an account yet?{' '}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">
              Create Account
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};
