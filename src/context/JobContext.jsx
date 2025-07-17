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
import { db, auth } from '../firebase'
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

  // Production-ready uploadReceiptFile function with security validation
  async function uploadReceiptFile(jobId, file) {
    if (!user) throw new Error('No user logged in')
    if (!file) throw new Error('No file provided')
    if (!jobId) throw new Error('No job ID provided')

    // Validate file type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF.')
    }
    
    if (file.size > maxSize) {
      throw new Error('File size too large. Please upload a file smaller than 10MB.')
    }

    if (file.size === 0) {
      throw new Error('File appears to be empty. Please select a valid file.')
    }

    // Verify user has access to this job BEFORE uploading
    try {
      const jobRef = doc(db, 'jobs', jobId)
      const jobSnap = await getDoc(jobRef)
      
      if (!jobSnap.exists()) {
        throw new Error('Job not found')
      }
      
      const jobData = jobSnap.data()
      if (jobData.userId !== user.uid && !jobData.assignedUsers?.includes(user.uid)) {
        throw new Error('You do not have permission to add receipts to this job')
      }
    } catch (error) {
      if (error.message.includes('permission')) {
        throw error
      }
      console.error('Job verification failed:', error)
      throw new Error('Unable to verify job access. Please try again.')
    }

    // Create secure file path
    const timestamp = Date.now()
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.\-_]/g, '_') // More restrictive sanitization
      .substring(0, 100) // Limit filename length
    const path = `jobs/${jobId}/receipts/${timestamp}_${sanitizedFileName}`
    
    const storageRef = ref(storage, path)

    try {
      // Upload file to storage
      const snapshot = await uploadBytes(storageRef, file, {
        customMetadata: {
          uploadedBy: user.uid,
          originalName: file.name,
          uploadedAt: new Date().toISOString()
        }
      })
      
      const downloadURL = await getDownloadURL(snapshot.ref)

      // Create receipt document in Firestore with additional security fields
      const receiptsRef = collection(db, 'jobs', jobId, 'receipts')
      const docRef = await addDoc(receiptsRef, {
        fileUrl: downloadURL,
        fileName: file.name,
        storagePath: path,
        uploadedAt: serverTimestamp(),
        uploadedBy: user.email || 'Unknown',
        uploadedByUid: user.uid,
        contentType: file.type,
        size: file.size,
        userId: user.uid,
        jobId: jobId, // Add job reference for additional security
        archived: false,
        processed: false // Flag for future receipt processing
      })

      return docRef.id
    } catch (error) {
      console.error('Upload failed:', error)
      
      // Enhanced error handling with user-friendly messages
      if (error.code === 'storage/unauthorized') {
        throw new Error('Upload permission denied. Please refresh the page and try again.')
      } else if (error.code === 'storage/quota-exceeded') {
        throw new Error('Storage quota exceeded. Please contact support.')
      } else if (error.code === 'storage/invalid-format') {
        throw new Error('Invalid file format. Please try a different file.')
      } else if (error.code === 'storage/canceled') {
        throw new Error('Upload was canceled. Please try again.')
      } else if (error.code === 'auth/user-token-expired') {
        throw new Error('Session expired. Please refresh the page and try again.')
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Network error. Please check your connection and try again.')
      } else {
        throw new Error(`Upload failed: ${error.message}`)
      }
    }
  }

  // Enhanced delete receipt with better error handling
  async function deleteReceipt(jobId, receiptId) {
    if (!user) throw new Error('No user logged in')

    try {
      // Get the receipt document to find storage path
      const receiptDocRef = doc(db, 'jobs', jobId, 'receipts', receiptId)
      const receiptSnap = await getDoc(receiptDocRef)

      if (!receiptSnap.exists()) {
        throw new Error('Receipt not found')
      }

      const receiptData = receiptSnap.data()

      // Verify user has permission to delete this receipt
      if (receiptData.userId !== user.uid && receiptData.uploadedByUid !== user.uid) {
        throw new Error('You do not have permission to delete this receipt')
      }

      // Delete from storage if storage path exists
      if (receiptData.storagePath) {
        try {
          const fileRef = ref(storage, receiptData.storagePath)
          await deleteObject(fileRef)
          console.log('File deleted from storage successfully')
        } catch (storageError) {
          console.warn('Failed to delete file from storage:', storageError)
          // Check if it's a "not found" error (file already deleted)
          if (storageError.code !== 'storage/object-not-found') {
            throw new Error('Failed to delete file from storage')
          }
        }
      }

      // Delete from Firestore
      await deleteDoc(receiptDocRef)
      console.log('Receipt document deleted successfully')
    } catch (error) {
      console.error('Failed to delete receipt:', error)
      throw error // Re-throw the error to handle it in the component
    }
  }

  // Enhanced rename receipt with extension preservation
  async function renameReceipt(jobId, receiptId, newName) {
    if (!user) throw new Error('No user logged in')

    const trimmedName = newName.trim()
    if (!trimmedName) throw new Error('New name cannot be empty')

    try {
      // Get the current receipt to preserve extension
      const receiptDocRef = doc(db, 'jobs', jobId, 'receipts', receiptId)
      const receiptSnap = await getDoc(receiptDocRef)

      if (!receiptSnap.exists()) {
        throw new Error('Receipt not found')
      }

      const receiptData = receiptSnap.data()
      const originalFileName = receiptData.fileName || ''
      
      // Extract original extension
      const originalExtension = originalFileName.includes('.') 
        ? originalFileName.substring(originalFileName.lastIndexOf('.'))
        : ''

      // Check if new name already has an extension
      const newNameHasExtension = trimmedName.includes('.') && 
        trimmedName.lastIndexOf('.') > trimmedName.length - 6 // Extension shouldn't be longer than 5 chars

      // Preserve extension if new name doesn't have one
      const finalFileName = newNameHasExtension 
        ? trimmedName 
        : trimmedName + originalExtension

      await updateDoc(receiptDocRef, {
        fileName: finalFileName,
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

    try {
      const receiptDoc = doc(db, 'jobs', jobId, 'receipts', receiptId)
      await updateDoc(receiptDoc, {
        archived: archived,
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
    archiveReceipt,
    updateJobOrder,
    getJobStats,
  }

  return (
    <JobContext.Provider value={value}>
      {!loading && children}
    </JobContext.Provider>
  )
}