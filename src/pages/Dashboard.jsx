import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import JobBoard from '../components/JobBoard';
import { startOfWeek, format, addDays, isAfter, isBefore } from 'date-fns';

export default function Dashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState({});
  // currentStartDate is the first day shown on the board, default to this week's Monday
  const [currentStartDate, setCurrentStartDate] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );

  // Load assignments from Firestore (single doc with flat keys)
  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAssignments(docSnap.data());
      } else {
        setAssignments({});
      }
    };

    fetchAssignments();
  }, [user]);

  // Save assignments to Firestore
  const updateAssignment = async (subId, dateKey, job) => {
    const newAssignments = {
      ...assignments,
      [`${subId}-${dateKey}`]: job,
    };
    // Remove assignment if job is empty string (cleanup)
    if (!job) {
      delete newAssignments[`${subId}-${dateKey}`];
    }
    setAssignments(newAssignments);

    const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
    await setDoc(docRef, newAssignments);
  };

  // Auto-shift the board if current date is beyond the displayed week (optional)
  useEffect(() => {
    const today = new Date();
    const weekEnd = addDays(currentStartDate, 6);
    if (isAfter(today, weekEnd)) {
      setCurrentStartDate(startOfWeek(today, { weekStartsOn: 1 }));
    }
  }, [currentStartDate]);

  // Navigate backward or forward by one day
  const goBackOneDay = () => setCurrentStartDate(d => addDays(d, -1));
  const goForwardOneDay = () => setCurrentStartDate(d => addDays(d, 1));

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Contractor Coordination</h1>

      <div className="flex justify-between items-center mb-4">
        <button
          onClick={goBackOneDay}
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
          aria-label="Previous day"
        >
          ← Previous Day
        </button>
        <div className="font-semibold">
          Week of {format(currentStartDate, 'MMM dd, yyyy')}
        </div>
        <button
          onClick={goForwardOneDay}
          className="px-3 py-1 bg-gray-300 rounded hover:bg-gray-400"
          aria-label="Next day"
        >
          Next Day →
        </button>
      </div>

      <JobBoard
        startDate={currentStartDate}
        assignments={assignments}
        onUpdate={updateAssignment}
      />
    </div>
  );
}
