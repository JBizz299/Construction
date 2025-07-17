// src/pages/Dashboard.jsx
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { MigrationService } from '../utils/migrationScript';
import JobBoard from '../components/JobBoard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import DashboardStats from '../components/DashboardStats';
import { startOfWeek, format, addDays } from 'date-fns';
import { AlertCircle, Calendar, Users, Briefcase, Clock } from 'lucide-react';

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

  // Auto-migrate on first load
  useEffect(() => {
    if (!user || migrationStatus.checked) return;

    const performMigration = async () => {
      try {
        const result = await migrationService.autoMigrateIfNeeded();
        setMigrationStatus({
          checked: true,
          ...result
        });
      } catch (error) {
        console.error('Migration failed:', error);
        setMigrationStatus({
          checked: true,
          migrated: false,
          error: error.message
        });
      }
    };

    performMigration();
  }, [user, migrationService, migrationStatus.checked]);

  // Navigation functions
  const goBackOneDay = () => setCurrentStartDate(d => addDays(d, -1));
  const goForwardOneDay = () => setCurrentStartDate(d => addDays(d, 1));
  const goToToday = () => setCurrentStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (document.querySelector('[role="dialog"]') || document.activeElement.tagName === 'INPUT') {
        return;
      }

      if (e.key === 'ArrowLeft') {
        goBackOneDay();
      } else if (e.key === 'ArrowRight') {
        goForwardOneDay();
      } else if (e.key === 't' || e.key === 'T') {
        goToToday();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const stats = getAssignmentStats();
  const jobOptions = getJobOptions();

  return (
    <div className="w-full max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Contractor Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your team assignments and scheduling</p>
        </div>

        {/* Migration Status */}
        {migrationStatus.migrated && (
          <div className="bg-green-50 text-green-800 px-3 py-2 rounded-lg text-sm">
            ✅ Data migrated successfully
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <DashboardStats
        stats={stats}
        subcontractors={subcontractors}
        assignments={assignments}
      />

      {/* Status indicators */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          {saving && (
            <div className="flex items-center text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </div>
          )}

          {error && (
            <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          {subcontractors.length === 0 && (
            <div className="flex items-center text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded">
              <AlertCircle className="w-4 h-4 mr-2" />
              No subcontractors found. Add team members from job pages to get started.
            </div>
          )}
        </div>

        <div className="text-sm text-gray-500">
          {subcontractors.length} subcontractors • {jobOptions.length} jobs available
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goBackOneDay}
          className="flex items-center px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          aria-label="Previous day (←)"
        >
          ← Previous Day
        </button>

        <div className="flex items-center space-x-4">
          <button
            onClick={goToToday}
            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
            title="Go to today (T)"
          >
            Today
          </button>
          <div className="font-semibold text-lg">
            Week of {format(currentStartDate, 'MMM dd, yyyy')}
          </div>
        </div>

        <button
          onClick={goForwardOneDay}
          className="flex items-center px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          aria-label="Next day (→)"
        >
          Next Day →
        </button>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
        <p>💡 <strong>Shortcuts:</strong> Use ← → arrow keys to navigate, <kbd>T</kbd> for today, <kbd>ESC</kbd> to close modals</p>
      </div>

      {/* Job Board */}
      <JobBoard
        startDate={currentStartDate}
        assignments={assignments}
        subcontractors={subcontractors}
        jobOptions={jobOptions}
        onUpdate={updateAssignment}
        loading={saving}
      />

      {/* Quick Actions */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="font-semibold mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => window.open('/jobs', '_blank')}
            className="bg-blue-100 text-blue-800 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors text-sm"
          >
            Manage Jobs
          </button>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              const unassignedSubs = subcontractors.filter(sub =>
                !assignments[`${sub.id}-${today}`]
              );
              if (unassignedSubs.length > 0) {
                alert(`${unassignedSubs.length} subcontractors available for today`);
              } else {
                alert('All subcontractors are assigned for today');
              }
            }}
            className="bg-green-100 text-green-800 px-3 py-2 rounded-lg hover:bg-green-200 transition-colors text-sm"
          >
            Check Availability
          </button>
          <button
            onClick={() => {
              const weekAssignments = Object.entries(assignments).filter(([key]) => {
                const date = new Date(key.split('-').slice(1).join('-'));
                const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
                const weekEnd = addDays(weekStart, 6);
                return date >= weekStart && date <= weekEnd;
              });
              alert(`${weekAssignments.length} assignments this week`);
            }}
            className="bg-purple-100 text-purple-800 px-3 py-2 rounded-lg hover:bg-purple-200 transition-colors text-sm"
          >
            Weekly Summary
          </button>
        </div>
      </div>
    </div>
  );
}