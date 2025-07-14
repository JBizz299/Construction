import { useState } from 'react'
import { subcontractors } from '../data/sampleSubs'
import { jobs } from '../data/sampleJobs'
import JobCell from './JobCell'
import { format, addDays, startOfWeek } from 'date-fns'

// Get current week starting Monday
const start = startOfWeek(new Date(), { weekStartsOn: 1 })

// Generate labels like 'Mon 07/15', 'Tue 07/16', etc.
const days = Array.from({ length: 7 }, (_, i) =>
  format(addDays(start, i), 'EEE MM/dd')
)

function JobBoard() {
  const [assignments, setAssignments] = useState({})

  const handleUpdate = (subId, day, job) => {
    setAssignments(prev => ({
      ...prev,
      [`${subId}-${day}`]: job
    }))
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed border border-gray-300 shadow-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="w-40 p-2 border-r">Subcontractor</th>
            {days.map(day => (
              <th key={day} className="text-center p-2 border-r">{day}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {subcontractors.map(sub => (
            <tr key={sub.id} className="border-t">
              <td className="p-2 border-r font-semibold">{sub.name}</td>
              {days.map(day => (
                <JobCell
                  key={day}
                  value={assignments[`${sub.id}-${day}`] || ''}
                  onChange={(job) => handleUpdate(sub.id, day, job)}
                  jobs={jobs}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default JobBoard