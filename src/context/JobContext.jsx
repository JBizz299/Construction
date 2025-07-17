import React, { createContext, useContext, useEffect, useState } from 'react'
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  writeBatch
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from './AuthContext'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
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

  // Upload receipt file to storage and create receipt document
  async function uploadReceiptFile(jobId, file) {
    if (!user) throw new Error('No user logged in')
    if (!file) throw new Error('No file provided')

    // Ensure user is authenticated
    if (!user.uid) throw new Error('User not properly authenticated')

    const timestamp = Date.now()
    const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
    const path = `jobs/${jobId}/receipts/${timestamp}_${sanitizedFileName}`

    console.log('Uploading to path:', path)
    console.log('User UID:', user.uid)

    const storageRef = ref(storage, path)

    try {
      // Upload file to storage
      const snapshot = await uploadBytes(storageRef, file)
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Create receipt document in Firestore
      const receiptsRef = collection(db, 'jobs', jobId, 'receipts')
      const docRef = await addDoc(receiptsRef, {
        fileUrl: downloadURL,
        fileName: file.name,
        storagePath: path,
        uploadedAt: serverTimestamp(),
        uploadedBy: user.email || 'Unknown',
        contentType: file.type,
        size: file.size,
        userId: user.uid,
        archived: false, // Initialize as not archived
      })

      return docRef.id
    } catch (error) {
      console.error('Failed to upload receipt:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        path: path,
        userUid: user.uid
      })
      throw new Error('Failed to upload receipt. Please try again.')
    }
  }

  // Delete receipt from both storage and Firestore
  async function deleteReceipt(jobId, receiptId) {
    if (!user) throw new Error('No user logged in')
    if (!jobId) throw new Error('Job ID is required')
    if (!receiptId) throw new Error('Receipt ID is required')

    // Validate that receiptId is a string
    if (typeof receiptId !== 'string') {
      console.error('Invalid receiptId type:', typeof receiptId, receiptId)
      throw new Error('Invalid receipt ID format')
    }

    try {
      // Get the receipt document to find storage path
      const receiptDocRef = doc(db, 'jobs', jobId, 'receipts', receiptId)
      const receiptSnap = await getDoc(receiptDocRef)

      if (!receiptSnap.exists()) {
        throw new Error('Receipt not found')
      }

      const receiptData = receiptSnap.data()

      // Delete from storage if storage path exists
      if (receiptData.storagePath) {
        try {
          const fileRef = ref(storage, receiptData.storagePath)
          await deleteObject(fileRef)
        } catch (storageError) {
          console.warn('Failed to delete file from storage:', storageError)
          // Continue with Firestore deletion even if storage deletion fails
        }
      }

      // Delete from Firestore
      await deleteDoc(receiptDocRef)
    } catch (error) {
      console.error('Failed to delete receipt:', error)
      throw new Error('Failed to delete receipt. Please try again.')
    }
  }

  // Rename receipt in Firestore
  async function renameReceipt(jobId, receiptId, newName) {
    if (!user) throw new Error('No user logged in')
    if (!jobId) throw new Error('Job ID is required')
    if (!receiptId) throw new Error('Receipt ID is required')

    // Validate that receiptId is a string
    if (typeof receiptId !== 'string') {
      console.error('Invalid receiptId type:', typeof receiptId, receiptId)
      throw new Error('Invalid receipt ID format')
    }

    const trimmedName = newName.trim()
    if (!trimmedName) throw new Error('New name cannot be empty')

    try {
      const receiptDoc = doc(db, 'jobs', jobId, 'receipts', receiptId)
      await updateDoc(receiptDoc, {
        fileName: trimmedName,
        updatedAt: serverTimestamp(),
        updatedBy: user.email || 'Unknown'
      })
    } catch (error) {
      console.error('Failed to rename receipt:', error)
      throw new Error('Failed to rename receipt. Please try again.')
    }
  }

  // Archive/unarchive receipt
  async function archiveReceipt(jobId, receiptId, archived = true) {
    if (!user) throw new Error('No user logged in')
    if (!jobId) throw new Error('Job ID is required')
    if (!receiptId) throw new Error('Receipt ID is required')

    // Validate that receiptId is a string
    if (typeof receiptId !== 'string') {
      console.error('Invalid receiptId type:', typeof receiptId, receiptId)
      throw new Error('Invalid receipt ID format')
    }

    try {
      const receiptDoc = doc(db, 'jobs', jobId, 'receipts', receiptId)
      await updateDoc(receiptDoc, {
        archived,
        archivedAt: archived ? serverTimestamp() : null,
        archivedBy: archived ? (user.email || 'Unknown') : null,
        updatedAt: serverTimestamp(),
        updatedBy: user.email || 'Unknown'
      })
    } catch (error) {
      console.error('Failed to archive receipt:', error)
      throw new Error(`Failed to ${archived ? 'archive' : 'unarchive'} receipt. Please try again.`)
    }
  }

  // Add new job
  async function addJob(newJob) {
    if (!user) throw new Error('No user logged in')

    const jobsRef = collection(db, 'jobs')
    const jobToAdd = {
      ...newJob,
      userId: user.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: newJob.status || 'pending'
    }

    try {
      const docRef = await addDoc(jobsRef, jobToAdd)
      return docRef.id
    } catch (error) {
      console.error('Failed to add job:', error)
      throw new Error('Failed to create job. Please try again.')
    }
  }

  // Update existing job
  async function updateJob(jobId, updates) {
    if (!user) throw new Error('No user logged in')
    if (!jobId) throw new Error('Job ID is required')
    if (!updates || Object.keys(updates).length === 0) {
      throw new Error('No updates provided')
    }

    try {
      const jobRef = doc(db, 'jobs', jobId)
      const updateData = {
        ...updates,
        updatedAt: serverTimestamp(),
        updatedBy: user.email || 'Unknown'
      }

      await updateDoc(jobRef, updateData)
    } catch (error) {
      console.error('Failed to update job:', error)
      throw new Error('Failed to update job. Please try again.')
    }
  }

  // Delete job and all associated data
  async function deleteJob(jobId) {
    if (!user) throw new Error('No user logged in')

    try {
      const batch = writeBatch(db)

      // Delete all subcollections first
      const collections = ['receipts', 'tasks', 'team', 'documents', 'budget']

      for (const collectionName of collections) {
        const collectionRef = collection(db, 'jobs', jobId, collectionName)
        const collectionSnap = await getDocs(collectionRef)

        for (const docSnap of collectionSnap.docs) {
          const data = docSnap.data()

          // Handle storage cleanup for receipts and documents
          if ((collectionName === 'receipts' || collectionName === 'documents') && data.storagePath) {
            try {
              const fileRef = ref(storage, data.storagePath)
              await deleteObject(fileRef)
            } catch (storageError) {
              console.warn(`Failed to delete file ${data.storagePath} from storage:`, storageError)
            }
          }

          // Add document deletion to batch
          batch.delete(docSnap.ref)
        }
      }

      // Delete the main job document
      const jobRef = doc(db, 'jobs', jobId)
      batch.delete(jobRef)

      // Commit all deletions
      await batch.commit()

      console.log(`Job ${jobId} and all associated data deleted successfully`)
    } catch (error) {
      console.error('Failed to delete job:', error)
      throw new Error('Failed to delete job. Please try again.')
    }
  }

  // Update job order for drag-and-drop functionality
  async function updateJobOrder(jobIds) {
    if (!user) throw new Error('No user logged in')
    if (!Array.isArray(jobIds)) throw new Error('Job IDs must be an array')

    try {
      const batch = writeBatch(db)

      jobIds.forEach((jobId, index) => {
        const jobRef = doc(db, 'jobs', jobId)
        batch.update(jobRef, {
          order: index,
          updatedAt: serverTimestamp(),
          updatedBy: user.email || 'Unknown'
        })
      })

      await batch.commit()
    } catch (error) {
      console.error('Failed to update job order:', error)
      throw new Error('Failed to update job order. Please try again.')
    }
  }

  // Archive/unarchive job
  async function archiveJob(jobId, archived = true) {
    if (!user) throw new Error('No user logged in')

    try {
      const jobRef = doc(db, 'jobs', jobId)
      await updateDoc(jobRef, {
        archived,
        archivedAt: archived ? serverTimestamp() : null,
        archivedBy: archived ? (user.email || 'Unknown') : null,
        updatedAt: serverTimestamp(),
        updatedBy: user.email || 'Unknown'
      })
    } catch (error) {
      console.error('Failed to archive job:', error)
      throw new Error(`Failed to ${archived ? 'archive' : 'unarchive'} job. Please try again.`)
    }
  }

  // Get job statistics
  function getJobStats() {
    const totalJobs = jobs.length
    const activeJobs = jobs.filter(job => !job.archived && job.status !== 'completed').length
    const completedJobs = jobs.filter(job => job.status === 'completed').length
    const archivedJobs = jobs.filter(job => job.archived).length

    return {
      totalJobs,
      activeJobs,
      completedJobs,
      archivedJobs
    }
  }

  const value = {
    jobs,
    loading,
    addJob,
    updateJob,
    deleteJob,
    archiveJob,
    uploadReceiptFile,
    deleteReceipt,
    renameReceipt,
    archiveReceipt, // Added missing function
    updateJobOrder,
    getJobStats,
  }

  return (
    <JobContext.Provider value={value}>
      {!loading && children}
    </JobContext.Provider>
  )
}