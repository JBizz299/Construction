import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { doc, setDoc } from 'firebase/firestore';

const JobContext = createContext()

export function useJobs() {
  return useContext(JobContext)
}

export function JobProvider({ children }) {
  const { user } = useAuth()
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setJobs([])
      setLoading(false)
      return
    }

    const jobsRef = collection(db, 'jobs')
    const q = query(
      jobsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const jobsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setJobs(jobsData)
        setLoading(false)
      },
      (error) => {
        console.error('Failed to fetch jobs:', error)
        setJobs([])
        setLoading(false)
      }
    )

    return () => unsubscribe()
  }, [user])

  async function addJob(newJob) {
    if (!user) throw new Error('No user logged in')
    const jobsRef = collection(db, 'jobs')

    const jobToAdd = {
      ...newJob,
      userId: user.uid,
      createdAt: serverTimestamp(),
    }

    try {
      const docRef = await addDoc(jobsRef, jobToAdd)
      return docRef.id // Return new job's Firestore ID for navigation
    } catch (e) {
      console.error('Failed to add job:', e)
      throw e
    }
  }

  const value = {
    jobs,
    addJob,
    loading,
  }

  return (
    <JobContext.Provider value={value}>
      {!loading && children}
    </JobContext.Provider>
  )
}
