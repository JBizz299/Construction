import { useState, useEffect } from 'react';
import AssignmentSidebar from './AssignmentSidebar';
import ModalPortal from '../utils/ModalPortal';

// Color mapping for different job types
const getJobColor = (job) => {
  if (!job) return 'bg-gray-50 border-gray-200';

  const colors = {
    'construction': 'bg-orange-100 border-orange-300 text-orange-800',
    'plumbing': 'bg-blue-100 border-blue-300 text-blue-800',
    'electrical': 'bg-yellow-100 border-yellow-300 text-yellow-800',
    'painting': 'bg-purple-100 border-purple-300 text-purple-800',
    'landscaping': 'bg-green-100 border-green-300 text-green-800',
    'roofing': 'bg-red-100 border-red-300 text-red-800',
    'flooring': 'bg-indigo-100 border-indigo-300 text-indigo-800',
    'cleanup': 'bg-gray-100 border-gray-300 text-gray-800',
  };

  // Simple keyword matching - you can make this more sophisticated
  const jobLower = job.toLowerCase();
  for (const [key, colorClass] of Object.entries(colors)) {
    if (jobLower.includes(key)) {
      return colorClass;
    }
  }

  return 'bg-slate-100 border-slate-300 text-slate-800';
};

function JobCell({ date, subcontractor, value, onChange, jobs }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Keyboard shortcut handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (isOpen) {
        if (e.key === 'Escape') {
          setIsOpen(false);
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const handleSave = (newJob) => {
    onChange(newJob);
    setIsOpen(false);
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
    if (draggedJob && jobs.includes(draggedJob)) {
      onChange(draggedJob);
    }
  };

  const colorClass = getJobColor(value);

  return (
    <>
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative text-sm px-2 py-3 rounded-md cursor-pointer transition-all duration-200 border-2
          ${colorClass}
          ${isDragOver ? 'scale-105 shadow-lg ring-2 ring-blue-400' : ''}
          ${!value ? 'hover:bg-gray-100 hover:border-gray-300' : 'hover:shadow-md'}
          min-h-[2.5rem] flex items-center justify-center
        `}
        title={value ? `Assigned: ${value}` : 'Click to assign job'}
      >
        {value ? (
          <div className="text-center">
            <div className="font-medium truncate">{value}</div>
          </div>
        ) : (
          <div className="text-gray-400 text-lg">+</div>
        )}

        {/* Loading indicator when saving */}
        {isOpen && (
          <div className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        )}
      </div>

      {isOpen && (
        <ModalPortal>
          <AssignmentSidebar
            date={date}
            subcontractor={subcontractor}
            currentAssignment={value}
            jobs={jobs}
            onSave={handleSave}
            onClose={() => setIsOpen(false)}
          />
        </ModalPortal>
      )}
    </>
  );
}

export default JobCell;