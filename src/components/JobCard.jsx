import { Link } from "react-router-dom";
import { useState } from "react";

export default function JobCard({ job, isDarkMode, onDelete, onArchive }) {
    const [showMenu, setShowMenu] = useState(false);

    const getStatusColor = (status) => {
        switch (status) {
            case 'completed': return 'bg-green-100 text-green-800';
            case 'in-progress': return 'bg-blue-100 text-blue-800';
            case 'pending': return 'bg-yellow-100 text-yellow-800';
            case 'on-hold': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatBudget = (budget) => {
        if (!budget) return '—';
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(budget);
    };

    const formatDate = (timestamp) => {
        if (!timestamp?.seconds) return '—';
        return new Date(timestamp.seconds * 1000).toLocaleDateString();
    };

    const handleMenuClick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(!showMenu);
    };

    const handleDelete = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        onDelete?.(job);
    };

    const handleArchive = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setShowMenu(false);
        onArchive?.(job);
    };

    return ( 
        <div className="relative group">
            <Link
                to={`/job/${job.id}`}
                className={`block p-5 rounded-2xl transition-all border hover:shadow-lg hover:scale-[1.02] relative overflow-hidden
            ${isDarkMode
                        ? "bg-gray-800/50 border-gray-700 hover:bg-gray-700/70"
                        : "bg-white/80 border-gray-200 hover:bg-white"
                    }`}
            >
                {/* Header with title and menu */}
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                        <h3 className={`text-lg font-semibold truncate ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {job.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                                {job.status || 'pending'}
                            </span>
                        </div>
                    </div>
                    
                    {/* Three-dot menu - only show on hover or when menu is open */}
                    <div className={`transition-opacity ${showMenu ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <button
                            onClick={handleMenuClick}
                            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-100'}`}
                        >
                            <svg className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Description */}
                <p className={`text-sm mb-4 line-clamp-2 ${isDarkMode ? "text-gray-300" : "text-gray-600"}`}>
                    {job.description || "No description"}
                </p>

                {/* Job details */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Budget:</span>
                        <span className={`font-semibold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                            {formatBudget(job.budget)}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Timeline:</span>
                        <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {job.timeline ? `${job.timeline} days` : '—'}
                        </span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <span className={`font-medium ${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Created:</span>
                        <span className={`${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                            {formatDate(job.createdAt)}
                        </span>
                    </div>
                </div>

                {/* Progress indicator placeholder - you can enhance this later */}
                <div className="mt-4 pt-3 border-t border-gray-200/50">
                    <div className="flex items-center justify-between text-xs">
                        <span className={`${isDarkMode ? "text-gray-400" : "text-gray-500"}`}>Progress</span>
                        <span className={`font-medium ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>—</span>
                    </div>
                </div>
            </Link>

            {/* Dropdown menu */}
            {showMenu && (
                <>
                    {/* Backdrop to close menu */}
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowMenu(false)}
                    />
                    {/* Menu */}
                    <div className={`absolute top-12 right-2 z-20 w-48 rounded-lg shadow-lg border py-1 ${
                        isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                    }`}>
                        <button
                            onClick={handleArchive}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                                isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700'
                            }`}
                        >
                            Archive Job
                        </button>
                        <button
                            onClick={handleDelete}
                            className={`w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 ${
                                isDarkMode ? 'hover:bg-red-900/20' : ''
                            }`}
                        >
                            Delete Job
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
