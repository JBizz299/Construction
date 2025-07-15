import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../context/JobContext'
import { useState, useEffect } from 'react'
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../firebase'

export default function JobPage() {
  const { jobId } = useParams()
  const { jobs, uploadReceiptFile } = useJobs()
  const job = jobs.find((j) => j.id === jobId)
  const navigate = useNavigate()

  const [tab, setTab] = useState('overview')
  const [showUploadForm, setShowUploadForm] = useState(false)
  const [receiptFile, setReceiptFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [receipts, setReceipts] = useState([])
  const [receiptsLoading, setReceiptsLoading] = useState(true)
  const [uploadError, setUploadError] = useState(null)

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

  // Upload handler
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
            className={`px-4 py-2 rounded ${
              tab === key
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
                {uploadError && (
                  <p className="text-red-500 mb-2">{uploadError}</p>
                )}
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
            ) : receipts.length === 0 ? (
              <p className="text-gray-500 italic">No receipts uploaded yet.</p>
            ) : (
              <ul className="space-y-3 max-h-80 overflow-y-auto">
                {receipts.map((r) => (
                  <li key={r.id} className="border p-3 rounded flex justify-between items-center">
                    <a
                      href={r.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 underline"
                    >
                      {r.fileName}
                    </a>
                    <span className="text-sm text-gray-500">
                      {r.uploadedAt?.seconds
                        ? new Date(r.uploadedAt.seconds * 1000).toLocaleDateString()
                        : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Other tabs placeholders... */}
        {tab === 'tasks' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Tasks / Schedule</h2>
            <p className="text-gray-500 italic">
              (Add and manage tasks, deadlines, and assign to subs here.)
            </p>
          </div>
        )}

        {tab === 'budget' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Budget / Costs</h2>
            <p className="text-gray-500 italic">(Track estimated vs actual costs here.)</p>
          </div>
        )}

        {tab === 'documents' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Documents</h2>
            <p className="text-gray-500 italic">
              (Upload and view blueprints, permits, contracts, etc.)
            </p>
          </div>
        )}

        {tab === 'team' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Team / Subcontractors</h2>
            <p className="text-gray-500 italic">(Manage assigned subcontractors and workers here.)</p>
          </div>
        )}
      </div>
    </div>
  )
}
