// src/pages/JobPage/OverviewTab.jsx
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
    Briefcase
} from 'lucide-react';

export default function OverviewTab({
    job,
    tasks = [],
    team = [],
    receipts = [],
    budgetData = {},
    budgetLoading = true,
    isDarkMode = false
}) {
    // Calculate dynamic recent activities from actual data
    const [recentActivities, setRecentActivities] = useState([]);

    useEffect(() => {
        const activities = [];

        // Add recent completed tasks
        const recentCompletedTasks = tasks
            .filter(t => t.status === 'completed' && t.completedAt)
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 2);

        recentCompletedTasks.forEach(task => {
            activities.push({
                id: `task-${task.id}`,
                type: 'task_completed',
                message: `Task "${task.name}" completed`,
                timestamp: formatRelativeTime(task.completedAt),
                user: task.completedBy || 'Team Member'
            });
        });

        // Add recent team additions
        const recentTeamMembers = team
            .filter(m => m.addedAt)
            .sort((a, b) => new Date(b.addedAt) - new Date(a.addedAt))
            .slice(0, 2);

        recentTeamMembers.forEach(member => {
            activities.push({
                id: `team-${member.id}`,
                type: 'team_added',
                message: `${member.name} added to team`,
                timestamp: formatRelativeTime(member.addedAt),
                user: 'Project Manager'
            });
        });

        // Add recent receipts
        const recentReceipts = receipts
            .filter(r => r.uploadedAt)
            .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
            .slice(0, 2);

        recentReceipts.forEach(receipt => {
            activities.push({
                id: `receipt-${receipt.id}`,
                type: 'receipt_uploaded',
                message: `Receipt uploaded: ${receipt.fileName}`,
                timestamp: formatRelativeTime(receipt.uploadedAt),
                user: receipt.uploadedBy || 'Team Member'
            });
        });

        // Sort all activities by most recent and take top 5
        const sortedActivities = activities
            .sort((a, b) => {
                // Convert relative times back to dates for proper sorting
                const aDate = getDateFromActivity(a);
                const bDate = getDateFromActivity(b);
                return bDate - aDate;
            })
            .slice(0, 5);

        setRecentActivities(sortedActivities);
    }, [tasks, team, receipts]);

    // Helper function to format relative time
    const formatRelativeTime = (timestamp) => {
        if (!timestamp) return 'Unknown';

        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    };

    // Helper to get date from activity for sorting
    const getDateFromActivity = (activity) => {
        // This is a simplified approach - in a real app you'd store the actual timestamp
        const now = new Date();
        if (activity.timestamp.includes('hour')) {
            const hours = parseInt(activity.timestamp);
            return new Date(now - hours * 60 * 60 * 1000);
        }
        if (activity.timestamp.includes('day')) {
            const days = parseInt(activity.timestamp);
            return new Date(now - days * 24 * 60 * 60 * 1000);
        }
        return now;
    };

    // Calculate dynamic quick stats
    const quickStats = {
        tasksCompleted: tasks.filter(t => t.status === 'completed').length,
        totalTasks: tasks.length,
        teamMembers: team.length,
        daysRemaining: job?.endDate ? Math.max(0, Math.ceil((new Date(job.endDate) - new Date()) / (1000 * 60 * 60 * 24))) : 0,
        budgetUsed: budgetLoading ? 0 : calculateBudgetUsedPercentage(budgetData, job?.budget)
    };

    // Calculate budget percentage used
    function calculateBudgetUsedPercentage(budget, totalBudget) {
        if (!budget || !totalBudget) return 0;

        const totalSpent = Object.values(budget).reduce((sum, category) => {
            return sum + (category?.spent || 0);
        }, 0);

        return Math.round((totalSpent / totalBudget) * 100);
    }

    const getActivityIcon = (type) => {
        switch (type) {
            case 'task_completed':
                return <CheckSquare className="w-4 h-4 text-green-500" />;
            case 'team_added':
                return <Users className="w-4 h-4 text-blue-500" />;
            case 'receipt_uploaded':
                return <FileText className="w-4 h-4 text-purple-500" />;
            default:
                return <Clock className="w-4 h-4 text-gray-500" />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active':
            case 'in-progress':
                return 'text-green-600 bg-green-100 border-green-200';
            case 'pending':
                return 'text-yellow-600 bg-yellow-100 border-yellow-200';
            case 'completed':
                return 'text-blue-600 bg-blue-100 border-blue-200';
            case 'on-hold':
                return 'text-red-600 bg-red-100 border-red-200';
            default:
                return 'text-gray-600 bg-gray-100 border-gray-200';
        }
    };

    return (
        <div className="space-y-8">

            {/* Project Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">

                {/* Progress Card */}
                <div className={`p-6 rounded-xl border ${isDarkMode
                        ? 'bg-gradient-to-br from-blue-900/20 to-blue-800/10 border-blue-800/30'
                        : 'bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-blue-800/30' : 'bg-blue-100'
                            }`}>
                            <Target className="w-5 h-5 text-blue-600" />
                        </div>
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-blue-400' : 'text-blue-600'
                            }`}>
                            {Math.round((quickStats.tasksCompleted / quickStats.totalTasks) * 100)}%
                        </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        Progress
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        {quickStats.tasksCompleted} of {quickStats.totalTasks} tasks done
                    </p>
                    <div className="mt-3">
                        <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                            <div
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${(quickStats.tasksCompleted / quickStats.totalTasks) * 100}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Team Card */}
                <div className={`p-6 rounded-xl border ${isDarkMode
                        ? 'bg-gradient-to-br from-green-900/20 to-green-800/10 border-green-800/30'
                        : 'bg-gradient-to-br from-green-50 to-green-100/50 border-green-200'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-green-800/30' : 'bg-green-100'
                            }`}>
                            <Users className="w-5 h-5 text-green-600" />
                        </div>
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'
                            }`}>
                            {quickStats.teamMembers}
                        </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        Team Members
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Active contributors
                    </p>
                </div>

                {/* Timeline Card */}
                <div className={`p-6 rounded-xl border ${isDarkMode
                        ? 'bg-gradient-to-br from-orange-900/20 to-orange-800/10 border-orange-800/30'
                        : 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-orange-800/30' : 'bg-orange-100'
                            }`}>
                            <Clock className="w-5 h-5 text-orange-600" />
                        </div>
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-orange-400' : 'text-orange-600'
                            }`}>
                            {quickStats.daysRemaining}
                        </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        Days Left
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Until deadline
                    </p>
                </div>

                {/* Budget Card */}
                <div className={`p-6 rounded-xl border ${isDarkMode
                        ? 'bg-gradient-to-br from-purple-900/20 to-purple-800/10 border-purple-800/30'
                        : 'bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200'
                    }`}>
                    <div className="flex items-center justify-between mb-3">
                        <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-purple-800/30' : 'bg-purple-100'
                            }`}>
                            <DollarSign className="w-5 h-5 text-purple-600" />
                        </div>
                        <span className={`text-2xl font-bold ${isDarkMode ? 'text-purple-400' : 'text-purple-600'
                            }`}>
                            {quickStats.budgetUsed}%
                        </span>
                    </div>
                    <h3 className={`font-semibold mb-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        Budget Used
                    </h3>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        Of total allocated
                    </p>
                    <div className="mt-3">
                        <div className={`w-full rounded-full h-2 ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                            }`}>
                            <div
                                className={`h-2 rounded-full transition-all duration-300 ${quickStats.budgetUsed > 90 ? 'bg-red-500' :
                                        quickStats.budgetUsed > 75 ? 'bg-yellow-500' : 'bg-purple-500'
                                    }`}
                                style={{ width: `${quickStats.budgetUsed}%` }}
                            />
                        </div>
                    </div>
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
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                Project Description
                            </h3>
                            <button className={`p-2 rounded-lg transition-colors ${isDarkMode
                                    ? 'text-gray-400 hover:text-white hover:bg-gray-700'
                                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                                }`}>
                                <Edit3 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className={`text-sm leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                            }`}>
                            {job.description || (
                                <div className="space-y-2">
                                    <p>
                                        Complete kitchen renovation including cabinet installation, countertop replacement,
                                        and appliance updates. This project involves coordinating with multiple contractors
                                        and ensuring all work meets building codes.
                                    </p>
                                    <p>
                                        Key deliverables include demolition, electrical updates, plumbing modifications,
                                        cabinet installation, and final cleanup.
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Project Tags */}
                        <div className="flex flex-wrap gap-2 mt-4">
                            {['Kitchen', 'Renovation', 'High Priority'].map((tag) => (
                                <span
                                    key={tag}
                                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${isDarkMode
                                            ? 'bg-gray-700 text-gray-300 border border-gray-600'
                                            : 'bg-gray-100 text-gray-700 border border-gray-200'
                                        }`}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Project Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                        {/* Client Information */}
                        <div className={`p-6 rounded-xl border ${isDarkMode
                                ? 'bg-gray-800/30 border-gray-700'
                                : 'bg-white border-gray-200'
                            }`}>
                            <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                <User className="w-5 h-5" />
                                Client Information
                            </h4>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                        <User className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {job.client || 'Sarah Johnson'}
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            Property Owner
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                        <Phone className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            (555) 123-4567
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            Primary Contact
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                        <Mail className="w-4 h-4 text-gray-500" />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            sarah.johnson@email.com
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            Email Address
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Project Timeline */}
                        <div className={`p-6 rounded-xl border ${isDarkMode
                                ? 'bg-gray-800/30 border-gray-700'
                                : 'bg-white border-gray-200'
                            }`}>
                            <h4 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                <Calendar className="w-5 h-5" />
                                Timeline & Milestones
                            </h4>

                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                        <Calendar className="w-4 h-4 text-green-500" />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            Start Date
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            {job.startDate || 'January 15, 2025'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                        <Calendar className="w-4 h-4 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            Target Completion
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            {job.endDate || 'March 1, 2025'}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                        <MapPin className="w-4 h-4 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            Location
                                        </p>
                                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                            }`}>
                                            {job.location || '123 Main St, Anytown USA'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Activity & Actions */}
                <div className="space-y-6">

                    {/* Recent Activity */}
                    <div className={`p-6 rounded-xl border ${isDarkMode
                            ? 'bg-gray-800/30 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}>
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'
                                }`}>
                                Recent Activity
                            </h3>
                            <button className={`text-sm font-medium text-orange-600 hover:text-orange-700`}>
                                View All
                            </button>
                        </div>

                        <div className="space-y-4">
                            {recentActivities.map((activity) => (
                                <div key={activity.id} className="flex items-start gap-3">
                                    <div className={`p-2 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                                        }`}>
                                        {getActivityIcon(activity.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            }`}>
                                            {activity.message}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                {activity.user}
                                            </span>
                                            <span className={`w-1 h-1 rounded-full ${isDarkMode ? 'bg-gray-600' : 'bg-gray-400'
                                                }`} />
                                            <span className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
                                                }`}>
                                                {activity.timestamp}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className={`p-6 rounded-xl border ${isDarkMode
                            ? 'bg-gray-800/30 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Quick Actions
                        </h3>

                        <div className="space-y-3">
                            <button className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${isDarkMode
                                    ? 'bg-gray-700/50 hover:bg-gray-700 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                                }`}>
                                <Plus className="w-5 h-5 text-green-500" />
                                <div>
                                    <p className="font-medium">Add Task</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        Create new project task
                                    </p>
                                </div>
                            </button>

                            <button className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${isDarkMode
                                    ? 'bg-gray-700/50 hover:bg-gray-700 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                                }`}>
                                <Users className="w-5 h-5 text-blue-500" />
                                <div>
                                    <p className="font-medium">Invite Team Member</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        Add someone to the project
                                    </p>
                                </div>
                            </button>

                            <button className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${isDarkMode
                                    ? 'bg-gray-700/50 hover:bg-gray-700 text-white'
                                    : 'bg-gray-50 hover:bg-gray-100 text-gray-900'
                                }`}>
                                <FileText className="w-5 h-5 text-purple-500" />
                                <div>
                                    <p className="font-medium">Upload Document</p>
                                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                        }`}>
                                        Add project files
                                    </p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Project Health */}
                    <div className={`p-6 rounded-xl border ${isDarkMode
                            ? 'bg-gray-800/30 border-gray-700'
                            : 'bg-white border-gray-200'
                        }`}>
                        <h3 className={`text-lg font-semibold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Project Health
                        </h3>

                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        Schedule
                                    </span>
                                </div>
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    On Track
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        Budget
                                    </span>
                                </div>
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Watch
                                </span>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                    <span className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'
                                        }`}>
                                        Quality
                                    </span>
                                </div>
                                <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                    }`}>
                                    Good
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}