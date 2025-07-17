// src/components/JobBoard.jsx
import { format, addDays, isToday, isWeekend } from 'date-fns';
import JobCell from './JobCell';
import { User, Calendar, Clock, AlertCircle } from 'lucide-react';

function JobBoard({
  startDate,
  assignments = {},
  subcontractors = [],
  jobOptions = [],
  onUpdate,
  loading,
  isDarkMode = false
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(startDate, i));

  // Helper to get day's assignment count
  const getDayAssignmentCount = (day) => {
    const dayKey = format(day, 'yyyy-MM-dd');
    return Object.keys(assignments).filter(key => key.endsWith(`-${dayKey}`)).length;
  };

  // Helper to get subcontractor utilization
  const getSubcontractorUtilization = (subId) => {
    const weekAssignments = days.filter(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      return assignments[`${subId}-${dayKey}`];
    }).length;
    return Math.round((weekAssignments / 7) * 100);
  };

  return (
    <div className={`rounded-2xl overflow-hidden border backdrop-blur-sm ${isDarkMode
        ? 'bg-gray-800/50 border-gray-700'
        : 'bg-white/80 border-gray-200 shadow-sm'
      }`}>

      {/* Header */}
      <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/80' : 'border-gray-200 bg-gray-50/80'
        }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
              Weekly Schedule
            </h2>
          </div>

          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            {subcontractors.length} contractors • {Object.keys(assignments).length} assignments
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className={isDarkMode ? 'bg-gray-800' : 'bg-gray-50'}>
              <th className={`w-48 p-4 text-left border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                }`}>
                <div className="flex items-center gap-2">
                  <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                    Contractor
                  </span>
                </div>
              </th>

              {days.map(day => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const isCurrentDay = isToday(day);
                const isWeekendDay = isWeekend(day);
                const assignmentCount = getDayAssignmentCount(day);

                return (
                  <th
                    key={dayKey}
                    className={`p-4 text-center border-r min-w-[120px] ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      } ${isCurrentDay
                        ? isDarkMode
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-blue-50 text-blue-700'
                        : isWeekendDay
                          ? isDarkMode
                            ? 'bg-gray-700/50 text-gray-400'
                            : 'bg-gray-100 text-gray-600'
                          : isDarkMode
                            ? 'text-white'
                            : 'text-gray-900'
                      }`}
                  >
                    <div className="font-semibold text-sm">
                      {format(day, 'EEE')}
                    </div>
                    <div className="text-xs opacity-75 mt-1">
                      {format(day, 'MMM d')}
                    </div>
                    {assignmentCount > 0 && (
                      <div className={`text-xs mt-1 px-2 py-1 rounded-full inline-block ${isDarkMode
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-200 text-gray-600'
                        }`}>
                        {assignmentCount}
                      </div>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {subcontractors.map((sub, index) => {
              const utilization = getSubcontractorUtilization(sub.id);
              const isHighUtilization = utilization > 80;
              const isLowUtilization = utilization < 20;

              return (
                <tr
                  key={sub.id}
                  className={`border-t transition-colors hover:bg-opacity-50 ${isDarkMode
                      ? 'border-gray-700 hover:bg-gray-700'
                      : 'border-gray-200 hover:bg-gray-50'
                    }`}
                >
                  <td className={`p-4 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                          {sub.name}
                        </div>
                        <div className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                          {sub.company && `${sub.company} • `}
                          {sub.email}
                        </div>

                        {/* Utilization Bar */}
                        <div className="mt-2">
                          <div className={`flex items-center gap-2 text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                            }`}>
                            <div className={`w-16 h-1.5 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                              }`}>
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${isHighUtilization
                                    ? 'bg-red-500'
                                    : isLowUtilization
                                      ? 'bg-yellow-500'
                                      : 'bg-green-500'
                                  }`}
                                style={{ width: `${utilization}%` }}
                              />
                            </div>
                            <span>{utilization}%</span>
                          </div>
                        </div>
                      </div>

                      {isHighUtilization && (
                        <AlertCircle className="w-4 h-4 text-amber-500 ml-2" />
                      )}
                    </div>
                  </td>

                  {days.map(day => {
                    const dayKey = format(day, 'yyyy-MM-dd');
                    const assignmentKey = `${sub.id}-${dayKey}`;
                    const assignedJob = assignments[assignmentKey] || '';
                    const isCurrentDay = isToday(day);
                    const isWeekendDay = isWeekend(day);

                    return (
                      <td
                        key={dayKey}
                        className={`p-2 border-r ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                          } ${isCurrentDay
                            ? isDarkMode ? 'bg-blue-900/10' : 'bg-blue-50/50'
                            : isWeekendDay
                              ? isDarkMode ? 'bg-gray-800/50' : 'bg-gray-50/50'
                              : ''
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
                          isWeekend={isWeekendDay}
                          isDarkMode={isDarkMode}
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

      {/* Footer */}
      <div className={`p-4 border-t text-center ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
        }`}>
        <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>
          Click any cell to assign work • Use ← → to navigate weeks • Press T for this week
        </div>
      </div>
    </div>
  );
}

export default JobBoard;