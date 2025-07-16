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
} from 'firebase/firestore'
import { db } from '../../firebase'

import OverviewTab from './OverviewTab'
import ReceiptsTab from './ReceiptsTab'
import TasksTab from './TasksTab'
import TeamTab from './TeamTab'
import BudgetTab from './BudgetTab'
import DocumentsTab from './DocumentsTab'

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
  const [renameError, setRenameError] = useState(null)

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

  // Upload receipt handler
  const handleReceiptUpload = async (e) => {
    e.preventDefault()
    setUploadError(null)

    if (!receiptFile) {
      setUploadError('Please select a file before uploading.')
      return
    }

    try {
      setUploading(true)
      await uploadReceiptFile(receiptFile, jobId)
      setReceiptFile(null)
      setShowUploadForm(false)
    } catch (error) {
      setUploadError('Upload failed. Try again.')
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

    const isImage = previewReceipt.fileName.match(/\.(jpeg|jpg|gif|png|svg)$/i)
    const isPdf = previewReceipt.fileName.match(/\.pdf$/i)

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
          {isImage && (
            <img
              src={previewReceipt.fileUrl}
              alt={previewReceipt.fileName}
              className="max-w-full max-h-[60vh] object-contain"
            />
          )}
          {isPdf && (
            <iframe
              src={previewReceipt.fileUrl}
              title={previewReceipt.fileName}
              className="w-full h-[60vh]"
            />
          )}
          {!isImage && !isPdf && <p>Preview not available for this file type.</p>}
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

  // Task handlers
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskName.trim()) return

    await addDoc(collection(db, 'jobs', jobId, 'tasks'), {
      name: newTaskName.trim(),
      dueDate: newTaskDue ? new Date(newTaskDue) : null,
      status: 'not_started',
      createdAt: serverTimestamp(),
    })

    setNewTaskName('')
    setNewTaskDue('')
  }

  const cycleTaskStatus = async (task) => {
    const next = {
      not_started: 'in_progress',
      in_progress: 'done',
      done: 'not_started',
    }[task.status || 'not_started']

    await updateDoc(doc(db, 'jobs', jobId, 'tasks', task.id), {
      status: next,
    })
  }

  const deleteTask = async (task) => {
    await deleteDoc(doc(db, 'jobs', jobId, 'tasks', task.id))
  }

  // Team handlers
  const handleAddMember = async (e) => {
    e.preventDefault()
    await addDoc(collection(db, 'jobs', jobId, 'team'), {
      ...newMember,
      addedAt: serverTimestamp(),
    })
    setShowAddMember(false)
    setNewMember({
      name: '',
      email: '',
      role: '',
      company: '',
      phone: '',
      permissions: [],
    })
  }

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this team member?')) return
    await deleteDoc(doc(db, 'jobs', jobId, 'team', memberId))
  }

  const handleEditMember = (member) => {
    setEditMemberId(member.id)
    setEditMember({ ...member })
  }

  const handleSaveEditMember = async (e) => {
    e.preventDefault()
    await updateDoc(doc(db, 'jobs', jobId, 'team', editMemberId), {
      ...editMember,
    })
    setEditMemberId(null)
    setEditMember(null)
  }

  const handleCancelEdit = () => {
    setEditMemberId(null)
    setEditMember(null)
  }

  // Document handlers
  const handleDocumentUpload = async (e) => {
    e.preventDefault()
    setUploadError(null)

    if (!documentFile) {
      setUploadError('Please select a file before uploading.')
      return
    }

    try {
      setUploading(true)
      // Upload document logic here
      // Reset form and state after successful upload
      setDocumentFile(null)
      setShowUploadForm(false)
    } catch (error) {
      setUploadError('Upload failed. Try again.')
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