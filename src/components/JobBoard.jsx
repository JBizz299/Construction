import { subcontractors } from '../data/sampleSubs';
import { jobs } from '../data/sampleJobs';
import JobCell from './JobCell';
import { format, addDays, isToday } from 'date-fns';

function JobBoard({ startDate, assignments = {}, onUpdate }) {
  // Build a 7-day window of dates starting from startDate
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(startDate, i)
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full table-fixed border border-gray-300 shadow-sm">
        <thead>
          <tr className="bg-gray-200">
            <th className="w-40 p-2 border-r">Subcontractor</th>
            {days.map(day => {
              const dayLabel = format(day, 'EEE MM/dd');
              const dayKey = format(day, 'yyyy-MM-dd');
              const isCurrentDay = isToday(day);

              return (
                <th
                  key={dayKey}
                  className={`text-center p-2 border-r ${isCurrentDay ? 'bg-blue-300 font-bold' : ''
                    }`}
                  title={format(day, 'MMMM do, yyyy')}
                >
                  {dayLabel}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {subcontractors.map(sub => (
            <tr key={sub.id} className="border-t">
              <td className="p-2 border-r font-semibold">{sub.name}</td>
              {days.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const assignmentKey = `${sub.id}-${dayKey}`;
                const assignedJob = assignments[assignmentKey] || '';

                return (
                  <td key={dayKey} className="p-1 border-r text-center">
                    <JobCell
                      date={format(day, 'MMM dd, yyyy')} // Pass formatted date
                      subcontractor={sub} // Pass the full subcontractor object
                      value={assignedJob}
                      onChange={job => onUpdate(sub.id, dayKey, job)}
                      jobs={jobs}
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default JobBoard;
