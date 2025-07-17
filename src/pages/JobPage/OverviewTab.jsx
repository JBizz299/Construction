import { useState, useEffect } from 'react';
import {
    Calendar,
    MapPin,
    Phone,
    Mail,
    Clock,
    DollarSign,
    User,
    Users,
    CheckSquare,
    AlertTriangle,
    TrendingUp,
    FileText,
    Star,
    Edit3,
    Plus,
    Target,
    Briefcase,
    Save,
    X,
    Activity
} from 'lucide-react';

export default function OverviewTab({
    job,
    tasks = [],
    team = [],
    receipts = [],
    budgetData = {},
    budgetLoading = true,
    onUpdateJob,
    isDarkMode = false
}) {
    // State for editing
    const [isEditingDescription, setIsEditingDescription] = useState(false);
    const [editedDescription, setEditedDescription] = useState(job?.description || '');
    const [savingDescription, setSavingDescription] = useState(false);

    // Recent activities state
    const [recentActivities, setRecentActivities] = useState([]);

    // Update edited description when job changes
    useEffect(() => {
        setEditedDescription(job?.description || '');
    }, [job?.description]);

    // Calculate dynamic recent activities from actual data
    useEffect(() => {
        const activities = [];

        // Add recent completed tasks
        const recentCompletedTasks = tasks
            .filter(t => t.status === 'completed' && t.completedAt)
            .sort((a, b) => {
                const aDate = a.completedAt?.toDate ? a.completedAt.toDate() : new Date(a.completedAt);
                const bDate = b.completedAt?.toDate ? b.completedAt.toDate() : new Date(b.completedAt);
                return bDate - aDate;
            })
            .slice(0, 3);

        recentCompletedTasks.forEach(task => {
            activities.push({
                id: `task-${task.id}`,
                type: 'task_completed',
                message: `Task "${task.name}" completed`,
                timestamp: task.completedAt,
                user: task.completedBy || 'Team Member',
                icon: CheckSquare,
                color: 'green'
            });
        });

        // Add recent team additions
        const recentTeamMembers = team
            .filter(m => m.addedAt)
            .sort((a, b) => {
                const aDate = a.addedAt?.toDate ? a.addedAt.toDate() : new Date(a.addedAt);
                const bDate = b.addedAt?.toDate ? b.addedAt.toDate() : new Date(b.addedAt);
                return bDate - aDate;
            })
            .slice(0, 2);

        recentTeamMembers.forEach(member => {
            activities.push({
                id: `team-${member.id}`,
                type: 'team_added',
                message: `${member.name} joined the team`,
                timestamp: member.addedAt,
                user: 'Project Manager',
                icon: Users,
                color: 'blue'
            });
        });

        // Add recent receipts
        const recentReceipts = receipts
            .filter(r => r.uploadedAt)
            .sort((a, b) => {
                const aDate = a.uploadedAt?.toDate ? a.uploadedAt.toDate() : new Date(a.uploadedAt);
                const bDate = b.uploadedAt?.toDate ? b.uploadedAt.toDate() : new Date(b.uploadedAt);
                return bDate - aDate;
            })
            .slice(0, 3);

        recentReceipts.forEach(receipt => {
            activities.push({
                id: `receipt-${receipt.id}`,
                type: 'receipt_uploaded',
                message: `Receipt uploaded: ${receipt.fileName}`,
                timestamp: receipt.uploadedAt,
                user: receipt.uploadedBy || 'Team Member',
                icon: FileText,
                color: 'purple'
            });
        });

        // Sort all activities by most recent and take top 6
        const sortedActivities = activities
            .sort((a, b) => {
                const aDate = a.timestamp?.toDate ? a.timestamp.toDate() : new Date(a.timestamp);
                const bDate = b.timestamp?.toDate ? b.timestamp.toDate() : new Date(b.timestamp);
                return bDate - aDate;
            })
            .slice(0, 6);

        setRecentActivities(sortedActivities);
    }, [tasks, team, receipts]);

    // Helper function to format relative time
    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return 'Unknown';

        const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));

        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    };

    // Calculate dynamic quick stats
    const quickStats = {
        tasksCompleted: tasks.filter(t => t.status === 'completed').length,
        totalTasks: tasks.length,
        teamMembers: team.length,
        daysRemaining: job?.endDate ? Math.max(0, Math.ceil((new Date(job.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : null,
        budgetUsed: budgetLoading ? 0 : Math.round(budgetData.budgetUsed || 0),
        totalSpent: budgetLoading ? 0 : budgetData.totalSpent || 0,
        receiptCount: receipts.length
    };

    // Handle description editing
    const handleStartEdit = () => {
        setIsEditingDescription(true);
        setEditedDescription(job?.description || '');
    };

    const handleCancelEdit = () => {
        setIsEditingDescription(false);
        setEditedDescription(job?.description || '');
    };

    const handleSaveDescription = async () => {
        if (!onUpdateJob) {
            console.error('onUpdateJob function not provided');
            return;
        }

        setSavingDescription(true);
        try {
            await onUpdateJob(job.id, { description: editedDescription });
            setIsEditingDescription(false);
        } catch (error) {
            console.error('Failed to update description:', error);
            alert('Failed to update description. Please try again.');
        } finally {
            setSavingDescription(false);
        }
    };

    const getTaskStatusColor = (status) => {
        switch (status) {
            case 'completed': return isDarkMode ? 'text-green-400' : 'text-green-600';
            case 'in-progress': return isDarkMode ? 'text-yellow-400' : 'text-yellow-600';
            default: return isDarkMode ? 'text-gray-400' : 'text-gray-600';
        }
    };

    const getBudgetStatusColor = (percentage) => {
        if (percentage > 90) return 'bg-red-500';
        if (percentage > 75) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const getActivityIconColor = (color) => {
        const colors = {
            green: isDarkMode ? 'text-green-400 bg-green-400/10' : 'text-green-600 bg-green-50',
            blue: isDarkMode ? 'text-blue-400 bg-blue-400/10' : 'text-blue-600 bg-blue-50',
            purple: isDarkMode ? 'text-purple-400 bg-purple-400/10' : 'text-purple-600 bg-purple-50',
            orange: isDarkMode ? 'text-orange-400 bg-orange-400/10' : 'text-orange-600 bg-orange-50'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className={`space-y-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {/* Tasks Progress */}
                <div className={`p-4 rounded-xl border ${isDarkMode
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <CheckSquare className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                            {quickStats.tasksCompleted}/{quickStats.totalTasks}
                        </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Tasks Complete
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {quickStats.totalTasks > 0
                            ? `${Math.round((quickStats.tasksCompleted / quickStats.totalTasks) * 100)}% complete`
                            : 'No tasks yet'
                        }
                    </p>
                </div>

                {/* Team Size */}
                <div className={`p-4 rounded-xl border ${isDarkMode
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <Users className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            {quickStats.teamMembers}
                        </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Team Members
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Active on project
                    </p>
                </div>

                {/* Budget Status */}
                <div className={`p-4 rounded-xl border ${isDarkMode
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`} />
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                            {quickStats.budgetUsed}%
                        </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Budget Used
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        ${quickStats.totalSpent.toLocaleString()} spent
                    </p>
                    {job?.budget && (
                        <div className="mt-2">
                            <div className={`w-full rounded-full h-1.5 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                <div
                                    className={`h-1.5 rounded-full transition-all duration-300 ${getBudgetStatusColor(quickStats.budgetUsed)}`}
                                    style={{ width: `${Math.min(quickStats.budgetUsed, 100)}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Receipts Count */}
                <div className={`p-4 rounded-xl border ${isDarkMode
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-white border-gray-200'
                    }`}>
                    <div className="flex items-center justify-between mb-2">
                        <FileText className={`w-5 h-5 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`} />
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                            {quickStats.receiptCount}
                        </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Receipts
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Uploaded to project
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* Left Column - Project Details */}
                <div className="lg:col-span-2 space-y-6">

                    {/* Project Description */}
                    <div className={`p-6 rounded-xl border ${isDarkMode
                        ? 'bg-gray-800/30 border-gray-700'
                        : 'bg-white border-gray-200'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Project Description
                            </h3>
                            {!isEditingDescription && (
                                <button
                                    onClick={handleStartEdit}
                                    className={`p-2 rounded-lg transition-colors ${isDarkMode
                                        ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                        }`}
                                    title="Edit description"
                                >
                                    <Edit3 className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        {isEditingDescription ? (
                            <div className="space-y-4">
                                <textarea
                                    value={editedDescription}
                                    onChange={(e) => setEditedDescription(e.target.value)}
                                    placeholder="Enter project description..."
                                    className={`w-full min-h-[120px] p-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-vertical ${isDarkMode
                                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                        }`}
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleSaveDescription}
                                        disabled={savingDescription}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isDarkMode
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-800 disabled:text-gray-300'
                                            : 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-blue-400'
                                            }`}
                                    >
                                        <Save className="w-4 h-4" />
                                        {savingDescription ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={handleCancelEdit}
                                        disabled={savingDescription}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${isDarkMode
                                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:bg-gray-800'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100'
                                            }`}
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {job.description ? (
                                    <p className="whitespace-pre-wrap">{job.description}</p>
                                ) : (
                                    <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p className="font-medium mb-2">No description yet</p>
                                        <p className="text-xs">Click the edit button to add a project description</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Project Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Basic Information */}
                        <div className={`p-6 rounded-xl border ${isDarkMode
                            ? 'bg-gray-800/30 border-gray-700'
                            : 'bg-white border-gray-200'
                            }`}>
                            <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <Briefcase className="w-5 h-5" />
                                Project Details
                            </h4>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Status
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'completed'
                                            ? 'bg-green-100 text-green-800'
                                            : job.status === 'in-progress'
                                                ? 'bg-blue-100 text-blue-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}>
                                        {job.status || 'pending'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Budget
                                    </span>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {job.budget || 'Not set'}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Timeline
                                    </span>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                        {job.timeline || 'Not set'}
                                    </span>
                                </div>

                                {job.startDate && (
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            Start Date
                                        </span>
                                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {new Date(job.startDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}

                                {job.endDate && (
                                    <div className="flex items-center justify-between">
                                        <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            End Date
                                        </span>
                                        <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                            {new Date(job.endDate).toLocaleDateString()}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Client Information */}
                        <div className={`p-6 rounded-xl border ${isDarkMode
                            ? 'bg-gray-800/30 border-gray-700'
                            : 'bg-white border-gray-200'
                            }`}>
                            <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                <User className="w-5 h-5" />
                                Client Information
                            </h4>

                            <div className="space-y-3">
                                {job.clientName ? (
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                            <User className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {job.clientName}
                                            </p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Client Name
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {job.clientEmail ? (
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                            <Mail className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {job.clientEmail}
                                            </p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Email
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {job.clientPhone ? (
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                            <Phone className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {job.clientPhone}
                                            </p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Phone
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {job.location ? (
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                                            <MapPin className={`w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                {job.location}
                                            </p>
                                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                                Location
                                            </p>
                                        </div>
                                    </div>
                                ) : null}

                                {/* Show message if no client info */}
                                {!job.clientName && !job.clientEmail && !job.clientPhone && !job.location ? (
                                    <div className={`text-center py-4 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <p className="text-sm">No client information set</p>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Recent Activity */}
                <div className="space-y-6">
                    <div className={`p-6 rounded-xl border ${isDarkMode
                        ? 'bg-gray-800/30 border-gray-700'
                        : 'bg-white border-gray-200'
                        }`}>
                        <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <Activity className="w-5 h-5" />
                            Recent Activity
                        </h4>

                        {recentActivities.length > 0 ? (
                            <div className="space-y-4">
                                {recentActivities.map((activity) => {
                                    const Icon = activity.icon;
                                    return (
                                        <div key={activity.id} className="flex items-start gap-3">
                                            <div className={`p-2 rounded-lg ${getActivityIconColor(activity.color)}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {activity.message}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {activity.user}
                                                    </span>
                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                                        •
                                                    </span>
                                                    <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {formatRelativeTime(activity.timestamp)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className={`text-center py-8 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                <p className="font-medium mb-2">No recent activity</p>
                                <p className="text-xs">Activity will appear here as you work on the project</p>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className={`p-6 rounded-xl border ${isDarkMode
                        ? 'bg-gray-800/30 border-gray-700'
                        : 'bg-white border-gray-200'
                        }`}>
                        <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            <Target className="w-5 h-5" />
                            Quick Actions
                        </h4>

                        <div className="space-y-3">
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                Jump to other sections:
                            </p>

                            <div className="grid grid-cols-2 gap-2">
                                <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${isDarkMode
                                    ? 'border-gray-600 hover:bg-gray-700/30'
                                    : 'border-gray-200 hover:bg-gray-50'
                                    }`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <CheckSquare className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Tasks
                                        </span>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${isDarkMode
                                    ? 'border-gray-600 hover:bg-gray-700/30'
                                    : 'border-gray-200 hover:bg-gray-50'
                                    }`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <Users className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Team
                                        </span>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${isDarkMode
                                    ? 'border-gray-600 hover:bg-gray-700/30'
                                    : 'border-gray-200 hover:bg-gray-50'
                                    }`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <FileText className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Receipts
                                        </span>
                                    </div>
                                </div>

                                <div className={`p-3 rounded-lg border cursor-pointer transition-colors ${isDarkMode
                                    ? 'border-gray-600 hover:bg-gray-700/30'
                                    : 'border-gray-200 hover:bg-gray-50'
                                    }`}>
                                    <div className="flex flex-col items-center gap-1">
                                        <DollarSign className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`} />
                                        <span className={`text-xs font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                            Budget
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
