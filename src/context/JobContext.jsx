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
      storagePath: path,      // <-- Added storagePath to allow deletion later
      uploadedAt: serverTimestamp(),
      type: file.type,
      userId: user.uid,
    })
    console.log('Receipt saved with ID:', docRef.id)

    return docRef.id
  }

  async function deleteReceipt(jobId, receipt) {
    if (!user) throw new Error('No user logged in')

    try {
      if (!receipt.storagePath) {
        console.warn('Receipt missing storagePath. Cannot delete from storage:', receipt)
        alert('This receipt cannot be deleted because it was uploaded before storage info was saved.')
        return
    }

      const fileRef = ref(storage, receipt.storagePath)
      await deleteObject(fileRef)
      console.log('Storage file deleted:', receipt.storagePath)

      const receiptDoc = doc(db, 'jobs', jobId, 'receipts', receipt.id)
      await deleteDoc(receiptDoc)
      console.log('Firestore receipt doc deleted:', receipt.id)
    } catch (e) {
      console.error('Failed to delete receipt:', e)
      throw e
    }
  }

  async function renameReceipt(jobId, receiptId, newName, originalName) {
    function ensureExtension(newName, originalName) {
     // If newName already has an extension, return it as is
     if (/\.[^/.]+$/.test(newName)) return newName

      // Extract the extension from the originalName
      const extMatch = originalName.match(/\.[^/.]+$/)
      if (extMatch) {
        return newName + extMatch[0]
      }

      // If originalName has no extension (unlikely), just return newName
     return newName
    }

  if (!user) throw new Error('No user logged in')
  const trimmedName = newName.trim()
  if (!trimmedName) throw new Error('New name cannot be empty')

  const finalName = ensureExtension(trimmedName, originalName)

  try {
    const receiptDoc = doc(db, 'jobs', jobId, 'receipts', receiptId)
    await updateDoc(receiptDoc, { fileName: finalName })
    console.log(`Receipt ${receiptId} renamed to:`, finalName)
  } catch (e) {
    console.error('Failed to rename receipt:', e)
    throw e
  }
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
      return docRef.id
    } catch (e) {
      console.error('Failed to add job:', e)
      throw e
    }
  }

  const value = {
    jobs,
    addJob,
    uploadReceiptFile,
    deleteReceipt,
    renameReceipt,
    loading,
  }

  return (
    <JobContext.Provider value={value}>
      {!loading && children}
    </JobContext.Provider>
  )
}
