// src/components/JobBoard.jsx
import { format, addDays, isToday } from 'date-fns';
import JobCell from './JobCell';
import { Users, Calendar, AlertTriangle } from 'lucide-react';

function JobBoard({
  startDate,
  assignments = {},
  subcontractors = [],
  jobOptions = [],
  onUpdate,
  loading
}) {
  // Build a 7-day window of dates starting from startDate
  const days = Array.from({ length: 7 }, (_, i) =>
    addDays(startDate, i)
  );

  // Helper function to get assignment stats for a day
  const getDayStats = (day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    const dayAssignments = Object.entries(assignments).filter(([key]) =>
      key.endsWith(`-${dayKey}`)
    );

    return {
      totalAssignments: dayAssignments.length,
      uniqueJobs: new Set(dayAssignments.map(([, job]) => job)).size
    };
  };

  // Helper function to get subcontractor workload
  const getSubcontractorWorkload = (subId) => {
    const workload = days.reduce((acc, day) => {
      const dayKey = format(day, 'yyyy-MM-dd');
      const assignmentKey = `${subId}-${dayKey}`;
      if (assignments[assignmentKey]) {
        acc++;
      }
      return acc;
    }, 0);

    return {
      assignedDays: workload,
      utilizationRate: Math.round((workload / 7) * 100)
    };
  };

  if (subcontractors.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-600 mb-2">No Subcontractors Found</h3>
        <p className="text-gray-500 mb-4">
          Add team members from your job pages to start scheduling
        </p>
        <button
          onClick={() => window.open('/jobs', '_blank')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Go to Jobs
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
      {/* Board Header with Day Stats */}
      <div className="bg-gray-50 p-4 border-b">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">Weekly Schedule</h2>
          <div className="text-sm text-gray-600">
            {subcontractors.length} subcontractors • {jobOptions.length} jobs available
          </div>
        </div>

        {/* Day stats preview */}
        <div className="grid grid-cols-7 gap-2 text-xs">
          {days.map(day => {
            const stats = getDayStats(day);
            const isCurrentDay = isToday(day);

            return (
              <div
                key={format(day, 'yyyy-MM-dd')}
                className={`text-center p-2 rounded ${isCurrentDay ? 'bg-blue-100 text-blue-800' : 'bg-white text-gray-600'
                  }`}
              >
                <div className="font-medium">{format(day, 'EEE')}</div>
                <div>{stats.totalAssignments} assigned</div>
                <div>{stats.uniqueJobs} jobs</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Schedule Grid */}
      <div className="overflow-x-auto">
        <table className="min-w-full table-fixed">
          <thead>
            <tr className="bg-gray-100">
              <th className="w-48 p-3 text-left border-r border-gray-200">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Subcontractor
                </div>
              </th>
              {days.map(day => {
                const dayLabel = format(day, 'EEE MM/dd');
                const dayKey = format(day, 'yyyy-MM-dd');
                const isCurrentDay = isToday(day);
                const stats = getDayStats(day);

                return (
                  <th
                    key={dayKey}
                    className={`text-center p-3 border-r border-gray-200 ${isCurrentDay ? 'bg-blue-200 text-blue-900' : ''
                      }`}
                    title={`${format(day, 'MMMM do, yyyy')} - ${stats.totalAssignments} assignments`}
                  >
                    <div className="font-semibold">{dayLabel}</div>
                    <div className="text-xs text-gray-600 mt-1">
                      {stats.totalAssignments} assigned
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {subcontractors.map((sub, index) => {
              const workload = getSubcontractorWorkload(sub.id);
              const isHighUtilization = workload.utilizationRate > 80;

              return (
                <tr key={sub.id} className={`border-t ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <td className="p-3 border-r border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-sm">{sub.name}</div>
                        <div className="text-xs text-gray-600">
                          {sub.company && `${sub.company} • `}
                          {sub.email}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {workload.assignedDays}/7 days ({workload.utilizationRate}%)
                        </div>
                      </div>

                      {isHighUtilization && (
                        <AlertTriangle className="w-4 h-4 text-amber-500" title="High utilization" />
                      )}
                    </div>
                  </td>

                  {days.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const assignmentKey = `${sub.id}-${dayKey}`;
                    const assignedJob = assignments[assignmentKey] || '';
                    const isCurrentDay = isToday(day);

                    return (
                      <td
                        key={dayKey}
                        className={`p-1 border-r border-gray-200 ${isCurrentDay ? 'bg-blue-50' : ''
                          }`}
                      >
                        <JobCell
                          date={format(day, 'MMM dd, yyyy')}
                          subcontractor={sub}
                          value={assignedJob}
                          onChange={job => onUpdate(sub.id, dayKey, job)}
                          jobOptions={jobOptions}
                          loading={loading}
                          isToday={isCurrentDay}
                        />
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Board Footer */}
      <div className="bg-gray-50 p-4 border-t">
        <div className="flex items-center justify-between text-sm text-gray-600">
          <div>
            Total assignments: {Object.keys(assignments).length}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-200 rounded"></div>
              <span>Today</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-200 rounded"></div>
              <span>Assigned</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-gray-200 rounded"></div>
              <span>Available</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default JobBoard;
