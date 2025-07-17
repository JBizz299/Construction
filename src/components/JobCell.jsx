// src/components/JobCell.jsx
import { useState, useEffect } from 'react';
import AssignmentSidebar from './AssignmentSidebar';
import ModalPortal from '../utils/ModalPortal';
import { Clock, CheckCircle, AlertCircle } from 'lucide-react';

// Enhanced color mapping for different job types
const getJobColor = (job) => {
  if (!job) return 'bg-gray-50 border-gray-200 text-gray-400';

  const colors = {
    'kitchen': 'bg-orange-100 border-orange-300 text-orange-800',
    'bathroom': 'bg-blue-100 border-blue-300 text-blue-800',
    'basement': 'bg-purple-100 border-purple-300 text-purple-800',
    'flooring': 'bg-indigo-100 border-indigo-300 text-indigo-800',
    'painting': 'bg-pink-100 border-pink-300 text-pink-800',
    'electrical': 'bg-yellow-100 border-yellow-300 text-yellow-800',
    'plumbing': 'bg-cyan-100 border-cyan-300 text-cyan-800',
    'hvac': 'bg-red-100 border-red-300 text-red-800',
    'drywall': 'bg-green-100 border-green-300 text-green-800',
    'framing': 'bg-amber-100 border-amber-300 text-amber-800',
    'roofing': 'bg-slate-100 border-slate-300 text-slate-800',
    'siding': 'bg-emerald-100 border-emerald-300 text-emerald-800',
    'landscaping': 'bg-lime-100 border-lime-300 text-lime-800',
    'cleanup': 'bg-gray-100 border-gray-300 text-gray-800',
  };

  const jobLower = job.toLowerCase();
  for (const [key, colorClass] of Object.entries(colors)) {
    if (jobLower.includes(key)) {
      return colorClass;
    }
  }

  // Default colors for Jobs A, B, C, D
  const defaultColors = {
    'job a': 'bg-blue-100 border-blue-300 text-blue-800',
    'job b': 'bg-green-100 border-green-300 text-green-800',
    'job c': 'bg-purple-100 border-purple-300 text-purple-800',
    'job d': 'bg-orange-100 border-orange-300 text-orange-800',
  };

  return defaultColors[jobLower] || 'bg-slate-100 border-slate-300 text-slate-800';
};

function JobCell({
  date,
  subcontractor,
  value,
  onChange,
  jobOptions = [],
  loading = false,
  isToday = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Keyboard shortcut handling
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

    // Reset animation after a short delay
    setTimeout(() => setIsAnimating(false), 300);
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsOpen(true);
  };

  // Enhanced drag and drop handlers
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

  const colorClass = getJobColor(value);
  const hasAssignment = Boolean(value);

  return (
    <>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative text-sm px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 border-2
          ${colorClass}
          ${isDragOver ? 'scale-105 shadow-lg ring-2 ring-blue-400' : ''}
          ${isAnimating ? 'scale-105 shadow-lg' : ''}
          ${isToday ? 'ring-2 ring-blue-300' : ''}
          ${!hasAssignment ? 'hover:bg-gray-100 hover:border-gray-300' : 'hover:shadow-md'}
          min-h-[3rem] flex items-center justify-center
        `}
        title={hasAssignment ? `Assigned: ${value}` : 'Click to assign job'}
      >
        {hasAssignment ? (
          <div className="text-center w-full">
            <div className="font-medium truncate text-xs leading-tight">
              {value}
            </div>
            {isToday && (
              <div className="flex items-center justify-center mt-1">
                <Clock className="w-3 h-3 text-blue-600" />
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-400 text-xl hover:text-gray-600 transition-colors">
            +
          </div>
        )}

        {/* Status indicators */}
        <div className="absolute top-1 right-1 flex gap-1">
          {loading && (
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          )}
          {isToday && hasAssignment && (
            <div className="w-2 h-2 bg-green-500 rounded-full" title="Today's assignment"></div>
          )}
        </div>
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
          />
        </ModalPortal>
      )}
    </>
  );
}

export default JobCell;