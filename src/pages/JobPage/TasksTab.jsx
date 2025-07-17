import { useState } from 'react';
import {
    CheckSquare,
    Clock,
    AlertCircle,
    Plus,
    Calendar,
    Trash2,
    RotateCcw,
    User
} from 'lucide-react';

export default function TasksTab({
    tasks = [],
    newTaskName,
    setNewTaskName,
    newTaskDue,
    setNewTaskDue,
    handleAddTask,
    cycleTaskStatus,
    deleteTask,
    isDarkMode = false
}) {
    const [filter, setFilter] = useState('all'); // all, todo, in-progress, completed

    // Filter tasks based on selected filter
    const filteredTasks = tasks.filter(task => {
        if (filter === 'all') return true;
        return task.status === filter;
    });

    // Get status info for styling
    const getStatusInfo = (status) => {
        switch (status) {
            case 'completed':
                return {
                    icon: CheckSquare,
                    color: isDarkMode ? 'text-green-400' : 'text-green-600',
                    bgColor: isDarkMode ? 'bg-green-400/10' : 'bg-green-50',
                    borderColor: isDarkMode ? 'border-green-400/20' : 'border-green-200',
                    label: 'Completed'
                };
            case 'in-progress':
                return {
                    icon: Clock,
                    color: isDarkMode ? 'text-blue-400' : 'text-blue-600',
                    bgColor: isDarkMode ? 'bg-blue-400/10' : 'bg-blue-50',
                    borderColor: isDarkMode ? 'border-blue-400/20' : 'border-blue-200',
                    label: 'In Progress'
                };
            default: // todo
                return {
                    icon: AlertCircle,
                    color: isDarkMode ? 'text-yellow-400' : 'text-yellow-600',
                    bgColor: isDarkMode ? 'bg-yellow-400/10' : 'bg-yellow-50',
                    borderColor: isDarkMode ? 'border-yellow-400/20' : 'border-yellow-200',
                    label: 'To Do'
                };
        }
    };

    // Format date for display
    const formatDate = (date) => {
        if (!date) return '—';

        try {
            // Handle Firestore timestamp
            const dateObj = date.toDate ? date.toDate() : new Date(date);
            return dateObj.toLocaleDateString();
        } catch (error) {
            return '—';
        }
    };

    // Get task statistics
    const taskStats = {
        total: tasks.length,
        completed: tasks.filter(t => t.status === 'completed').length,
        inProgress: tasks.filter(t => t.status === 'in-progress').length,
        todo: tasks.filter(t => t.status === 'todo').length
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Tasks & Schedule
                    </h2>
                    <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Manage project tasks and track progress
                    </p>
                </div>

                {/* Task Statistics */}
                <div className="flex gap-4 text-sm">
                    <div className={`text-center ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        <div className="font-bold text-lg">{taskStats.total}</div>
                        <div>Total</div>
                    </div>
                    <div className={`text-center ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        <div className="font-bold text-lg">{taskStats.inProgress}</div>
                        <div>In Progress</div>
                    </div>
                    <div className={`text-center ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        <div className="font-bold text-lg">{taskStats.completed}</div>
                        <div>Completed</div>
                    </div>
                </div>
            </div>

            {/* Add Task Form */}
            <div className={`p-6 rounded-xl border ${isDarkMode
                    ? 'bg-gray-800/30 border-gray-700'
                    : 'bg-white border-gray-200'
                }`}>
                <h3 className={`font-semibold mb-4 flex items-center gap-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                    <Plus className="w-5 h-5" />
                    Add New Task
                </h3>

                <form onSubmit={handleAddTask} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-2">
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Task Name *
                            </label>
                            <input
                                type="text"
                                placeholder="Enter task name..."
                                value={newTaskName}
                                onChange={(e) => setNewTaskName(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDarkMode
                                        ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-400'
                                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                                    }`}
                                required
                            />
                        </div>

                        <div>
                            <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                                }`}>
                                Due Date
                            </label>
                            <input
                                type="date"
                                value={newTaskDue}
                                onChange={(e) => setNewTaskDue(e.target.value)}
                                className={`w-full px-4 py-3 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all ${isDarkMode
                                        ? 'bg-gray-700/50 border-gray-600 text-white'
                                        : 'bg-white border-gray-300 text-gray-900'
                                    }`}
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${isDarkMode
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-blue-600 text-white hover:bg-blue-700'
                            }`}
                    >
                        <Plus className="w-4 h-4" />
                        Add Task
                    </button>
                </form>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2 overflow-x-auto">
                {[
                    { key: 'all', label: 'All Tasks', count: taskStats.total },
                    { key: 'todo', label: 'To Do', count: taskStats.todo },
                    { key: 'in-progress', label: 'In Progress', count: taskStats.inProgress },
                    { key: 'completed', label: 'Completed', count: taskStats.completed }
                ].map((filterOption) => (
                    <button
                        key={filterOption.key}
                        onClick={() => setFilter(filterOption.key)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200 whitespace-nowrap ${filter === filterOption.key
                                ? isDarkMode
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-blue-600 text-white'
                                : isDarkMode
                                    ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                            }`}
                    >
                        <span>{filterOption.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${filter === filterOption.key
                                ? 'bg-white/20 text-white'
                                : isDarkMode
                                    ? 'bg-gray-700 text-gray-300'
                                    : 'bg-gray-200 text-gray-600'
                            }`}>
                            {filterOption.count}
                        </span>
                    </button>
                ))}
            </div>

            {/* Tasks List */}
            <div className="space-y-3">
                {filteredTasks.length === 0 ? (
                    <div className={`text-center py-12 ${isDarkMode
                            ? 'bg-gray-800/30 border-gray-700'
                            : 'bg-gray-50 border-gray-200'
                        } border rounded-xl`}>
                        <CheckSquare className={`w-12 h-12 mx-auto mb-3 ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                            }`} />
                        <h3 className={`font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                            {filter === 'all' ? 'No tasks yet' : `No ${filter.replace('-', ' ')} tasks`}
                        </h3>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-500'
                            }`}>
                            {filter === 'all'
                                ? 'Create your first task to get started'
                                : `Tasks will appear here when they are ${filter.replace('-', ' ')}`
                            }
                        </p>
                    </div>
                ) : (
                    filteredTasks.map((task) => {
                        const statusInfo = getStatusInfo(task.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <div
                                key={task.id}
                                className={`p-4 rounded-xl border transition-all duration-200 hover:shadow-md ${isDarkMode
                                        ? 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50'
                                        : 'bg-white border-gray-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-start gap-3 mb-2">
                                            {/* Status Badge */}
                                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium border ${statusInfo.bgColor
                                                } ${statusInfo.borderColor}`}>
                                                <StatusIcon className={`w-3 h-3 ${statusInfo.color}`} />
                                                <span className={statusInfo.color}>
                                                    {statusInfo.label}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Task Name */}
                                        <h4 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-900'
                                            } ${task.status === 'completed' ? 'line-through opacity-75' : ''}`}>
                                            {task.name}
                                        </h4>

                                        {/* Task Meta Info */}
                                        <div className="flex items-center gap-4 text-sm">
                                            {task.dueDate && (
                                                <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    <Calendar className="w-4 h-4" />
                                                    Due: {formatDate(task.dueDate)}
                                                </div>
                                            )}

                                            {task.createdBy && (
                                                <div className={`flex items-center gap-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                                    }`}>
                                                    <User className="w-4 h-4" />
                                                    {task.createdBy}
                                                </div>
                                            )}

                                            {task.completedAt && task.completedBy && (
                                                <div className={`flex items-center gap-1 ${isDarkMode ? 'text-green-400' : 'text-green-600'
                                                    }`}>
                                                    <CheckSquare className="w-4 h-4" />
                                                    Completed by {task.completedBy}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2 ml-4">
                                        <button
                                            onClick={() => cycleTaskStatus(task.id, task.status)}
                                            className={`p-2 rounded-lg transition-colors flex items-center gap-1 text-sm font-medium ${isDarkMode
                                                    ? 'text-blue-400 hover:text-blue-300 hover:bg-blue-500/10'
                                                    : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
                                                }`}
                                            title="Change status"
                                        >
                                            <RotateCcw className="w-4 h-4" />
                                            {task.status === 'todo' ? 'Start' :
                                                task.status === 'in-progress' ? 'Complete' : 'Reopen'}
                                        </button>

                                        <button
                                            onClick={() => deleteTask(task.id)}
                                            className={`p-2 rounded-lg transition-colors ${isDarkMode
                                                    ? 'text-red-400 hover:text-red-300 hover:bg-red-500/10'
                                                    : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                                                }`}
                                            title="Delete task"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}