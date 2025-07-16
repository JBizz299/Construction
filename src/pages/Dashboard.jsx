import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import JobBoard from '../components/JobBoard';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { startOfWeek, format, addDays, isAfter, isBefore } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  // currentStartDate is the first day shown on the board, default to this week's Monday
  const [currentStartDate, setCurrentStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Load assignments from Firestore (single doc with flat keys)
  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      try {
        setLoading(true);
        setError(null);

        const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setAssignments(docSnap.data());
        } else {
          setAssignments({});
        }
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError('Failed to load assignments. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, [user]);

  // Save assignments to Firestore with loading state
  const updateAssignment = async (subId, dateKey, job) => {
    try {
      setSaving(true);
      setError(null);

      const newAssignments = {
        ...assignments,
        [`${subId}-${dateKey}`]: job,
      };

      // Remove assignment if job is empty string (cleanup)
      if (!job) {
        delete newAssignments[`${subId}-${dateKey}`];
      }

      // Optimistically update UI
      setAssignments(newAssignments);

      // Save to Firestore
      const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
      await setDoc(docRef, newAssignments);

    } catch (err) {
      console.error('Error updating assignment:', err);
      setError('Failed to save assignment. Please try again.');

      // Revert optimistic update on error
      const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAssignments(docSnap.data());
      }
    } finally {
      setSaving(false);
    }
  };

  // Auto-shift the board if current date is beyond the displayed week (optional)
  useEffect(() => {
    const checkAndUpdateDate = () => {
      const today = new Date();
      const weekEnd = addDays(currentStartDate, 6);
      const newStartDate = startOfWeek(today, { weekStartsOn: 1 });

      // Only update if we're past the current week AND the new date is different
      if (isAfter(today, weekEnd) && newStartDate.getTime() !== currentStartDate.getTime()) {
        setCurrentStartDate(newStartDate);
      }
    };

    // Check immediately on mount
    checkAndUpdateDate();

    // Then check every minute
    const interval = setInterval(checkAndUpdateDate, 60000);

    return () => clearInterval(interval);
  }, []);

  // Navigate backward or forward by one day
  const goBackOneDay = () => setCurrentStartDate(d => addDays(d, -1));
  const goForwardOneDay = () => setCurrentStartDate(d => addDays(d, 1));

  // Navigate to today
  const goToToday = () => setCurrentStartDate(startOfWeek(new Date(), { weekStartsOn: 1 }));

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Only handle shortcuts if no modal is open
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

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Contractor Coordination</h1>

        {/* Status indicators */}
        <div className="flex items-center space-x-4">
          {saving && (
            <div className="flex items-center text-sm text-blue-600">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-2"></div>
              Saving...
            </div>
          )}

          {error && (
            <div className="flex items-center text-sm text-red-600 bg-red-50 px-3 py-1 rounded">
              <span className="mr-2">⚠️</span>
              {error}
            </div>
          )}
        </div>
      </div>

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
      <div className="mb-4 text-sm text-gray-600">
        <p>💡 Use ← → arrow keys to navigate, T for today, ESC to close modals</p>
      </div>

      <JobBoard
        startDate={currentStartDate}
        assignments={assignments}
        onUpdate={updateAssignment}
        loading={saving}
      />
    </div>
  );
}