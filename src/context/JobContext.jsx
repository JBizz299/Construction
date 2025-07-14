import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, addDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from './AuthContext';

const JobContext = createContext();

export function useJobs() {
  return useContext(JobContext);
}

export function JobProvider({ children }) {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setJobs([]);
      setLoading(false);
      return;
    }

    const jobsRef = collection(db, 'jobs');
    // Query jobs only for the current user, order by creation date desc
    const q = query(jobsRef, where('userId', '==', user.uid), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setJobs(jobsData);
      setLoading(false);
    });

    return unsubscribe; // cleanup on unmount or user change
  }, [user]);

  async function addJob(newJob) {
    if (!user) throw new Error('No user logged in');
    const jobsRef = collection(db, 'jobs');

    // Add userId and timestamp on the job document
    const jobToAdd = {
      ...newJob,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    };

    try {
      await addDoc(jobsRef, jobToAdd);
      // onSnapshot will auto-update jobs state
    } catch (e) {
      console.error('Failed to add job:', e);
      throw e;
    }
  }

  const value = {
    jobs,
    addJob,
    loading,
  };

  return (
    <JobContext.Provider value={value}>
      {!loading && children}
    </JobContext.Provider>
  );
}