import { useParams, useNavigate } from 'react-router-dom'
import { useJobs } from '../context/JobContext'
import { useState } from 'react'

export default function JobPage() {
  const { jobId } = useParams()
  const { jobs } = useJobs()
  const job = jobs.find((j) => j.id === jobId)
  const navigate = useNavigate()

  const [tab, setTab] = useState('overview') // default tab

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
      <div className="flex space-x-4 mb-6">
        {['overview', 'receipts', 'upload'].map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded ${
              tab === key
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700'
            }`}
          >
            {key[0].toUpperCase() + key.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white border rounded p-6 shadow">
        {tab === 'overview' && (
          <div>
            <h2 className="text-xl font-semibold mb-2">Job Summary</h2>
            <p>Created: {new Date(job.createdAt).toLocaleDateString()}</p>
            <p className="mt-2 text-sm text-gray-500 italic">
              (You can add tasks, milestones, or material estimates here later.)
            </p>
          </div>
        )}

        {tab === 'receipts' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Receipts</h2>
            <p className="text-gray-500 italic">
              (This is where job-specific receipts will appear.)
            </p>
          </div>
        )}

        {tab === 'upload' && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Upload Receipt</h2>
            {/* Placeholder — we'll wire in the real component next */}
            <p className="text-gray-500 italic">
              (Receipt upload form goes here — wired to this job.)
            </p>
          </div>
        )}
      </div>
    </div>
  )
}