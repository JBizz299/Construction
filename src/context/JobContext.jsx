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
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

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

async function uploadReceiptFile(file, jobId) {
  if (!user) throw new Error('No user logged in')
  console.log('Starting upload for', file.name)

  const path = `receipts/${user.uid}/${jobId}/${Date.now()}_${file.name}`
  const storageRef = ref(storage, path)
  console.log('Storage ref:', path)

  const uploadResult = await uploadBytes(storageRef, file)
  console.log('Upload complete')

  const downloadURL = await getDownloadURL(storageRef)
  console.log('Download URL:', downloadURL)

  const receiptsRef = collection(db, 'jobs', jobId, 'receipts')
  const docRef = await addDoc(receiptsRef, {
    fileUrl: downloadURL,
    fileName: file.name,
    uploadedAt: serverTimestamp(),
    type: file.type,
    userId: user.uid,
  })
  console.log('Receipt saved with ID:', docRef.id)

  return docRef.id
}
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
    uploadReceiptFile,
    loading,
  }

  return (
    <JobContext.Provider value={value}>
      {!loading && children}
    </JobContext.Provider>
  )
}
