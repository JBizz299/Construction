// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { MigrationService } from '../utils/migrationScript';
import JobBoard from '../components/JobBoard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { startOfWeek, format, addDays } from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar,
  Users,
  Clock,
  Sun,
  Moon
} from 'lucide-react';

export default function Dashboard() {
  const { user } = useAuth();
  const {
    assignments,
    subcontractors,
    loading,
    saving,
    error,
    updateAssignment,
    getJobOptions,
    getAssignmentStats
  } = useDashboardData();

  const [migrationService] = useState(() => new MigrationService(user?.uid));
  const [migrationStatus, setMigrationStatus] = useState({ checked: false });
  const [currentStartDate, setCurrentStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Auto-migrate on first load
  useEffect(() => {
    if (!user || migrationStatus.checked) return;

    const performMigration = async () => {
      try {
        const result = await migrationService.autoMigrateIfNeeded();
        setMigrationStatus({ checked: true, ...result });
      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationStatus({ checked: true, migrated: false, error: error.message });
      }
    };

    performMigration();
  }, [user, migrationService, migrationStatus.checked]);

  // Navigation
  const goBackOneWeek = () => setCurrentStartDate(d => addDays(d, -7));
  const goForwardOneWeek = () => setCurrentStartDate(d => addDays(d, 7));
  const goToThisWeek = () => setCurrentStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.querySelector('[role="dialog"]') || document.activeElement.tagName === 'INPUT') {
        return;
      }

      if (e.key === 'ArrowLeft') goBackOneWeek();
      else if (e.key === 'ArrowRight') goForwardOneWeek();
      else if (e.key === 't' || e.key === 'T') goToThisWeek();
      else if (e.key === 'd' || e.key === 'D') setIsDarkMode(!isDarkMode);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDarkMode]);

  if (loading) return <LoadingSkeleton />;

  const stats = getAssignmentStats();
  const jobOptions = getJobOptions();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
      <div className="max-w-7xl mx-auto px-6 py-8">

        {/* Header */}
        <div className={`rounded-2xl p-6 mb-8 backdrop-blur-sm ${isDarkMode
            ? 'bg-gray-800/50 border border-gray-700'
            : 'bg-white/80 border border-gray-200 shadow-sm'
          }`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                }`}>
                Team Schedule
              </h1>
              <p className={`text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>
                {format(currentStartDate, 'MMMM d')} - {format(addDays(currentStartDate, 6), 'MMMM d, yyyy')}
              </p>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-8">
              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                  {stats.totalAssignments}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  Assignments
                </div>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>
                  {stats.assignedSubcontractors}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  Active Subs
                </div>
              </div>

              <div className="text-center">
                <div className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>
                  {stats.uniqueJobs}
                </div>
                <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                  Jobs
                </div>
              </div>
            </div>

            {/* Theme Toggle */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-xl transition-all duration-200 ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-yellow-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                }`}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={goBackOneWeek}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
              }`}
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Week
          </button>

          <div className="flex items-center gap-4">
            <button
              onClick={goToThisWeek}
              className={`px-4 py-2 text-sm rounded-lg transition-all duration-200 ${isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                }`}
            >
              This Week
            </button>
          </div>

          <button
            onClick={goForwardOneWeek}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${isDarkMode
                ? 'bg-gray-800 hover:bg-gray-700 text-white border border-gray-700'
                : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
              }`}
          >
            Next Week
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            {saving && (
              <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                }`}>
                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                Saving changes...
              </div>
            )}

            {error && (
              <div className={`flex items-center gap-2 text-sm px-3 py-1 rounded-lg ${isDarkMode
                  ? 'bg-red-900/20 text-red-400 border border-red-800'
                  : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                ⚠️ {error}
              </div>
            )}
          </div>

          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            {subcontractors.length} contractors • {jobOptions.length} jobs • Press T for this week
          </div>
        </div>

        {/* Main Calendar */}
        <JobBoard
          startDate={currentStartDate}
          assignments={assignments}
          subcontractors={subcontractors}
          jobOptions={jobOptions}
          onUpdate={updateAssignment}
          loading={saving}
          isDarkMode={isDarkMode}
        />

        {/* Empty State */}
        {subcontractors.length === 0 && (
          <div className={`text-center py-16 rounded-2xl ${isDarkMode ? 'bg-gray-800/50 border border-gray-700' : 'bg-white/80 border border-gray-200'
            }`}>
            <Users className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'
              }`} />
            <h3 className={`text-xl font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              No Team Members Yet
            </h3>
            <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
              Add subcontractors from your job pages to start scheduling
            </p>
            <button
              onClick={() => window.open('/jobs', '_blank')}
              className="bg-blue-600 text-white px-6 py-3 rounded-xl hover:bg-blue-700 transition-colors"
            >
              Go to Jobs
            </button>
          </div>
        )}
      </div>
    </div>
  );
}