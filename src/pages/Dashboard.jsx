import { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import JobBoard from '../components/JobBoard';

export default function Dashboard() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState({});

  useEffect(() => {
    if (!user) return;

    const fetchAssignments = async () => {
      const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setAssignments(docSnap.data());
      }
    };

    fetchAssignments();
  }, [user]);

  const updateAssignment = async (subId, day, job) => {
    const newAssignments = {
      ...assignments,
      [`${subId}-${day}`]: job,
    };
    setAssignments(newAssignments);

    const docRef = doc(db, 'users', user.uid, 'dashboard', 'assignments');
    await setDoc(docRef, newAssignments);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Contractor Coordination</h1>
      <JobBoard
        assignments={assignments}
        onUpdate={updateAssignment}
      />
    </div>
  );
}
