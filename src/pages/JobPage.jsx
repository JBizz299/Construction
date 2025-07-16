import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../context/JobContext'
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
import { db } from '../firebase'

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
        console.error('Error fetching receipts:', error)
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
      console.error('Upload failed:', error)
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
      console.error('Error renaming receipt:', error)
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
        console.error('Error deleting receipt:', error)
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

  // Filter receipts by fileName
  const filteredReceipts = receipts.filter((r) =>
    r.fileName.toLowerCase().includes(filterTerm.toLowerCase())
  )

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
        {tab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Job Summary</h2>
            <p>
              Created:{' '}
              {job.createdAt
                ? new Date(job.createdAt.seconds * 1000).toLocaleDateString()
                : 'N/A'}
            </p>
            <p>Status: {job.status || 'Not set'}</p>
            <p className="mt-2 text-sm text-gray-500 italic">
              (You can add tasks, milestones, or material estimates here later.)
            </p>
          </div>
        )}

        {tab === 'receipts' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Receipts</h2>
              <input
                type="text"
                placeholder="Search receipts by name..."
                className="border px-2 py-1 rounded mr-4 max-w-xs"
                value={filterTerm}
                onChange={(e) => setFilterTerm(e.target.value)}
              />
              <button
                onClick={() => setShowUploadForm((v) => !v)}
                className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                disabled={uploading}
              >
                {showUploadForm ? 'Cancel Upload' : '+ Add Receipt'}
              </button>
            </div>

            {showUploadForm && (
              <form onSubmit={handleReceiptUpload} className="mb-6">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => setReceiptFile(e.target.files[0])}
                  className="mb-2"
                  disabled={uploading}
                />
                {uploadError && <p className="text-red-500 mb-2">{uploadError}</p>}
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload Receipt'}
                </button>
              </form>
            )}

            {receiptsLoading ? (
              <p>Loading receipts...</p>
            ) : filteredReceipts.length === 0 ? (
              <p className="text-gray-500 italic">No receipts match your search.</p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto">
                {filteredReceipts.map((r) => (
                  <li
                    key={r.id}
                    className="border p-3 rounded flex justify-between items-center"
                  >
                    <div className="flex flex-col max-w-[60%]">
                      {renamingId === r.id ? (
                        <>
                          <div className="flex items-center mb-1">
                            <input
                              type="text"
                              value={newFileName}
                              onChange={(e) => setNewFileName(e.target.value)}
                              className="border px-2 py-1 rounded rounded-r-none flex-grow"
                              autoFocus
                            />
                            <span className="border border-l-0 border-gray-300 px-2 py-1 rounded-r bg-gray-100 select-none">
                              {(() => {
                                const dotIndex = r.fileName.lastIndexOf('.')
                                return dotIndex === -1 ? '' : r.fileName.slice(dotIndex)
                              })()}
                            </span>
                          </div>
                          {renameError && (
                            <p className="text-red-500 text-xs mb-1">{renameError}</p>
                          )}
                          <div>
                            <button
                              onClick={() => saveRename(r)}
                              className="text-green-600 underline mr-3 text-sm"
                            >
                              Save
                            </button>
                            <button
                              onClick={cancelRename}
                              className="text-gray-600 underline text-sm"
                            >
                              Cancel
                            </button>
                          </div>
                        </>
                      ) : (
                        <a
                          href="#!"
                          onClick={() => setPreviewReceipt(r)}
                          className="text-blue-600 underline truncate max-w-full"
                          title="Click to preview"
                        >
                          {r.fileName}
                        </a>
                      )}

                      <span className="text-sm text-gray-500 truncate max-w-full">
                        {r.uploadedAt?.seconds
                          ? new Date(r.uploadedAt.seconds * 1000).toLocaleDateString()
                          : ''}
                      </span>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onRenameClick(r)}
                        className="text-yellow-600 underline text-sm"
                      >
                        Rename
                      </button>
                      <button
                        onClick={() => onDeleteClick(r)}
                        className="text-red-600 underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {renderPreviewModal()}
          </div>
        )}

        {tab === 'tasks' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tasks / Schedule</h2>

            {/* Add New Task */}
            <form
              onSubmit={handleAddTask}
              className="mb-4 flex flex-wrap gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Task name"
                value={newTaskName}
                onChange={(e) => setNewTaskName(e.target.value)}
                className="border px-2 py-1 rounded"
              />
              <input
                type="date"
                value={newTaskDue}
                onChange={(e) => setNewTaskDue(e.target.value)}
                className="border px-2 py-1 rounded"
              />
              <button
                type="submit"
                className="bg-blue-600 text-white px-3 py-1 rounded"
              >
                Add Task
              </button>
            </form>

            {tasks.map((task) => (
              <div
                key={task.id}
                className="border p-3 rounded flex justify-between items-center mb-2"
              >
                <div>
                  <p className="font-semibold">{task.name}</p>
                  <p className="text-sm text-gray-500">
                    Due: {task.dueDate?.toDate().toLocaleDateString() || '—'} | Status:{' '}
                    {task.status}
                  </p>
                </div>
                <div className="flex space-x-2 text-sm">
                  <button
                    onClick={() => cycleTaskStatus(task)}
                    className="text-yellow-600 underline"
                  >
                    Next Status
                  </button>
                  <button
                    onClick={() => deleteTask(task)}
                    className="text-red-600 underline"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Other tabs placeholders... */}
      </div>
    </div>
  )
}
