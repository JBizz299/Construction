import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../../context/JobContext'
import { useState, useEffect, useCallback } from 'react'
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  addDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  updateDoc,
  getDoc,
  setDoc,
} from 'firebase/firestore'
import { db } from '../../firebase'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { auth } from '../../firebase' // Import auth from firebase config

import OverviewTab from './OverviewTab'
import ReceiptsTab from './ReceiptsTab'
import TasksTab from './TasksTab'
import TeamTab from './TeamTab'
import BudgetTab from './BudgetTab'
import DocumentsTab from './DocumentsTab'
import { ReceiptProcessor } from "../../utils/ReceiptProcessor";

const storage = getStorage()

export default function JobPage() {
  const { jobId } = useParams()
  const { jobs, uploadReceiptFile, deleteReceipt, renameReceipt } = useJobs()
  const job = jobs.find((j) => j.id === jobId)
  const navigate = useNavigate()

  const [tab, setTab] = useState('overview')

  // Receipts state
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [receipts, setReceipts] = useState([])
  const [receiptsLoading, setReceiptsLoading] = useState(true)
  const [uploadError, setUploadError] = useState(null)

  const [filterTerm, setFilterTerm] = useState('')
  const [previewReceipt, setPreviewReceipt] = useState(null)
  const [renamingId, setRenamingId] = useState(null)
  const [newFileName, setNewFileName] = useState('')
  const [renameError, setRenameError] = useState(null) // FIXED: Added missing closing

  // Tasks state
  const [tasks, setTasks] = useState([])
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')

  // Team state
  const [team, setTeam] = useState([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMember, setNewMember] = useState({
    name: '',
    email: '',
    role: '',
    company: '',
    phone: '',
    permissions: [],
  })
  const [editMemberId, setEditMemberId] = useState(null)
  const [editMember, setEditMember] = useState(null)

  // Documents state
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentFile, setDocumentFile] = useState(null)
  const [showArchived, setShowArchived] = useState(false)

  if (!job) {
    return (
      <div className="p-8">
        <p className="text-red-500">Job not found.</p>
        <button
          className="mt-4 text-blue-600 underline"
          onClick={() => navigate('/')}
        >
          Back to Jobs
        </button>
      </div>
    )
  }

  // Listen to receipts collection for this job
  useEffect(() => {
    setReceiptsLoading(true)
    const receiptsRef = collection(db, 'jobs', jobId, 'receipts')
    const q = query(receiptsRef, orderBy('uploadedAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const receiptsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setReceipts(receiptsData)
        setReceiptsLoading(false)
      },
      (error) => {
        setReceipts([])
        setReceiptsLoading(false)
      }
    )
    return () => unsubscribe()
  }, [jobId])

  // Listen to tasks collection for this job
  useEffect(() => {
    const tasksRef = collection(db, 'jobs', jobId, 'tasks')
    const q = query(tasksRef, orderBy('createdAt', 'asc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const taskList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      setTasks(taskList)
    })
    return unsubscribe
  }, [jobId])

  // Fetch team members
  useEffect(() => {
    const ref = collection(db, 'jobs', jobId, 'team')
    const unsub = onSnapshot(ref, (snap) => {
      setTeam(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })))
    })
    return unsub
  }, [jobId])

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
      setDocumentsLoading(true)
      const documentsRef = collection(db, 'jobs', jobId, 'documents')
      const q = query(documentsRef, orderBy('uploadedAt', 'desc'))
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const documentsData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }))
          setDocuments(documentsData)
          setDocumentsLoading(false)
        },
        (error) => {
          setDocuments([])
          setDocumentsLoading(false)
        }
      )
      return () => unsubscribe()
    }

    fetchDocuments()
  }, [jobId])

  // Helper function to update budget from receipt data
  const updateBudgetFromReceipt = async (jobId, categories) => {
    try {
      const budgetRef = doc(db, 'jobs', jobId, 'budget', 'current')
      const budgetDoc = await getDoc(budgetRef)

      let currentBudget = budgetDoc.exists() ? budgetDoc.data() : {}

      // Update each category
      for (const [category, expenses] of Object.entries(categories)) {
        if (expenses.length > 0) {
          const categoryTotal = expenses.reduce((sum, exp) => sum + exp.amount, 0)

          if (!currentBudget[category]) {
            currentBudget[category] = { allocated: 0, spent: 0 }
          }

          currentBudget[category].spent = (currentBudget[category].spent || 0) + categoryTotal
          currentBudget[category].lastUpdated = serverTimestamp()
        }
      }

      // Update the budget document
      await setDoc(budgetRef, {
        ...currentBudget,
        lastUpdated: serverTimestamp()
      }, { merge: true })

    } catch (error) {
      console.error('Failed to update budget:', error)
      // Don't throw - receipt was uploaded successfully
    }
  }

  // Enhanced Upload receipt handler with OCR processing
  const handleReceiptUpload = async (e) => {
    e.preventDefault()
    setUploadError(null)

    if (!receiptFile) {
      setUploadError('Please select a file before uploading.')
      return
    }

    // Check if it's an image file for OCR processing
    const isImageFile = receiptFile.type.startsWith('image/')

    try {
      setUploading(true)

      if (isImageFile) {
        // Enhanced processing for image files
        const processor = new ReceiptProcessor()

        // Process the receipt with OCR and categorization
        const processedData = await processor.processReceipt(receiptFile)

        // Upload to Firebase Storage (keep your existing upload logic)
        await uploadReceiptFile(receiptFile, jobId)

        // Add the processed data to Firestore
        const receiptsRef = collection(db, 'jobs', jobId, 'receipts')
        await addDoc(receiptsRef, {
          fileName: receiptFile.name,
          uploadedAt: serverTimestamp(),
          ...processedData, // This includes extracted vendor, date, total, categories
          isProcessed: true
        })

        // Update budget if we have categorized data
        if (processedData.categories) {
          await updateBudgetFromReceipt(jobId, processedData.categories)
        }

        // Show success message with extracted data
        setUploadError(null)
        alert(`Receipt processed successfully!\nVendor: ${processedData.vendor}\nTotal: $${processedData.total}`)

      } else {
        // For non-image files (PDFs, etc.), use your existing upload logic
        await uploadReceiptFile(receiptFile, jobId)
        setUploadError(null)
      }

      setReceiptFile(null)
      setShowUploadForm(false)

    } catch (error) {
      console.error('Upload/processing error:', error)
      if (error.message.includes('OCR')) {
        setUploadError('Failed to process receipt image. File uploaded but data extraction failed.')
      } else {
        setUploadError('Upload failed. Please try again.')
      }
    } finally {
      setUploading(false)
    }
  }

  // Rename receipt
  const startRename = useCallback((receipt) => {
    const dotIndex = receipt.fileName.lastIndexOf('.')
    if (dotIndex === -1) {
      setNewFileName(receipt.fileName)
    } else {
      setNewFileName(receipt.fileName.slice(0, dotIndex))
    }
    setRenamingId(receipt.id)
    setRenameError(null)
  }, [])

  const saveRename = async (receipt) => {
    if (!newFileName.trim()) {
      setRenameError('File name cannot be empty.')
      return
    }
    const dotIndex = receipt.fileName.lastIndexOf('.')
    const extension = dotIndex === -1 ? '' : receipt.fileName.slice(dotIndex)
    const finalFileName = newFileName.trim() + extension

    try {
      await renameReceipt(jobId, receipt.id, finalFileName, receipt.fileName)
      setRenamingId(null)
      setRenameError(null)
    } catch (error) {
      setRenameError('Failed to rename receipt.')
    }
  }

  const cancelRename = () => {
    setRenamingId(null)
    setRenameError(null)
  }

  // Delete receipt
  const handleDeleteReceipt = useCallback(
    async (receipt) => {
      if (
        !window.confirm(
          `Delete receipt "${receipt.fileName}"? This cannot be undone.`
        )
      )
        return
      try {
        await deleteReceipt(jobId, receipt)
      } catch (error) {
        alert('Failed to delete receipt.')
      }
    },
    [deleteReceipt, jobId]
  )

  // Memoized handlers for rename and delete buttons
  const onRenameClick = useCallback(
    (receipt) => {
      startRename(receipt)
    },
    [startRename]
  )

  const onDeleteClick = useCallback(
    (receipt) => {
      handleDeleteReceipt(receipt)
    },
    [handleDeleteReceipt]
  )

  // Render receipt preview modal
  const renderPreviewModal = () => {
    if (!previewReceipt) return null

    if (!previewReceipt.fileUrl) {
      return (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewReceipt(null)}
        >
          <div
            className="bg-white p-4 rounded max-w-4xl max-h-[80vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold mb-2">{previewReceipt.fileName}</h3>
            <p className="text-red-500">No preview available.</p>
            <button
              onClick={() => setPreviewReceipt(null)}
              className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )
    }

    const isImage = previewReceipt.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i)

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
        onClick={() => setPreviewReceipt(null)}
      >
        <div
          className="bg-white p-4 rounded max-w-4xl max-h-[80vh] overflow-auto"
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="font-semibold mb-2">{previewReceipt.fileName}</h3>
          {isImage ? (
            <img
              src={previewReceipt.fileUrl}
              alt="Receipt preview"
              className="max-w-full max-h-[60vh] object-contain"
            />
          ) : (
            <iframe
              src={previewReceipt.fileUrl}
              className="w-full h-[60vh]"
              title="Receipt preview"
            />
          )}
          <button
            onClick={() => setPreviewReceipt(null)}
            className="mt-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </div>
    )
  }

  // Task management functions
  const handleAddTask = async () => {
    if (!newTaskName.trim()) return

    try {
      const tasksRef = collection(db, 'jobs', jobId, 'tasks')
      await addDoc(tasksRef, {
        name: newTaskName,
        dueDate: newTaskDue || null,
        status: 'pending',
        createdAt: serverTimestamp()
      })
      setNewTaskName('')
      setNewTaskDue('')
    } catch (error) {
      console.error('Failed to add task:', error)
      alert('Failed to add task')
    }
  }

  const cycleTaskStatus = async (taskId) => {
    const statuses = ['pending', 'in-progress', 'completed']
    const task = tasks.find(t => t.id === taskId)
    const currentIndex = statuses.indexOf(task.status)
    const nextStatus = statuses[(currentIndex + 1) % statuses.length]

    try {
      const taskRef = doc(db, 'jobs', jobId, 'tasks', taskId)
      await updateDoc(taskRef, { status: nextStatus })
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return

    try {
      const taskRef = doc(db, 'jobs', jobId, 'tasks', taskId)
      await deleteDoc(taskRef)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  // Team management functions
  const handleAddMember = async () => {
    if (!newMember.name || !newMember.email) return

    try {
      const teamRef = collection(db, 'jobs', jobId, 'team')
      await addDoc(teamRef, {
        ...newMember,
        addedAt: serverTimestamp()
      })
      setNewMember({ name: '', email: '', role: '', company: '', phone: '', permissions: [] })
      setShowAddMember(false)
    } catch (error) {
      console.error('Failed to add team member:', error)
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this team member?')) return

    try {
      const memberRef = doc(db, 'jobs', jobId, 'team', memberId)
      await deleteDoc(memberRef)
    } catch (error) {
      console.error('Failed to remove team member:', error)
    }
  }

  const handleEditMember = (memberId) => {
    const member = team.find(m => m.id === memberId)
    setEditMemberId(memberId)
    setEditMember({ ...member })
  }

  const handleSaveEditMember = async () => {
    try {
      const memberRef = doc(db, 'jobs', jobId, 'team', editMemberId)
      await updateDoc(memberRef, editMember)
      setEditMemberId(null)
      setEditMember(null)
    } catch (error) {
      console.error('Failed to update team member:', error)
    }
  }

  const handleCancelEdit = () => {
    setEditMemberId(null)
    setEditMember(null)
  }

  // Document management functions
  const handleDocumentUpload = async (e) => {
    e.preventDefault()
    if (!documentFile) return

    try {
      setUploading(true)
      // Add your document upload logic here
      setDocumentFile(null)
    } catch (error) {
      console.error('Document upload failed:', error)
    } finally {
      setUploading(false)
    }
  }

  const handleArchiveDocument = async (document) => {
    // Archive document logic here
  }

  const handleDeleteDocument = async (document) => {
    if (!window.confirm(`Delete document "${document.fileName}"? This cannot be undone.`))
      return
    try {
      // Delete document logic here
    } catch (error) {
      alert('Failed to delete document.')
    }
  }

  const handlePreviewDocument = (document) => {
    // Preview document logic here
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <button
          className="text-blue-600 underline text-sm mb-2"
          onClick={() => navigate('/')}
        >
          ← Back to Jobs
        </button>
        <h1 className="text-3xl font-bold">{job.name}</h1>
        <p className="text-gray-600">
          Budget: {job.budget || '—'} | Timeline: {job.timeline || '—'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap space-x-2 space-y-2 mb-6">
        {[
          'overview',
          'receipts',
          'tasks',
          'budget',
          'documents',
          'team',
        ].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded ${tab === key
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border rounded p-6 shadow min-h-[300px]">
        {tab === 'overview' && <OverviewTab job={job} />}
        {tab === 'receipts' && (
          <ReceiptsTab
            receipts={receipts}
            receiptsLoading={receiptsLoading}
            filterTerm={filterTerm}
            setFilterTerm={setFilterTerm}
            showUploadForm={showUploadForm}
            setShowUploadForm={setShowUploadForm}
            receiptFile={receiptFile}
            setReceiptFile={setReceiptFile}
            uploading={uploading}
            uploadError={uploadError}
            handleReceiptUpload={handleReceiptUpload}
            renamingId={renamingId}
            newFileName={newFileName}
            setNewFileName={setNewFileName}
            renameError={renameError}
            saveRename={saveRename}
            cancelRename={cancelRename}
            onRenameClick={onRenameClick}
            onDeleteClick={onDeleteClick}
            previewReceipt={previewReceipt}
            setPreviewReceipt={setPreviewReceipt}
            renderPreviewModal={renderPreviewModal}
          />
        )}
        {tab === 'tasks' && (
          <TasksTab
            tasks={tasks}
            newTaskName={newTaskName}
            setNewTaskName={setNewTaskName}
            newTaskDue={newTaskDue}
            setNewTaskDue={setNewTaskDue}
            handleAddTask={handleAddTask}
            cycleTaskStatus={cycleTaskStatus}
            deleteTask={deleteTask}
          />
        )}
        {tab === 'team' && (
          <TeamTab
            team={team}
            showAddMember={showAddMember}
            setShowAddMember={setShowAddMember}
            newMember={newMember}
            setNewMember={setNewMember}
            handleAddMember={handleAddMember}
            handleRemoveMember={handleRemoveMember}
            editMemberId={editMemberId}
            editMember={editMember}
            handleEditMember={handleEditMember}
            handleSaveEditMember={handleSaveEditMember}
            handleCancelEdit={handleCancelEdit}
            setEditMember={setEditMember}
          />
        )}
        {tab === 'budget' && <BudgetTab job={job} />}
        {tab === 'documents' && (
          <DocumentsTab
            documents={documents}
            documentsLoading={documentsLoading}
            showUploadForm={showUploadForm}
            setShowUploadForm={setShowUploadForm}
            documentFile={documentFile}
            setDocumentFile={setDocumentFile}
            uploading={uploading}
            uploadError={uploadError}
            handleDocumentUpload={handleDocumentUpload}
            onArchiveClick={handleArchiveDocument}
            onDeleteClick={handleDeleteDocument}
            onPreviewClick={handlePreviewDocument}
            showArchived={showArchived}
            setShowArchived={setShowArchived}
          />
        )}
      </div>
    </div>
  )
}