import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../../context/JobContext'
import { useTheme } from '../../context/ThemeContext'
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
import { auth } from '../../firebase'

import OverviewTab from './OverviewTab'
import ReceiptsTab from './ReceiptsTab'
import TasksTab from './TasksTab'
import TeamTab from './TeamTab'
import BudgetTab from './BudgetTab'
import DocumentsTab from './DocumentsTab'
import { ReceiptProcessor } from "../../utils/ReceiptProcessor";

import {
  ArrowLeft,
  Home,
  ChevronRight,
  Settings,
  Archive,
  MoreVertical,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Users,
  FileText,
  CheckSquare,
  Calendar,
  FolderOpen,
  Sparkles,
  TrendingUp
} from 'lucide-react'

const storage = getStorage()

export default function JobPage() {
  const { jobId } = useParams()
  const { jobs, uploadReceiptFile, deleteReceipt, renameReceipt, updateJob } = useJobs()
  const { isDarkMode } = useTheme()
  const job = jobs.find((j) => j.id === jobId)
  const navigate = useNavigate()

  const [tab, setTab] = useState('overview')
  const [showJobMenu, setShowJobMenu] = useState(false)

  // All state variables
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
  const [tasks, setTasks] = useState([])
  const [newTaskName, setNewTaskName] = useState('')
  const [newTaskDue, setNewTaskDue] = useState('')
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
  const [documents, setDocuments] = useState([])
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [documentFile, setDocumentFile] = useState(null)
  const [showArchived, setShowArchived] = useState(false)
  const [budgetData, setBudgetData] = useState({})
  const [budgetLoading, setBudgetLoading] = useState(true)

  // Handle navigation back to home with proper state cleanup
  const handleBackToJobs = useCallback(() => {
    // Reset all tab-specific states when navigating away
    setTab('overview')
    setShowUploadForm(false)
    setReceiptFile(null)
    setUploading(false)
    setUploadError(null)
    setFilterTerm('')
    setPreviewReceipt(null)
    setRenamingId(null)
    setNewFileName('')
    setRenameError(null)
    setNewTaskName('')
    setNewTaskDue('')
    setShowAddMember(false)
    setNewMember({
      name: '',
      email: '',
      role: '',
      company: '',
      phone: '',
      permissions: [],
    })
    setEditMemberId(null)
    setEditMember(null)
    setDocumentFile(null)
    setShowArchived(false)

    // Navigate to home with a nice transition
    navigate('/', { replace: true })
  }, [navigate])

  // Job not found handling with better UX
  if (!job) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
        }`}>
        <div className="text-center">
          <AlertCircle className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-500'
            }`} />
          <h1 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
            Job Not Found
          </h1>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            The job you're looking for doesn't exist or has been deleted.
          </p>
          <button
            className={`px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 mx-auto ${isDarkMode
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            onClick={handleBackToJobs}
          >
            <Home className="w-5 h-5" />
            Back to Jobs
          </button>
        </div>
      </div>
    )
  }

  // Listen to receipts collection for this job
  useEffect(() => {
    if (!jobId) return

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
        setReceiptsLoading(false)
      }
    )

    return unsubscribe
  }, [jobId])

  // Listen to tasks collection for this job
  useEffect(() => {
    if (!jobId) return

    const tasksRef = collection(db, 'jobs', jobId, 'tasks')
    const q = query(tasksRef, orderBy('createdAt', 'desc'))
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tasksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setTasks(tasksData)
      },
      (error) => {
        console.error('Error fetching tasks:', error)
      }
    )

    return unsubscribe
  }, [jobId])

  // Listen to team collection for this job
  useEffect(() => {
    if (!jobId) return

    const teamRef = collection(db, 'jobs', jobId, 'team')
    const unsubscribe = onSnapshot(
      teamRef,
      (snapshot) => {
        const teamData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setTeam(teamData)
      },
      (error) => {
        console.error('Error fetching team:', error)
      }
    )

    return unsubscribe
  }, [jobId])

  // Listen to documents collection for this job
  useEffect(() => {
    if (!jobId) return

    setDocumentsLoading(true)
    const documentsRef = collection(db, 'jobs', jobId, 'documents')
    const q = query(documentsRef, orderBy('uploadedAt', 'desc'))
    const unsubscribe = onSnapshot(
      documentsRef,
      (snapshot) => {
        const documentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        setDocuments(documentsData)
        setDocumentsLoading(false)
      },
      (error) => {
        console.error('Error fetching documents:', error)
        setDocumentsLoading(false)
      }
    )

    return unsubscribe
  }, [jobId])

  // Calculate budget data for overview tab
  useEffect(() => {
    if (!receipts.length) {
      setBudgetData({ totalSpent: 0, budgetUsed: 0 })
      setBudgetLoading(false)
      return
    }

    // Calculate total spent from receipts
    const totalSpent = receipts.reduce((sum, receipt) => {
      return sum + (receipt.amount || 0)
    }, 0)

    const jobBudget = parseFloat(job?.budget?.replace(/[^0-9.-]+/g, '') || '0')
    const budgetUsed = jobBudget > 0 ? Math.min((totalSpent / jobBudget) * 100, 100) : 0

    setBudgetData({ totalSpent, budgetUsed })
    setBudgetLoading(false)
  }, [receipts, job?.budget])

  // Get job status info
  const getJobStatusInfo = () => {
    const status = job.status || 'pending'
    switch (status) {
      case 'completed':
        return {
          icon: CheckCircle,
          color: isDarkMode ? 'text-green-400' : 'text-green-600',
          bgColor: isDarkMode ? 'bg-green-400/10' : 'bg-green-50',
          borderColor: isDarkMode ? 'border-green-400/20' : 'border-green-200',
          label: 'Completed'
        }
      case 'in-progress':
        return {
          icon: Clock,
          color: isDarkMode ? 'text-blue-400' : 'text-blue-600',
          bgColor: isDarkMode ? 'bg-blue-400/10' : 'bg-blue-50',
          borderColor: isDarkMode ? 'border-blue-400/20' : 'border-blue-200',
          label: 'In Progress'
        }
      default:
        return {
          icon: AlertCircle,
          color: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
          bgColor: isDarkMode ? 'bg-yellow-400/10' : 'bg-yellow-50',
          borderColor: isDarkMode ? 'border-yellow-400/20' : 'border-yellow-200',
          label: 'Pending'
        }
    }
  }

  const statusInfo = getJobStatusInfo()
  const StatusIcon = statusInfo.icon

  // Tab configuration with clean design (no counts/badges)
  const tabConfig = [
    {
      key: 'overview',
      label: 'Overview',
      icon: Sparkles
    },
    {
      key: 'tasks',
      label: 'Tasks',
      icon: CheckSquare
    },
    {
      key: 'team',
      label: 'Team',
      icon: Users
    },
    {
      key: 'budget',
      label: 'Budget',
      icon: DollarSign
    },
    {
      key: 'receipts',
      label: 'Receipts',
      icon: FileText
    },
    {
      key: 'documents',
      label: 'Documents',
      icon: FolderOpen
    }
  ]

  // Enhanced receipt upload handler
  const handleReceiptUpload = async () => {
    if (!receiptFile) {
      setUploadError('Please select a file to upload')
      return
    }

    // Reset previous errors
    setUploadError(null)
    setUploading(true)

    try {
      // Validate file on client side first
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
      const maxSize = 10 * 1024 * 1024 // 10MB
      
      if (!allowedTypes.includes(receiptFile.type)) {
        throw new Error('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF.')
      }
      
      if (receiptFile.size > maxSize) {
        throw new Error('File size too large. Please upload a file smaller than 10MB.')
      }

      if (receiptFile.size === 0) {
        throw new Error('File appears to be empty. Please select a valid file.')
      }

      // Upload the file
      const receiptId = await uploadReceiptFile(jobId, receiptFile)
      
      // Success feedback
      console.log('Receipt uploaded successfully:', receiptId)
      
      // Reset form
      setReceiptFile(null)
      setShowUploadForm(false)
      
      // Optional: Show success message
      // You could add a success state and show a toast notification
      
    } catch (error) {
      console.error('Receipt upload failed:', error)
      
      // Set user-friendly error message
      setUploadError(error.message || 'Failed to upload receipt. Please try again.')
      
      // Optional: Add retry logic for certain errors
      if (error.message.includes('Network error') || error.message.includes('Session expired')) {
        // Could add a retry button or automatic retry logic here
      }
    } finally {
      setUploading(false)
    }
  }

  // Enhanced file selection handler with validation
  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    setUploadError(null) // Clear previous errors
    
    if (!file) {
      setReceiptFile(null)
      return
    }

    // Client-side validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF.')
      setReceiptFile(null)
      return
    }
    
    if (file.size > maxSize) {
      setUploadError('File size too large. Please upload a file smaller than 10MB.')
      setReceiptFile(null)
      return
    }

    if (file.size === 0) {
      setUploadError('File appears to be empty. Please select a valid file.')
      setReceiptFile(null)
      return
    }

    setReceiptFile(file)
  }

  // Enhanced drag and drop handlers
  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    const files = Array.from(e.dataTransfer.files)
    if (files.length === 0) return
    
    // Take only the first file
    const file = files[0]
    
    // Use the same validation as file select
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'image/webp']
    const maxSize = 10 * 1024 * 1024 // 10MB
    
    setUploadError(null)
    
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Invalid file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF.')
      return
    }
    
    if (file.size > maxSize) {
      setUploadError('File size too large. Please upload a file smaller than 10MB.')
      return
    }

    if (file.size === 0) {
      setUploadError('File appears to be empty. Please select a valid file.')
      return
    }

    setReceiptFile(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  // Receipt rename handlers
  const onRenameClick = (receiptId, currentName) => {
    setRenamingId(receiptId)
    setNewFileName(currentName)
    setRenameError(null)
  }

  const saveRename = async () => {
    if (!newFileName.trim()) {
      setRenameError('Filename cannot be empty')
      return
    }

    try {
      await renameReceipt(jobId, renamingId, newFileName.trim())
      setRenamingId(null)
      setNewFileName('')
      setRenameError(null)
    } catch (error) {
      setRenameError('Failed to rename receipt')
    }
  }

  const cancelRename = () => {
    setRenamingId(null)
    setNewFileName('')
    setRenameError(null)
  }

  const onDeleteClick = async (receiptId) => {
    if (!window.confirm('Delete this receipt? This cannot be undone.')) return

    try {
      await deleteReceipt(jobId, receiptId)
    } catch (error) {
      alert('Failed to delete receipt.')
    }
  }

  // FIXED: Task handlers with correct function signature
  const handleAddTask = async (e) => {
    e.preventDefault()
    if (!newTaskName.trim()) return

    try {
      const tasksRef = collection(db, 'jobs', jobId, 'tasks')
      await addDoc(tasksRef, {
        name: newTaskName.trim(),
        description: '',
        status: 'todo',
        dueDate: newTaskDue || null,
        createdAt: serverTimestamp(),
        createdBy: auth.currentUser?.email || 'Unknown',
      })

      setNewTaskName('')
      setNewTaskDue('')
    } catch (error) {
      console.error('Failed to add task:', error)
      alert('Failed to add task. Please try again.')
    }
  }

  const cycleTaskStatus = async (taskId, currentStatus) => {
    const statusOrder = ['todo', 'in-progress', 'completed']
    const currentIndex = statusOrder.indexOf(currentStatus)
    const nextStatus = statusOrder[(currentIndex + 1) % statusOrder.length]

    try {
      const taskRef = doc(db, 'jobs', jobId, 'tasks', taskId)
      const updateData = { status: nextStatus }

      if (nextStatus === 'completed') {
        updateData.completedAt = serverTimestamp()
        updateData.completedBy = auth.currentUser?.email || 'Unknown'
      }

      await updateDoc(taskRef, updateData)
    } catch (error) {
      console.error('Failed to update task:', error)
    }
  }

  const deleteTask = async (taskId) => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return

    try {
      const taskRef = doc(db, 'jobs', jobId, 'tasks', taskId)
      await deleteDoc(taskRef)
    } catch (error) {
      console.error('Failed to delete task:', error)
    }
  }

  // FIXED: Simple team member add handler (removing complex service dependency)
  const handleAddMember = async (e) => {
    e.preventDefault()
    if (!newMember.name.trim() || !newMember.email.trim()) return

    try {
      const teamRef = collection(db, 'jobs', jobId, 'team')
      await addDoc(teamRef, {
        ...newMember,
        name: newMember.name.trim(),
        email: newMember.email.trim(),
        addedAt: serverTimestamp(),
        addedBy: auth.currentUser?.email || 'Unknown',
      })

      // Success - reset form
      setNewMember({
        name: '',
        email: '',
        role: '',
        company: '',
        phone: '',
        permissions: [],
      })
      setShowAddMember(false)

      // Optional: Show success message instead of error
      // You could add a toast notification here if you have one

    } catch (error) {
      console.error('Failed to add team member:', error)
      alert('Failed to add team member. Please try again.')
    }
  }

  const handleRemoveMember = async (memberId) => {
    if (!window.confirm('Remove this team member? This cannot be undone.')) return

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

  // Document handlers
  const handleDocumentUpload = async (e) => {
    e.preventDefault()
    if (!documentFile) return

    try {
      setUploading(true)
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

  const renderPreviewModal = () => {
    if (!previewReceipt) return null

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className={`rounded-2xl max-w-4xl max-h-full overflow-auto shadow-2xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
          <div className={`flex justify-between items-center p-6 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
            }`}>
            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              {previewReceipt.fileName}
            </h3>
            <button
              onClick={() => setPreviewReceipt(null)}
              className={`p-2 rounded-lg transition-colors ${isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
            >
              ×
            </button>
          </div>
          <div className="p-6">
            {previewReceipt.fileUrl && previewReceipt.contentType?.includes('image') ? (
              <img
                src={previewReceipt.fileUrl}
                alt={previewReceipt.fileName}
                className="max-w-full h-auto rounded-lg"
              />
            ) : (
              <iframe
                src={previewReceipt.fileUrl}
                className="w-full h-96 rounded-lg"
                title={previewReceipt.fileName}
              />
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
        ? 'bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-gray-50 via-white to-gray-100'
      }`}>
      {/* Enhanced Header with Breadcrumb */}
      <div className={`sticky top-0 z-30 backdrop-blur-xl border-b ${isDarkMode
          ? 'bg-gray-900/80 border-gray-800'
          : 'bg-white/80 border-gray-200'
        }`}>
        <div className="max-w-7xl mx-auto px-6 py-4">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={handleBackToJobs}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium transition-all duration-200 group ${isDarkMode
                  ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
            >
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              Back to Jobs
            </button>

            <ChevronRight className={`w-4 h-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />

            <span className={`font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              {job.name}
            </span>
          </div>

          {/* Job Header */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>
                  {job.name}
                </h1>

                {/* Status Badge */}
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${statusInfo.bgColor
                  } ${statusInfo.borderColor}`}>
                  <StatusIcon className={`w-4 h-4 ${statusInfo.color}`} />
                  <span className={`text-sm font-medium ${statusInfo.color}`}>
                    {statusInfo.label}
                  </span>
                </div>
              </div>

              {/* Job Meta Info */}
              <div className="flex items-center gap-6 text-sm">
                {job.budget && (
                  <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    <DollarSign className="w-4 h-4" />
                    Budget: {job.budget}
                  </div>
                )}

                {job.timeline && (
                  <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    <Calendar className="w-4 h-4" />
                    Timeline: {job.timeline}
                  </div>
                )}

                {tasks.length > 0 && (
                  <div className={`flex items-center gap-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>
                    <TrendingUp className="w-4 h-4" />
                    Progress: {Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100)}%
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <button
                className={`p-2 rounded-lg transition-colors ${isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                title="Job Settings"
              >
                <Settings className="w-5 h-5" />
              </button>

              <button
                className={`p-2 rounded-lg transition-colors ${isDarkMode
                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                  }`}
                title="More Options"
                onClick={() => setShowJobMenu(!showJobMenu)}
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED: Clean Tab Navigation (no counts/badges) */}
      <div className={`sticky top-[120px] z-20 border-b ${isDarkMode ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'
        } backdrop-blur-sm`}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex gap-2 overflow-x-auto py-4 scrollbar-hide">
            {tabConfig.map((tabItem) => {
              const TabIcon = tabItem.icon
              const isActive = tab === tabItem.key

              return (
                <button
                  key={tabItem.key}
                  onClick={() => setTab(tabItem.key)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-200 whitespace-nowrap group ${isActive
                      ? isDarkMode
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                        : 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                      : isDarkMode
                        ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                >
                  <TabIcon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'
                    }`} />

                  <span>{tabItem.label}</span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className={`rounded-2xl border shadow-xl overflow-hidden ${isDarkMode
            ? 'bg-gray-800/50 border-gray-700 backdrop-blur-sm'
            : 'bg-white border-gray-200'
          }`}>
          <div className="p-8">
            {tab === 'overview' && (
              <OverviewTab
                job={job}
                tasks={tasks}
                team={team}
                receipts={receipts}
                budgetData={budgetData}
                budgetLoading={budgetLoading}
                onUpdateJob={updateJob}
                isDarkMode={isDarkMode}
              />
            )}

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
                jobId={jobId}
                jobName={job.name}
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
      </div>

      {/* Job Menu Dropdown */}
      {showJobMenu && (
        <div className="fixed inset-0 z-40" onClick={() => setShowJobMenu(false)}>
          <div className={`absolute top-[80px] right-6 w-64 rounded-xl border shadow-xl ${isDarkMode
              ? 'bg-gray-800 border-gray-700'
              : 'bg-white border-gray-200'
            }`}>
            <div className="p-2">
              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Settings className="w-4 h-4" />
                Edit Job Details
              </button>

              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isDarkMode
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                }`}>
                <Archive className="w-4 h-4" />
                Archive Job
              </button>

              <hr className={`my-2 ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`} />

              <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isDarkMode
                  ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                  : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                }`}>
                <AlertCircle className="w-4 h-4" />
                Delete Job
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Render preview modal */}
      {renderPreviewModal()}

      {/* Custom CSS for scrollbar */}
      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  )
}