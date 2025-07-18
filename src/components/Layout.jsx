// src/components/Layout.jsx
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Home,
  BarChart3,
  Briefcase,
  Calendar,
  Package,
  LogOut,
  Sun,
  Moon,
  User,
  HardHat
} from 'lucide-react';

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      // The ProtectedRoute component will automatically redirect to /login
      // But we can also explicitly navigate to be sure
      navigate('/login', { replace: true });
    } catch (error) {
      console.error('Logout failed:', error);
      // Even if logout fails, try to redirect to login
      navigate('/login', { replace: true });
    }
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Overview', icon: BarChart3 },     // Home becomes Overview
    { path: '/jobs', label: 'Jobs', icon: Briefcase },    // New Jobs page
    { path: '/dashboard', label: 'Schedule', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Package },
  ];

  // For unauthenticated users, show a simple layout
  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        {/* Simple header for login page */}
        <header className={`border-b ${isDarkMode
            ? 'bg-orange-900/90 border-orange-800'
            : 'bg-orange-500/95 border-orange-600'
          }`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo/Brand */}
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-800/50' : 'bg-orange-600/30'
                  }`}>
                  <HardHat className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  SupplyLine
                </span>
              </div>

              {/* Theme toggle for login page */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${isDarkMode
                    ? 'hover:bg-orange-800/50 text-orange-200'
                    : 'hover:bg-orange-600/30 text-orange-100'
                  }`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </header>

        {/* Content for unauthenticated users */}
        <main className="flex-1">
          {children}
        </main>
      </div>
    );
  }

  // For authenticated users, show full navigation
  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
      {/* Navigation Header - Orange Theme */}
      <header className={`sticky top-0 z-40 backdrop-blur-sm border-b ${isDarkMode
          ? 'bg-orange-900/90 border-orange-800'
          : 'bg-orange-500/95 border-orange-600'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">

            {/* Logo/Brand */}
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-800/50' : 'bg-orange-600/30'
                }`}>
                <HardHat className="w-6 h-6 text-white" />
              </div>
              <Link
                to="/"
                className="text-xl font-bold text-white hover:text-orange-100 transition-colors"
              >
                SupplyLine
              </Link>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(path)
                      ? isDarkMode
                        ? 'bg-orange-800/70 text-white'
                        : 'bg-orange-600/50 text-white'
                      : 'text-orange-200 hover:text-white hover:bg-orange-600/30'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Theme toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${isDarkMode
                    ? 'hover:bg-orange-800/50 text-orange-200'
                    : 'hover:bg-orange-600/30 text-orange-100'
                  }`}
                aria-label="Toggle theme"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>

              {/* User menu */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-orange-600/30">
                <User className="w-4 h-4 text-orange-200" />
                <span className="text-sm text-orange-100 hidden sm:block">
                  {user?.email?.split('@')[0] || 'User'}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDarkMode
                    ? 'text-orange-200 hover:text-white hover:bg-red-600/50'
                    : 'text-orange-100 hover:text-white hover:bg-red-500/50'
                  }`}
                aria-label="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:block">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation */}
      <nav className={`md:hidden sticky top-16 z-30 border-b ${isDarkMode
          ? 'bg-orange-900/90 border-orange-800'
          : 'bg-orange-500/95 border-orange-600'
        }`}>
        <div className="flex justify-around py-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${isActive(path)
                  ? 'text-white'
                  : 'text-orange-200 hover:text-white'
                }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}