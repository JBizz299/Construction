// src/components/JobCell.jsx
import { useState, useEffect } from 'react';
import AssignmentSidebar from './AssignmentSidebar';
import ModalPortal from '../utils/ModalPortal';
import { Clock, CheckCircle, Plus } from 'lucide-react';

// Enhanced color mapping for premium look
const getJobColor = (job, isDarkMode = false) => {
  if (!job) return isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-400';

  const lightColors = {
    'kitchen': 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-orange-800',
    'bathroom': 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800',
    'basement': 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-800',
    'flooring': 'bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-800',
    'painting': 'bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200 text-pink-800',
    'electrical': 'bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 text-yellow-800',
    'plumbing': 'bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 text-cyan-800',
    'hvac': 'bg-gradient-to-br from-red-50 to-red-100 border-red-200 text-red-800',
    'drywall': 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-800',
    'framing': 'bg-gradient-to-br from-amber-50 to-amber-100 border-amber-200 text-amber-800',
    'roofing': 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 text-slate-800',
    'landscaping': 'bg-gradient-to-br from-lime-50 to-lime-100 border-lime-200 text-lime-800',
    'cleanup': 'bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 text-gray-800',
  };

  const darkColors = {
    'kitchen': 'bg-gradient-to-br from-orange-900/30 to-orange-800/30 border-orange-700 text-orange-300',
    'bathroom': 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700 text-blue-300',
    'basement': 'bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-700 text-purple-300',
    'flooring': 'bg-gradient-to-br from-indigo-900/30 to-indigo-800/30 border-indigo-700 text-indigo-300',
    'painting': 'bg-gradient-to-br from-pink-900/30 to-pink-800/30 border-pink-700 text-pink-300',
    'electrical': 'bg-gradient-to-br from-yellow-900/30 to-yellow-800/30 border-yellow-700 text-yellow-300',
    'plumbing': 'bg-gradient-to-br from-cyan-900/30 to-cyan-800/30 border-cyan-700 text-cyan-300',
    'hvac': 'bg-gradient-to-br from-red-900/30 to-red-800/30 border-red-700 text-red-300',
    'drywall': 'bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-700 text-green-300',
    'framing': 'bg-gradient-to-br from-amber-900/30 to-amber-800/30 border-amber-700 text-amber-300',
    'roofing': 'bg-gradient-to-br from-slate-900/30 to-slate-800/30 border-slate-700 text-slate-300',
    'landscaping': 'bg-gradient-to-br from-lime-900/30 to-lime-800/30 border-lime-700 text-lime-300',
    'cleanup': 'bg-gradient-to-br from-gray-900/30 to-gray-800/30 border-gray-700 text-gray-300',
  };

  const colors = isDarkMode ? darkColors : lightColors;
  const jobLower = job.toLowerCase();

  for (const [key, colorClass] of Object.entries(colors)) {
    if (jobLower.includes(key)) {
      return colorClass;
    }
  }

  // Default colors for Jobs A, B, C, D
  const defaultLight = {
    'job a': 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800',
    'job b': 'bg-gradient-to-br from-green-50 to-green-100 border-green-200 text-green-800',
    'job c': 'bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 text-purple-800',
    'job d': 'bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 text-orange-800',
  };

  const defaultDark = {
    'job a': 'bg-gradient-to-br from-blue-900/30 to-blue-800/30 border-blue-700 text-blue-300',
    'job b': 'bg-gradient-to-br from-green-900/30 to-green-800/30 border-green-700 text-green-300',
    'job c': 'bg-gradient-to-br from-purple-900/30 to-purple-800/30 border-purple-700 text-purple-300',
    'job d': 'bg-gradient-to-br from-orange-900/30 to-orange-800/30 border-orange-700 text-orange-300',
  };

  const defaults = isDarkMode ? defaultDark : defaultLight;
  return defaults[jobLower] || (isDarkMode
    ? 'bg-gradient-to-br from-slate-900/30 to-slate-800/30 border-slate-700 text-slate-300'
    : 'bg-gradient-to-br from-slate-50 to-slate-100 border-slate-200 text-slate-800'
  );
};

function JobCell({
  date,
  subcontractor,
  value,
  onChange,
  jobOptions = [],
  loading = false,
  isToday = false,
  isWeekend = false,
  isDarkMode = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen && e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSave = (newJob) => {
    setIsAnimating(true);
    onChange(newJob);
    setIsOpen(false);

    // Reset animation after delay
    setTimeout(() => setIsAnimating(false), 400);
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);

    const draggedJob = e.dataTransfer.getData('text/plain');
    if (draggedJob && jobOptions.includes(draggedJob)) {
      handleSave(draggedJob);
    }
  };

  const colorClass = getJobColor(value, isDarkMode);
  const hasAssignment = Boolean(value);

  return (
    <>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative text-sm px-3 py-3 rounded-xl cursor-pointer transition-all duration-300 border-2
          ${colorClass}
          ${isDragOver ? 'scale-105 shadow-lg ring-2 ring-blue-400' : ''}
          ${isAnimating ? 'scale-105 shadow-lg' : ''}
          ${isToday ? 'ring-2 ring-blue-400' : ''}
          ${isWeekend ? 'opacity-60' : ''}
          ${!hasAssignment ? 'hover:scale-105 hover:shadow-md' : 'hover:shadow-lg'}
          min-h-[3.5rem] flex items-center justify-center
          backdrop-blur-sm
        `}
        title={hasAssignment ? `${value} - ${subcontractor.name}` : `Click to assign work to ${subcontractor.name}`}
      >
        {hasAssignment ? (
          <div className="text-center w-full">
            <div className="font-semibold text-xs leading-tight mb-1 truncate">
              {value}
            </div>

            {/* Status indicators */}
            <div className="flex items-center justify-center gap-1">
              {isToday && (
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span className="text-xs opacity-75">Today</span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className={`transition-all duration-200 ${isDarkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
            }`}>
            <Plus className="w-5 h-5" />
          </div>
        )}

        {/* Loading indicator */}
        {loading && (
          <div className="absolute -top-1 -right-1">
            <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          </div>
        )}

        {/* Today highlight */}
        {isToday && hasAssignment && (
          <div className="absolute -top-1 -left-1">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
          </div>
        )}

        {/* Weekend overlay */}
        {isWeekend && (
          <div className="absolute inset-0 bg-gray-900/10 rounded-xl pointer-events-none"></div>
        )}
      </div>

      {isOpen && (
        <ModalPortal>
          <AssignmentSidebar
            date={date}
            subcontractor={subcontractor}
            currentAssignment={value}
            jobOptions={jobOptions}
            onSave={handleSave}
            onClose={() => setIsOpen(false)}
            isDarkMode={isDarkMode}
          />
        </ModalPortal>
      )}
    </>
  );
}

export default JobCell;