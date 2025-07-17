// src/components/Layout.jsx
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  Home,
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

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/', label: 'Jobs', icon: Home },
    { path: '/dashboard', label: 'Dashboard', icon: Calendar },
    { path: '/inventory', label: 'Inventory', icon: Package },
  ];

  if (!user) {
    return (
      <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        {children}
      </div>
    );
  }

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
                        ? 'bg-orange-800 text-white shadow-lg'
                        : 'bg-orange-600 text-white shadow-lg'
                      : 'text-orange-100 hover:text-white hover:bg-orange-600/30'
                    }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>

            {/* User Actions */}
            <div className="flex items-center gap-3">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-all duration-200 ${isDarkMode
                    ? 'bg-orange-800/50 hover:bg-orange-700/50 text-yellow-300'
                    : 'bg-orange-600/30 hover:bg-orange-600/50 text-yellow-200'
                  }`}
                title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* User Info */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDarkMode ? 'bg-orange-800/50' : 'bg-orange-600/30'
                }`}>
                <User className="w-4 h-4 text-orange-100" />
                <span className="text-sm font-medium text-orange-100">
                  {user.email}
                </span>
              </div>

              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isDarkMode
                    ? 'text-red-300 hover:text-red-200 hover:bg-red-900/20'
                    : 'text-red-200 hover:text-white hover:bg-red-600/30'
                  }`}
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="transition-colors duration-300">
        {children}
      </main>

      {/* Mobile Navigation */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 border-t backdrop-blur-sm ${isDarkMode
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
    </div>
  );
}