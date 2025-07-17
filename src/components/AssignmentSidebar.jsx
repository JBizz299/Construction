// src/components/AssignmentSidebar.jsx
import { useState, useEffect } from 'react';
import { X, Search, Clock, User, Briefcase, Star, ChevronRight } from 'lucide-react';

function AssignmentSidebar({
    date,
    subcontractor,
    currentAssignment,
    jobOptions = [],
    onSave,
    onClose
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedJob, setSelectedJob] = useState(currentAssignment || '');
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [recentJobs, setRecentJobs] = useState([]);

    // Load recent jobs from localStorage
    useEffect(() => {
        try {
            const stored = localStorage.getItem('recentJobs');
            if (stored) {
                setRecentJobs(JSON.parse(stored));
            }
        } catch (error) {
            console.error('Failed to load recent jobs:', error);
        }
    }, []);

    // Save recent jobs to localStorage
    const setStoredRecentJobs = (jobs) => {
        try {
            localStorage.setItem('recentJobs', JSON.stringify(jobs));
        } catch (error) {
            console.error('Failed to save recent jobs:', error);
        }
    };

    // Filter jobs based on search term
    const filteredJobs = jobOptions.filter(job =>
        job.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Separate recent jobs and other jobs
    const recentFilteredJobs = recentJobs.filter(job =>
        jobOptions.includes(job) && job.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const otherJobs = filteredJobs.filter(job => !recentJobs.includes(job));

    // All filtered jobs for keyboard navigation
    const allFilteredJobs = [...recentFilteredJobs, ...otherJobs];

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'Enter') {
                if (focusedIndex >= 0 && focusedIndex < allFilteredJobs.length) {
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
            // Add to recent jobs
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
            'kitchen': 'bg-orange-50 border-orange-200 text-orange-700',
            'bathroom': 'bg-blue-50 border-blue-200 text-blue-700',
            'basement': 'bg-purple-50 border-purple-200 text-purple-700',
            'flooring': 'bg-indigo-50 border-indigo-200 text-indigo-700',
            'painting': 'bg-pink-50 border-pink-200 text-pink-700',
            'electrical': 'bg-yellow-50 border-yellow-200 text-yellow-700',
            'plumbing': 'bg-cyan-50 border-cyan-200 text-cyan-700',
            'hvac': 'bg-red-50 border-red-200 text-red-700',
            'drywall': 'bg-green-50 border-green-200 text-green-700',
            'framing': 'bg-amber-50 border-amber-200 text-amber-700',
            'roofing': 'bg-slate-50 border-slate-200 text-slate-700',
            'landscaping': 'bg-lime-50 border-lime-200 text-lime-700',
            'cleanup': 'bg-gray-50 border-gray-200 text-gray-700',
        };

        const jobLower = job.toLowerCase();
        for (const [key, colorClass] of Object.entries(colors)) {
            if (jobLower.includes(key)) {
                return colorClass;
            }
        }

        // Default colors for Jobs A, B, C, D
        const defaultColors = {
            'job a': 'bg-blue-50 border-blue-200 text-blue-700',
            'job b': 'bg-green-50 border-green-200 text-green-700',
            'job c': 'bg-purple-50 border-purple-200 text-purple-700',
            'job d': 'bg-orange-50 border-orange-200 text-orange-700',
        };

        return defaultColors[jobLower] || 'bg-slate-50 border-slate-200 text-slate-700';
    };

    const renderJobItem = (job, index, isRecent = false) => {
        const isFocused = index === focusedIndex;
        const isSelected = job === selectedJob;
        const colorClass = getJobColor(job);

        return (
            <div
                key={job}
                draggable
                onDragStart={(e) => handleDragStart(e, job)}
                onClick={() => handleSelectJob(job)}
                className={`
          flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-150
          ${isFocused ? 'bg-blue-100 border-blue-300' : 'hover:bg-gray-50'}
          ${isSelected ? 'ring-2 ring-blue-400 bg-blue-50' : ''}
          ${colorClass} border-2
        `}
            >
                <div className="flex items-center gap-3">
                    {isRecent && <Star className="w-4 h-4 text-yellow-500" />}
                    <Briefcase className="w-4 h-4" />
                    <span className="font-medium text-sm">{job}</span>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50" />
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            <div className="w-full max-w-md bg-white h-full shadow-xl flex flex-col border-l border-gray-200">
                {/* Header */}
                <div className="bg-gray-50 p-6 border-b border-gray-200">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                                Assign Job
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <User className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">
                                    {subcontractor?.name || 'Unknown Contractor'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className="w-4 h-4 text-gray-500" />
                                <span className="text-sm text-gray-600">{date}</span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Close (Esc)"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>

                    {/* Current Assignment */}
                    {currentAssignment && (
                        <div className="bg-white p-3 rounded-lg border">
                            <div className="text-xs text-gray-500 mb-1">Current Assignment</div>
                            <div className="font-medium text-sm">{currentAssignment}</div>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className="p-4 border-b border-gray-200">
                    <div className="relative">
                        <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            autoFocus
                        />
                    </div>
                </div>

                {/* Job Lists */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Recent Jobs */}
                    {recentFilteredJobs.length > 0 && (
                        <div className="mb-6">
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Star className="w-4 h-4 text-yellow-500" />
                                Recent Jobs
                            </h3>
                            <div className="space-y-2">
                                {recentFilteredJobs.map((job, index) => renderJobItem(job, index, true))}
                            </div>
                        </div>
                    )}

                    {/* All Jobs */}
                    {otherJobs.length > 0 && (
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                                <Briefcase className="w-4 h-4" />
                                All Jobs ({otherJobs.length})
                            </h3>
                            <div className="space-y-2">
                                {otherJobs.map((job, index) =>
                                    renderJobItem(job, index + recentFilteredJobs.length)
                                )}
                            </div>
                        </div>
                    )}

                    {/* No results */}
                    {allFilteredJobs.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                            <Briefcase className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                            <p className="text-sm">No jobs found</p>
                            {searchTerm && (
                                <p className="text-xs mt-1">Try adjusting your search term</p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 border-t border-gray-200 bg-gray-50">
                    {/* Selected Job Preview */}
                    {selectedJob && (
                        <div className="mb-4 p-3 bg-white rounded-lg border">
                            <div className="text-xs text-gray-500 mb-1">Selected Job</div>
                            <div className="font-medium text-sm">{selectedJob}</div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                        <button
                            onClick={handleSave}
                            disabled={!selectedJob}
                            className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            {selectedJob ? 'Assign Job' : 'Select a Job'}
                        </button>

                        {currentAssignment && (
                            <button
                                onClick={handleClear}
                                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className="mt-3 text-xs text-gray-500 text-center">
                        <p>↑↓ Navigate • Enter Select • Esc Close</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssignmentSidebar;