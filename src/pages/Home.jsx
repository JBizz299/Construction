// src/pages/Home.jsx - With Construction UI Applied
import React from 'react';
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useJobs } from '../context/JobContext';
import { useDashboardData } from '../hooks/useDashboardData';
import { ConstructionCard, ConstructionButton, ConstructionPage, ConstructionGrid, ConstructionSection, ConstructionLoading } from '../components/ConstructionUI';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  Package,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  BarChart3,
  Activity,
  Plus,
  ArrowRight,
  Home as HomeIcon,
  MapPin,
  Bell
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths, isWithinInterval } from 'date-fns';

export default function Home() {
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { jobs, loading } = useJobs();
  const { assignments, subcontractors } = useDashboardData();
  const navigate = useNavigate();

  const [insights, setInsights] = useState([]);

  // Calculate business metrics
  const businessMetrics = React.useMemo(() => {
    if (!jobs || jobs.length === 0) {
      return {
        revenue: { current: 0, previous: 0, growth: 0, trend: 'neutral' },
        jobs: { active: 0, completed: 0, overdue: 0, total: 0 },
        budget: { total: 0, spent: 0, utilization: 0, remaining: 0 },
        team: { totalSubcontractors: 0, utilization: 0, assignments: 0 }
      };
    }

    const now = new Date();
    const thisMonth = { start: startOfMonth(now), end: endOfMonth(now) };
    const lastMonth = { start: startOfMonth(subMonths(now, 1)), end: endOfMonth(subMonths(now, 1)) };

    const filterJobsByRange = (range) => {
      return jobs.filter(job => {
        const jobDate = job.createdAt?.toDate ? job.createdAt.toDate() : new Date(job.createdAt);
        return isWithinInterval(jobDate, range);
      });
    };

    const thisMonthJobs = filterJobsByRange(thisMonth);
    const lastMonthJobs = filterJobsByRange(lastMonth);

    // Revenue calculations
    const thisMonthRevenue = thisMonthJobs.reduce((sum, job) => sum + (job.budget?.total || 0), 0);
    const lastMonthRevenue = lastMonthJobs.reduce((sum, job) => sum + (job.budget?.total || 0), 0);
    const revenueGrowth = lastMonthRevenue > 0 ? ((thisMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;

    // Job completion rates
    const completedThisMonth = thisMonthJobs.filter(job => job.status === 'completed').length;

    // Active projects
    const activeJobs = jobs.filter(job => ['in-progress', 'planning'].includes(job.status));
    const overdueJobs = activeJobs.filter(job => {
      const deadline = job.deadline ? new Date(job.deadline) : null;
      return deadline && deadline < now;
    });

    // Budget utilization
    const totalBudgeted = activeJobs.reduce((sum, job) => sum + (job.budget?.total || 0), 0);
    const totalSpent = activeJobs.reduce((sum, job) => sum + (job.budget?.spent || 0), 0);
    const budgetUtilization = totalBudgeted > 0 ? (totalSpent / totalBudgeted) * 100 : 0;

    // Team utilization
    const totalAssignments = assignments ? Object.keys(assignments).length : 0;
    const activeSubcontractors = subcontractors ? subcontractors.filter(sub => sub.isActive).length : 0;
    const teamUtilization = activeSubcontractors > 0 ? (totalAssignments / (activeSubcontractors * 7)) * 100 : 0;

    return {
      revenue: {
        current: thisMonthRevenue,
        previous: lastMonthRevenue,
        growth: revenueGrowth,
        trend: revenueGrowth >= 0 ? 'up' : 'down'
      },
      jobs: {
        active: activeJobs.length,
        completed: completedThisMonth,
        overdue: overdueJobs.length,
        total: jobs.length
      },
      budget: {
        total: totalBudgeted,
        spent: totalSpent,
        utilization: budgetUtilization,
        remaining: totalBudgeted - totalSpent
      },
      team: {
        totalSubcontractors: activeSubcontractors,
        utilization: teamUtilization,
        assignments: totalAssignments
      }
    };
  }, [jobs, assignments, subcontractors]);

  // Generate smart insights
  useEffect(() => {
    const generateInsights = () => {
      const newInsights = [];

      // Revenue insights
      if (businessMetrics.revenue.growth > 20) {
        newInsights.push({
          type: 'success',
          title: 'Strong Revenue Growth',
          message: `Revenue is up ${businessMetrics.revenue.growth.toFixed(1)}% this month. Consider expanding capacity.`,
          action: 'View Revenue Trends',
          priority: 'high'
        });
      } else if (businessMetrics.revenue.growth < -10) {
        newInsights.push({
          type: 'warning',
          title: 'Revenue Decline',
          message: `Revenue is down ${Math.abs(businessMetrics.revenue.growth).toFixed(1)}%. Review marketing strategies.`,
          action: 'Analyze Trends',
          priority: 'high'
        });
      }

      // Overdue jobs
      if (businessMetrics.jobs.overdue > 0) {
        newInsights.push({
          type: 'alert',
          title: 'Overdue Projects',
          message: `${businessMetrics.jobs.overdue} project${businessMetrics.jobs.overdue > 1 ? 's are' : ' is'} behind schedule.`,
          action: 'Review Projects',
          priority: 'urgent'
        });
      }

      // Budget utilization
      if (businessMetrics.budget.utilization > 90) {
        newInsights.push({
          type: 'warning',
          title: 'High Budget Utilization',
          message: `Projects are using ${businessMetrics.budget.utilization.toFixed(1)}% of budgets. Monitor for overruns.`,
          action: 'Review Budgets',
          priority: 'medium'
        });
      }

      // Team utilization
      if (businessMetrics.team.utilization < 60 && businessMetrics.team.totalSubcontractors > 0) {
        newInsights.push({
          type: 'info',
          title: 'Low Team Utilization',
          message: `Team is ${businessMetrics.team.utilization.toFixed(1)}% utilized. Consider taking on more work.`,
          action: 'Schedule More Work',
          priority: 'low'
        });
      }

      setInsights(newInsights.sort((a, b) => {
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }));
    };

    generateInsights();
  }, [businessMetrics]);

  // Get recent jobs for quick access
  const recentJobs = jobs
    .filter(job => ['in-progress', 'planning'].includes(job.status))
    .slice(0, 3);

  const MetricCard = ({ title, value, subtitle, trend, icon: Icon, color, onClick }) => (
    <ConstructionCard
      className="p-6 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color.bg}`}>
          <Icon className={`w-6 h-6 ${color.text}`} />
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
            {trend.direction === 'up' ? (
              <TrendingUp className="w-4 h-4" />
            ) : (
              <TrendingDown className="w-4 h-4" />
            )}
            {trend.value}
          </div>
        )}
      </div>

      <div>
        <h3 className={`text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
          }`}>
          {title}
        </h3>
        <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>
          {value}
        </p>
        {subtitle && (
          <p className={`text-sm mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-600'
            }`}>
            {subtitle}
          </p>
        )}
      </div>
    </ConstructionCard>
  );

  const InsightCard = ({ insight }) => {
    const colors = {
      success: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-800', icon: 'text-green-600' },
      warning: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-800', icon: 'text-orange-600' },
      alert: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-800', icon: 'text-red-600' },
      info: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-800', icon: 'text-blue-600' }
    };

    const icons = {
      success: CheckCircle,
      warning: AlertTriangle,
      alert: AlertTriangle,
      info: Zap
    };

    const color = colors[insight.type];
    const IconComponent = icons[insight.type];

    return (
      <div className={`p-4 rounded-lg border ${color.bg} ${color.border}`}>
        <div className="flex items-start gap-3">
          <IconComponent className={`w-5 h-5 mt-0.5 ${color.icon}`} />
          <div className="flex-1">
            <h4 className={`font-medium ${color.text}`}>{insight.title}</h4>
            <p className={`text-sm mt-1 ${color.text}`}>{insight.message}</p>
            {insight.action && (
              <button className={`text-sm font-medium mt-2 ${color.text} hover:underline`}>
                {insight.action} →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <ConstructionLoading text="Loading dashboard..." />;
  }

  return (
    <ConstructionPage
      title="Business Overview"
      subtitle="Your complete business snapshot and insights"
    >
      {/* Key Metrics */}
      <ConstructionGrid cols={4} className="mb-8">
        <MetricCard
          title="Monthly Revenue"
          value={`$${businessMetrics.revenue.current.toLocaleString()}`}
          subtitle="Total contract value"
          trend={{
            direction: businessMetrics.revenue.trend,
            value: `${Math.abs(businessMetrics.revenue.growth).toFixed(1)}%`
          }}
          icon={DollarSign}
          color={{ bg: 'bg-green-100', text: 'text-green-600' }}
          onClick={() => navigate('/jobs')}
        />

        <MetricCard
          title="Active Projects"
          value={businessMetrics.jobs.active}
          subtitle={`${businessMetrics.jobs.overdue} overdue`}
          icon={Activity}
          color={{ bg: 'bg-blue-100', text: 'text-blue-600' }}
          onClick={() => navigate('/jobs')}
        />

        <MetricCard
          title="Budget Utilization"
          value={`${businessMetrics.budget.utilization.toFixed(1)}%`}
          subtitle={`$${businessMetrics.budget.remaining.toLocaleString()} remaining`}
          icon={Target}
          color={{ bg: 'bg-purple-100', text: 'text-purple-600' }}
          onClick={() => navigate('/jobs')}
        />

        <MetricCard
          title="Team Utilization"
          value={`${businessMetrics.team.utilization.toFixed(1)}%`}
          subtitle={`${businessMetrics.team.totalSubcontractors} subcontractors`}
          icon={Users}
          color={{ bg: 'bg-orange-100', text: 'text-orange-600' }}
          onClick={() => navigate('/dashboard')}
        />
      </ConstructionGrid>

      {/* Smart Insights */}
      {insights.length > 0 && (
        <ConstructionSection title="Smart Insights" className="mb-8">
          <ConstructionCard className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Bell className={`w-5 h-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`} />
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Business Alerts
              </h3>
            </div>
            <ConstructionGrid cols={2}>
              {insights.map((insight, index) => (
                <InsightCard key={index} insight={insight} />
              ))}
            </ConstructionGrid>
          </ConstructionCard>
        </ConstructionSection>
      )}

      {/* Recent Active Projects */}
      {recentJobs.length > 0 && (
        <ConstructionSection title="Active Projects" className="mb-8">
          <ConstructionCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                Recent Projects
              </h3>
              <Link
                to="/jobs"
                className={`flex items-center gap-2 text-sm font-medium transition-colors ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                  }`}
              >
                View All <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <ConstructionGrid cols={3}>
              {recentJobs.map((job) => (
                <ConstructionCard
                  key={job.id}
                  className="p-4 cursor-pointer"
                  onClick={() => navigate(`/job/${job.id}`)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className={`font-medium line-clamp-1 ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        {job.name}
                      </h4>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        {job.client}
                      </p>
                    </div>

                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${job.status === 'planning'
                        ? 'bg-yellow-100 text-yellow-800'
                        : job.status === 'in-progress'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                      {job.status.replace('-', ' ')}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {job.address && (
                      <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        <MapPin className="w-4 h-4" />
                        <span className="line-clamp-1">{job.address}</span>
                      </div>
                    )}

                    {job.budget?.total && (
                      <div className={`flex items-center gap-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                        }`}>
                        <DollarSign className="w-4 h-4" />
                        <span>${job.budget.total.toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                </ConstructionCard>
              ))}
            </ConstructionGrid>
          </ConstructionCard>
        </ConstructionSection>
      )}

      {/* Quick Actions */}
      <ConstructionSection title="Quick Actions">
        <ConstructionCard className="p-6">
          <ConstructionGrid cols={4}>
            <ConstructionButton
              variant="orange"
              size="lg"
              onClick={() => navigate('/create')}
              className="flex items-center gap-3 justify-center"
            >
              <Plus className="w-5 h-5" />
              New Project
            </ConstructionButton>

            <ConstructionButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/jobs')}
              className="flex items-center gap-3 justify-center"
            >
              <HomeIcon className="w-5 h-5" />
              Manage Jobs
            </ConstructionButton>

            <ConstructionButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-3 justify-center"
            >
              <Calendar className="w-5 h-5" />
              Schedule Team
            </ConstructionButton>

            <ConstructionButton
              variant="secondary"
              size="lg"
              onClick={() => navigate('/inventory')}
              className="flex items-center gap-3 justify-center"
            >
              <Package className="w-5 h-5" />
              Check Inventory
            </ConstructionButton>
          </ConstructionGrid>
        </ConstructionCard>
      </ConstructionSection>
    </ConstructionPage>
  );
}