import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  Mail, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  AlertCircle,
  KeyRound
} from 'lucide-react';
import { useAdminAuth } from '../../context/AuthContext';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';

export const AdminLoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAdminAuth();

  // If already authenticated as admin, redirect to dashboard
  useEffect(() => {
    if (isAuthenticated) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const [email, setEmail] = useState('admin@govprep.com');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both administrator email and password.');
      return;
    }

    setIsLoading(true);
    setErrorMessage('');

    const res = await login(email, password);
    setIsLoading(false);

    if (res.success) {
      const from = location.state?.from?.pathname || '/dashboard';
      navigate(from, { replace: true });
    } else {
      setErrorMessage(res.error || 'Invalid administrator credentials.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 items-center justify-center text-white shadow-lg shadow-purple-500/20 mb-2">
            <ShieldCheck className="h-9 w-9" />
          </div>
          <div className="flex justify-center">
            <Badge variant="purple" size="md">
              GovPrep Master Control
            </Badge>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 font-heading tracking-tight">
            Administrator Portal
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Authorized personnel only • Authenticate with administrator credentials to manage the platform
          </p>
        </div>

        {/* Login Card */}
        <Card padding="lg" className="border border-slate-200/90 shadow-xl">
          {/* Error Alert */}
          {errorMessage && (
            <div className="mb-4 flex items-center gap-2 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold animate-in shake">
              <AlertCircle className="h-4.5 w-4.5 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Administrator Email"
              type="email"
              placeholder="admin@govprep.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="h-5 w-5" />}
              required
            />

            <Input
              label="Password"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••••••"
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

            <Button
              type="submit"
              variant="purple"
              size="lg"
              fullWidth
              isLoading={isLoading}
              rightIcon={<ArrowRight className="h-5 w-5" />}
            >
              Sign in
            </Button>
          </form>

          {/* Demo Admin Credentials Quick Box */}
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-700 flex items-center gap-1.5">
                <KeyRound className="h-4 w-4 text-purple-600" />
                Default Admin Credentials
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail('admin@govprep.com');
                  setPassword('admin123');
                }}
                className="text-xs font-bold text-purple-600 hover:text-purple-800 hover:underline cursor-pointer"
              >
                Auto-fill
              </button>
            </div>
            <div className="font-mono text-xs text-slate-600 space-y-1 bg-white p-2.5 rounded-lg border border-slate-200">
              <p>Email: <strong className="text-slate-900">admin@govprep.com</strong></p>
              <p>Password: <strong className="text-slate-900">admin123</strong></p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
