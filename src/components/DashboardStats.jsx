// src/components/DashboardStats.jsx
import { Calendar, Users, Briefcase, Clock, TrendingUp, AlertTriangle } from 'lucide-react';

function DashboardStats({ stats, subcontractors, assignments }) {
    // Calculate additional metrics
    const getUtilizationStats = () => {
        if (subcontractors.length === 0) return { average: 0, high: 0, low: 0 };

        const utilizations = subcontractors.map(sub => {
            const weekAssignments = Object.keys(assignments).filter(key =>
                key.startsWith(`${sub.id}-`)
            ).length;
            return Math.round((weekAssignments / 7) * 100);
        });

        return {
            average: Math.round(utilizations.reduce((sum, util) => sum + util, 0) / utilizations.length),
            high: utilizations.filter(util => util > 80).length,
            low: utilizations.filter(util => util < 20).length
        };
    };

    const utilization = getUtilizationStats();

    const statCards = [
        {
            title: 'Total Assignments',
            value: stats.totalAssignments,
            icon: Calendar,
            color: 'blue',
            description: 'Active assignments'
        },
        {
            title: 'Active Jobs',
            value: stats.uniqueJobs,
            icon: Briefcase,
            color: 'green',
            description: 'Unique jobs scheduled'
        },
        {
            title: 'Assigned Subs',
            value: stats.assignedSubcontractors,
            icon: Users,
            color: 'purple',
            description: `of ${stats.totalSubcontractors} total`
        },
        {
            title: 'Avg Utilization',
            value: `${utilization.average}%`,
            icon: TrendingUp,
            color: 'orange',
            description: `${utilization.high} high, ${utilization.low} low`
        }
    ];

    const getColorClasses = (color) => {
        const colors = {
            blue: 'bg-blue-500 text-blue-500',
            green: 'bg-green-500 text-green-500',
            purple: 'bg-purple-500 text-purple-500',
            orange: 'bg-orange-500 text-orange-500'
        };
        return colors[color] || colors.blue;
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {statCards.map((stat, index) => {
                const Icon = stat.icon;
                const colorClass = getColorClasses(stat.color);

                return (
                    <div key={index} className="bg-white p-6 rounded-lg shadow-sm border hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`p-2 rounded-lg bg-opacity-10 ${colorClass.split(' ')[0]}`}>
                                    <Icon className={`w-5 h-5 ${colorClass.split(' ')[1]}`} />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <p className="text-xs text-gray-500">{stat.description}</p>

                            {/* Add warning indicators */}
                            {stat.title === 'Avg Utilization' && utilization.high > 0 && (
                                <div className="flex items-center gap-1 text-amber-600">
                                    <AlertTriangle className="w-3 h-3" />
                                    <span className="text-xs">{utilization.high} overloaded</span>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export default DashboardStats;