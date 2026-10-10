import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  ShieldCheck, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../common/Button';

export const Navbar = () => {
  const { user, role, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogoutClick = () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    logout();
    navigate('/login');
  };

  const navLinkClasses = ({ isActive }) =>
    `text-base font-medium transition-colors px-3.5 py-2 rounded-lg ${
      isActive
        ? 'text-blue-600 bg-blue-50/80 font-semibold'
        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-50'
    }`;

  const mobileNavLinkClasses = ({ isActive }) =>
    `block px-4 py-2.5 rounded-lg text-base font-medium transition-colors ${
      isActive
        ? 'text-blue-600 bg-blue-50 font-semibold'
        : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
    }`;

  // Hide regular navbar on mock test active screen to give full focus
  const isTestTakingPage =
    location.pathname.startsWith('/tests/') &&
    !location.pathname.endsWith('/instructions') &&
    location.pathname.split('/').length === 3;
  if (isTestTakingPage) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 font-heading">
                Gov<span className="text-blue-600">Prep</span>
              </span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1.5">
              {/* If Logged Out */}
              {!isAuthenticated && (
                <>
                  <NavLink to="/" className={navLinkClasses} end>
                    Home
                  </NavLink>
                  <NavLink to="/exams" className={navLinkClasses}>
                    Exams
                  </NavLink>
                  <NavLink to="/about" className={navLinkClasses}>
                    About
                  </NavLink>
                </>
              )}

              {/* If Student Logged In (USER) */}
              {isAuthenticated && role === 'USER' && (
                <>
                  <NavLink to="/dashboard" className={navLinkClasses}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/exams" className={navLinkClasses}>
                    Exams
                  </NavLink>
                  <NavLink to="/tests" className={navLinkClasses}>
                    Tests
                  </NavLink>
                  <NavLink to="/progress" className={navLinkClasses}>
                    Progress
                  </NavLink>
                  <NavLink to="/weaknesses" className={navLinkClasses}>
                    AI Analysis
                  </NavLink>
                  <NavLink to="/history" className={navLinkClasses}>
                    History
                  </NavLink>
                </>
              )}
            </nav>
          </div>

          {/* Right Action buttons */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated && role === 'USER' ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  aria-label="User account menu"
                  className="h-9 w-9 rounded-full font-bold text-sm flex items-center justify-center border transition-all hover:scale-105 shadow-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 bg-blue-100 text-blue-700 border-blue-300 focus:ring-blue-500"
                  title={user?.name || 'Student'}
                >
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'ST'}
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserDropdownOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-60 rounded-xl bg-white p-2 shadow-xl border border-slate-100 z-20 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-3.5 py-2.5 border-b border-slate-100 mb-1">
                        <p className="text-sm font-bold text-slate-900">{user?.name}</p>
                        <p className="text-sm text-slate-500 truncate">{user?.email}</p>
                        <span className="inline-block mt-1 text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100">
                          {user?.targetExam || 'General'}
                        </span>
                      </div>

                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900"
                      >
                        <LayoutDashboard className="h-4 w-4 text-slate-400" />
                        Dashboard
                      </Link>
                      <Link
                        to="/profile"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-slate-700 rounded-lg hover:bg-slate-50 hover:text-slate-900"
                      >
                        <UserIcon className="h-4 w-4 text-slate-400" />
                        Profile Settings
                      </Link>

                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={handleLogoutClick}
                        className="w-full flex items-center gap-2.5 px-3.5 py-2 text-sm font-medium text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                      >
                        <LogOut className="h-4 w-4 text-rose-500" />
                        Logout
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link to="/login">
                  <Button variant="ghost" size="md">
                    Login
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="md">
                    Register
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2 animate-in slide-in-from-top duration-200 shadow-xl">
          {!isAuthenticated && (
            <>
              <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses} end>
                Home
              </NavLink>
              <NavLink to="/exams" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                Exams
              </NavLink>
              <NavLink to="/about" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                About
              </NavLink>
              <div className="pt-4 flex flex-col gap-2 border-t border-slate-100">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button fullWidth variant="outline">
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button fullWidth variant="primary">
                    Create Account
                  </Button>
                </Link>
              </div>
            </>
          )}

          {isAuthenticated && role === 'USER' && (
            <>
              <NavLink to="/" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses} end>
                Home
              </NavLink>
              <NavLink to="/exams" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                Exams
              </NavLink>
              <div className="my-2 border-t border-slate-100 pt-2">
                <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Student Area</p>
                <NavLink to="/dashboard" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                  Dashboard
                </NavLink>
                <NavLink to="/exams" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                  Exams
                </NavLink>
                <NavLink to="/tests" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                  Tests & Mocks
                </NavLink>
                <NavLink to="/progress" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                  Preparation Progress
                </NavLink>
                <NavLink to="/weaknesses" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                  AI Analysis
                </NavLink>
                <NavLink to="/history" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                  Test History
                </NavLink>
                <NavLink to="/profile" onClick={() => setMobileMenuOpen(false)} className={mobileNavLinkClasses}>
                  Profile
                </NavLink>
              </div>
              <button
                onClick={handleLogoutClick}
                className="w-full text-left px-4 py-2.5 rounded-lg text-base font-medium text-rose-600 hover:bg-rose-50"
              >
                Logout
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
