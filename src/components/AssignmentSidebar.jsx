import { useState, useEffect, useRef } from 'react';
import { X, Clock, Search } from 'lucide-react';

export default function AssignmentSidebar({
    date,
    subcontractor,
    currentAssignment,
    jobs = [],
    onSave,
    onClose
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(currentAssignment || '');
    const [recentJobs, setRecentJobs] = useState([]);
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const searchInputRef = useRef(null);

    // Safe localStorage operations
    const getStoredRecentJobs = () => {
        try {
            const stored = localStorage.getItem('recentJobs');
            if (stored) {
                return JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load recent jobs from localStorage:', error);
        }
        return [];
    };

    const setStoredRecentJobs = (jobs) => {
        try {
            localStorage.setItem('recentJobs', JSON.stringify(jobs));
        } catch (error) {
            console.warn('Failed to save recent jobs to localStorage:', error);
        }
    };

    // Load recent jobs from localStorage with error handling
    useEffect(() => {
        const stored = getStoredRecentJobs();
        setRecentJobs(stored);
    }, []);

    // Focus search input when sidebar opens
    useEffect(() => {
        if (searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, []);

    useEffect(() => {
        setSearchTerm('');
        setSelectedJob(currentAssignment || '');
        setFocusedIndex(-1);
    }, [date, subcontractor, currentAssignment]);

    // Filter jobs based on search term
    const filteredJobs = jobs.filter((j) =>
        j.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get recent jobs that aren't already in filtered results
    const recentJobsFiltered = recentJobs.filter(job =>
        jobs.includes(job) &&
        job.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Combine recent jobs (at top) with other filtered jobs
    const allFilteredJobs = [
        ...recentJobsFiltered,
        ...filteredJobs.filter(job => !recentJobsFiltered.includes(job))
    ];

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter') {
                if (focusedIndex >= 0 && allFilteredJobs[focusedIndex]) {
                    handleSelectJob(allFilteredJobs[focusedIndex]);
                } else if (selectedJob) {
                    handleSave();
                }
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                setFocusedIndex(prev =>
                    prev < allFilteredJobs.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setFocusedIndex(prev =>
                    prev > 0 ? prev - 1 : allFilteredJobs.length - 1
                );
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [focusedIndex, allFilteredJobs, selectedJob, onClose]);

    // Update focused index when search changes
    useEffect(() => {
        setFocusedIndex(-1);
    }, [searchTerm]);

    const handleSelectJob = (job) => {
        setSelectedJob(job);
        setFocusedIndex(-1);
    };

    const handleSave = () => {
        if (selectedJob) {
            // Add to recent jobs with safe localStorage
            const newRecentJobs = [selectedJob, ...recentJobs.filter(j => j !== selectedJob)].slice(0, 5);
            setRecentJobs(newRecentJobs);
            setStoredRecentJobs(newRecentJobs);
        }
        onSave(selectedJob);
    };

    const handleClear = () => {
        setSelectedJob('');
        onSave('');
    };

    // Drag and drop for jobs
    const handleDragStart = (e, job) => {
        e.dataTransfer.setData('text/plain', job);
        e.dataTransfer.effectAllowed = 'copy';
    };

    const getJobColor = (job) => {
        const colors = {
            'construction': 'bg-orange-50 border-orange-200 text-orange-700',
            'plumbing': 'bg-blue-50 border-blue-200 text-blue-700',
            'electrical': 'bg-yellow-50 border-yellow-200 text-yellow-700',
            'painting': 'bg-purple-50 border-purple-200 text-purple-700',
            'landscaping': 'bg-green-50 border-green-200 text-green-700',
            'roofing': 'bg-red-50 border-red-200 text-red-700',
            'flooring': 'bg-indigo-50 border-indigo-200 text-indigo-700',
            'cleanup': 'bg-gray-50 border-gray-200 text-gray-700',
        };

        const jobLower = job.toLowerCase();
        for (const [key, colorClass] of Object.entries(colors)) {
            if (jobLower.includes(key)) {
                return colorClass;
            }
        }
        return 'bg-slate-50 border-slate-200 text-slate-700';
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="w-full max-w-sm bg-white bg-opacity-95 backdrop-blur-sm h-full shadow-lg p-6 flex flex-col border-l border-gray-200">
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-lg font-semibold">
                            {subcontractor?.name || 'Unknown Contractor'}
                        </h2>
                        <p className="text-sm text-gray-500">{date || 'No date'}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-gray-100 rounded"
                        title="Close (Esc)"
                    >
                        <X className="w-5 h-5 text-gray-500 hover:text-black" />
                    </button>
                </div>

                {/* Search Input */}
                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        placeholder="Search jobs or tasks..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>

                {/* Recent Jobs Section */}
                {recentJobsFiltered.length > 0 && (
                    <div className="mb-4">
                        <div className="flex items-center mb-2">
                            <Clock className="w-4 h-4 text-gray-500 mr-1" />
                            <h3 className="text-sm font-medium text-gray-700">Recent</h3>
                        </div>
                        <div className="space-y-1">
                            {recentJobsFiltered.slice(0, 3).map((job, index) => (
                                <button
                                    key={job}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, job)}
                                    className={`
                                        w-full text-left px-3 py-2 rounded-md text-sm border transition-all
                                        ${getJobColor(job)}
                                        ${selectedJob === job ? 'ring-2 ring-blue-400' : ''}
                                        ${focusedIndex === index ? 'ring-2 ring-blue-300' : ''}
                                        hover:shadow-sm cursor-pointer
                                    `}
                                    onClick={() => handleSelectJob(job)}
                                >
                                    {job}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* All Jobs Section */}
                <div className="flex-1 overflow-y-auto mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">All Jobs</h3>
                    {allFilteredJobs.length === 0 ? (
                        <p className="text-gray-500 text-sm italic">No jobs found.</p>
                    ) : (
                        <div className="space-y-1">
                            {allFilteredJobs.map((job, index) => (
                                <button
                                    key={job}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, job)}
                                    className={`
                                        w-full text-left px-3 py-2 rounded-md text-sm border transition-all
                                        ${getJobColor(job)}
                                        ${selectedJob === job ? 'ring-2 ring-blue-400' : ''}
                                        ${focusedIndex === index ? 'ring-2 ring-blue-300' : ''}
                                        hover:shadow-sm cursor-pointer
                                    `}
                                    onClick={() => handleSelectJob(job)}
                                >
                                    {job}
                                    {recentJobsFiltered.includes(job) && (
                                        <Clock className="inline w-3 h-3 ml-1 text-gray-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="mt-auto space-y-2">
                    {selectedJob && (
                        <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                                Selected: <span className="font-medium">{selectedJob}</span>
                            </p>
                        </div>
                    )}

                    <div className="flex justify-between space-x-2">
                        <button
                            onClick={handleClear}
                            className="bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Clear
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={!selectedJob}
                            className="bg-blue-600 text-white text-sm px-4 py-2 rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                            Save Assignment
                        </button>
                    </div>

                    <p className="text-xs text-gray-500 text-center">
                        Press Enter to save, Esc to close, ↑↓ to navigate
                    </p>
                </div>
            </div>
        </div>
    );
}