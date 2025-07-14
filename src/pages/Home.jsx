import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useJobs } from '../context/JobContext'
import { v4 as uuidv4 } from 'uuid'

export default function Home() {
  const { jobs, addJob } = useJobs()
  const navigate = useNavigate()

  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', budget: '', timeline: '' })
  const [searchTerm, setSearchTerm] = useState('') // track search

  const handleCreate = () => {
    if (!form.name) return
    const newJob = {
      id: uuidv4(),
      name: form.name,
      budget: form.budget,
      timeline: form.timeline,
      createdAt: new Date().toISOString(),
    }
    addJob(newJob)
    setForm({ name: '', budget: '', timeline: '' })
    setShowForm(false)
    navigate(`/jobs/${newJob.id}`)
  }

 
  const filteredJobs = jobs.filter((job) =>
    job.name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Jobs</h1>

      <div className="flex items-center mb-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded mr-4"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? 'Cancel' : '+ Create Job'}
        </button>
        <input
          type="text"
          placeholder="Search jobs..."
          className="border p-2 flex-grow rounded"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)} 
        />
      </div>

      {showForm && (
        <div className="bg-white shadow p-4 rounded mb-6 space-y-3">
          <input
            className="border p-2 w-full rounded"
            placeholder="Job Name *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="border p-2 w-full rounded"
            placeholder="Budget (optional)"
            value={form.budget}
            onChange={(e) => setForm({ ...form, budget: e.target.value })}
          />
          <input
            className="border p-2 w-full rounded"
            placeholder="Timeline (optional)"
            value={form.timeline}
            onChange={(e) => setForm({ ...form, timeline: e.target.value })}
          />
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={handleCreate}
          >
            Create Job
          </button>
        </div>
      )}

      <div className="space-y-4">
        {filteredJobs.map((job) => (
          <div
            key={job.id}
            className="border p-4 rounded shadow hover:bg-gray-50 cursor-pointer flex justify-between items-center"
            onClick={() => navigate(`/jobs/${job.id}`)}
          >
            <div>
              <h2 className="text-xl font-semibold">{job.name}</h2>
              <p className="text-sm text-gray-600">
                Budget: {job.budget || '—'} | Timeline: {job.timeline || '—'}
              </p>
            </div>
            <span className="text-gray-400">→</span>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <p className="text-gray-500">No jobs found for "{searchTerm}".</p>
        )}
      </div>
    </div>
  )
}