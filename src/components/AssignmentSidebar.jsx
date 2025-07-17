// src/components/AssignmentSidebar.jsx
import { useState, useEffect } from 'react';
import { X, Search, Clock, User, Briefcase, Star, ChevronRight } from 'lucide-react';

function AssignmentSidebar({
    date,
    subcontractor,
    currentAssignment,
    jobOptions = [],
    onSave,
    onClose,
    isDarkMode = false
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
        const lightColors = {
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

        const darkColors = {
            'kitchen': 'bg-orange-900/30 border-orange-700 text-orange-300',
            'bathroom': 'bg-blue-900/30 border-blue-700 text-blue-300',
            'basement': 'bg-purple-900/30 border-purple-700 text-purple-300',
            'flooring': 'bg-indigo-900/30 border-indigo-700 text-indigo-300',
            'painting': 'bg-pink-900/30 border-pink-700 text-pink-300',
            'electrical': 'bg-yellow-900/30 border-yellow-700 text-yellow-300',
            'plumbing': 'bg-cyan-900/30 border-cyan-700 text-cyan-300',
            'hvac': 'bg-red-900/30 border-red-700 text-red-300',
            'drywall': 'bg-green-900/30 border-green-700 text-green-300',
            'framing': 'bg-amber-900/30 border-amber-700 text-amber-300',
            'roofing': 'bg-slate-900/30 border-slate-700 text-slate-300',
            'landscaping': 'bg-lime-900/30 border-lime-700 text-lime-300',
            'cleanup': 'bg-gray-900/30 border-gray-700 text-gray-300',
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
            'job a': 'bg-blue-50 border-blue-200 text-blue-700',
            'job b': 'bg-green-50 border-green-200 text-green-700',
            'job c': 'bg-purple-50 border-purple-200 text-purple-700',
            'job d': 'bg-orange-50 border-orange-200 text-orange-700',
        };

        const defaultDark = {
            'job a': 'bg-blue-900/30 border-blue-700 text-blue-300',
            'job b': 'bg-green-900/30 border-green-700 text-green-300',
            'job c': 'bg-purple-900/30 border-purple-700 text-purple-300',
            'job d': 'bg-orange-900/30 border-orange-700 text-orange-300',
        };

        const defaults = isDarkMode ? defaultDark : defaultLight;
        return defaults[jobLower] || (isDarkMode
            ? 'bg-slate-900/30 border-slate-700 text-slate-300'
            : 'bg-slate-50 border-slate-200 text-slate-700'
        );
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
          flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all duration-150 border-2
          ${isFocused ? (isDarkMode ? 'bg-blue-900/30 border-blue-600' : 'bg-blue-100 border-blue-300') : 'hover:bg-opacity-80'}
          ${isSelected ? (isDarkMode ? 'ring-2 ring-blue-400 bg-blue-900/20' : 'ring-2 ring-blue-400 bg-blue-50') : ''}
          ${colorClass}
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
            <div className={`w-full max-w-md h-full shadow-2xl flex flex-col border-l backdrop-blur-sm ${isDarkMode
                    ? 'bg-gray-900/95 border-gray-700'
                    : 'bg-white/95 border-gray-200'
                }`}>
                {/* Header */}
                <div className={`p-6 border-b ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
                    }`}>
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <h2 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                Assign Job
                            </h2>
                            <div className="flex items-center gap-2 mt-1">
                                <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`} />
                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    {subcontractor?.name || 'Unknown Contractor'}
                                </span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <Clock className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                    }`} />
                                <span className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                                    }`}>
                                    {date}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'hover:bg-gray-700 text-gray-400 hover:text-white'
                                    : 'hover:bg-gray-200 text-gray-500 hover:text-gray-700'
                                }`}
                            title="Close (Esc)"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Current Assignment */}
                    {currentAssignment && (
                        <div className={`p-3 rounded-lg border ${isDarkMode
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200'
                            }`}>
                            <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                Current Assignment
                            </div>
                            <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                {currentAssignment}
                            </div>
                        </div>
                    )}
                </div>

                {/* Search */}
                <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                    <div className="relative">
                        <Search className={`absolute left-3 top-3 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-400'
                            }`} />
                        <input
                            type="text"
                            placeholder="Search jobs..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`w-full pl-10 pr-4 py-2 border rounded-lg transition-colors ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                                }`}
                            autoFocus
                        />
                    </div>
                </div>

                {/* Job Lists */}
                <div className="flex-1 overflow-y-auto p-4">
                    {/* Recent Jobs */}
                    {recentFilteredJobs.length > 0 && (
                        <div className="mb-6">
                            <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
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
                            <h3 className={`text-sm font-medium mb-3 flex items-center gap-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
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
                        <div className="text-center py-8">
                            <Briefcase className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-600' : 'text-gray-300'
                                }`} />
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                No jobs found
                            </p>
                            {searchTerm && (
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                                    }`}>
                                    Try adjusting your search term
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className={`p-4 border-t ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50/50'
                    }`}>
                    {/* Selected Job Preview */}
                    {selectedJob && (
                        <div className={`mb-4 p-3 rounded-lg border ${isDarkMode
                                ? 'bg-gray-800 border-gray-700'
                                : 'bg-white border-gray-200'
                            }`}>
                            <div className={`text-xs mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                }`}>
                                Selected Job
                            </div>
                            <div className={`font-medium text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                {selectedJob}
                            </div>
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
                                className={`px-4 py-2 rounded-lg transition-colors ${isDarkMode
                                        ? 'bg-red-900/30 text-red-400 hover:bg-red-900/50'
                                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                                    }`}
                            >
                                Clear
                            </button>
                        )}
                    </div>

                    {/* Keyboard Shortcuts */}
                    <div className={`mt-3 text-xs text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                        <p>↑↓ Navigate • Enter Select • Esc Close</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AssignmentSidebar;