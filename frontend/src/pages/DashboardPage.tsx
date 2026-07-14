import React from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard,
  Clock,
  Loader2,
  CheckCircle2,
  XCircle,
  TrendingUp,
  PlusCircle,
  ArrowRight,
  Timer,
} from 'lucide-react';
import { tasksApi } from '@/api/tasks.api';
import { useAuthStore } from '@/store/auth.store';
import StatusBadge from '@/components/ui/StatusBadge';
import { StatCardSkeleton, TaskCardSkeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Link, useNavigate } from 'react-router-dom';
import { Task, TaskStats } from '@/types';

// executionTime is stored in MICROSECONDS (µs)
const formatExecTime = (us: number): string => {
  if (us >= 1_000_000) return `${(us / 1_000_000).toFixed(2)}s`;
  if (us >= 1_000)     return `${(us / 1_000).toFixed(2)}ms`;
  return `${us.toFixed(1)}µs`;
};

const statCards = (stats: TaskStats) => [
  {
    label: 'Total Tasks',
    value: (stats.pending + stats.running + stats.success + stats.failed).toString(),
    icon: LayoutDashboard,
    color: 'from-primary-500 to-primary-700',
    glow: 'shadow-glow',
    change: '+12%',
  },
  {
    label: 'Pending',
    value: stats.pending.toString(),
    icon: Clock,
    color: 'from-amber-500 to-amber-700',
    glow: '',
    change: null,
  },
  {
    label: 'Running',
    value: stats.running.toString(),
    icon: Loader2,
    color: 'from-blue-500 to-blue-700',
    glow: '',
    change: null,
    iconClass: 'animate-spin',
  },
  {
    label: 'Success',
    value: stats.success.toString(),
    icon: CheckCircle2,
    color: 'from-emerald-500 to-emerald-700',
    glow: '',
    change: null,
  },
  {
    label: 'Failed',
    value: stats.failed.toString(),
    icon: XCircle,
    color: 'from-red-500 to-red-700',
    glow: '',
    change: null,
  },
  {
    label: 'Avg Exec Time',
    value: stats.executedCount > 0 ? formatExecTime(stats.avgExecutionTime) : '—',
    icon: Timer,
    color: 'from-purple-500 to-purple-700',
    glow: '',
    change: stats.executedCount > 0 ? `${stats.executedCount} tasks` : null,
    subLabel: stats.executedCount > 0 ? `Total: ${formatExecTime(stats.totalExecutionTime)}` : null,
  },
];

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  // Stats query
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['task-stats'],
    queryFn: tasksApi.getStats,
    refetchInterval: 5000, // Live updates every 5 seconds
  });

  // Recent tasks query
  const { data: recentTasksData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', { page: 1, limit: 6 }],
    queryFn: () => tasksApi.getAll({ page: 1, limit: 6 }),
    refetchInterval: 5000,
  });

  const recentTasks = recentTasksData?.data || [];

  const containerVariants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.1 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            Good day, <span className="text-gradient">{user?.name?.split(' ')[0] || 'User'}</span>!
          </h2>
          <p className="text-white/40 mt-1">Here's an overview of your task processing activity</p>
        </div>
        <Button
          leftIcon={<PlusCircle className="w-4 h-4" />}
          onClick={() => navigate('/tasks/new')}
        >
          New Task
        </Button>
      </div>

      {/* Stats Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4"
      >
        {statsLoading || !stats
          ? Array.from({ length: 5 }).map((_, i) => (
              <motion.div key={i} variants={itemVariants}>
                <StatCardSkeleton />
              </motion.div>
            ))
          : statCards(stats).map((card) => (
              <motion.div key={card.label} variants={itemVariants}>
                <div className="stat-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-xs text-white/40 font-medium uppercase tracking-wide">
                        {card.label}
                      </p>
                      <p className="text-2xl font-extrabold text-white mt-1 truncate" title={card.value}>{card.value}</p>
                      {'subLabel' in card && card.subLabel && (
                        <p className="text-xs text-white/30 mt-0.5">{card.subLabel}</p>
                      )}
                    </div>
                    <div
                      className={`w-10 h-10 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center ${card.glow} shrink-0`}
                    >
                      <card.icon
                        className={`w-5 h-5 text-white ${'iconClass' in card ? card.iconClass : ''}`}
                      />
                    </div>
                  </div>
                  {card.change && (
                    <div className="flex items-center gap-1 text-emerald-400">
                      <TrendingUp className="w-3 h-3" />
                      <span className="text-xs font-medium">{card.change}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
      </motion.div>

      {/* Recent Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">Recent Tasks</h3>
          <Link
            to="/tasks"
            className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300 transition-colors"
          >
            View all
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {tasksLoading ? (
          <div className="grid md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <TaskCardSkeleton key={i} />
            ))}
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <LayoutDashboard className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <h4 className="text-white/50 font-medium">No tasks yet</h4>
            <p className="text-white/30 text-sm mt-1">Create your first task to get started</p>
            <Button
              className="mt-4"
              leftIcon={<PlusCircle className="w-4 h-4" />}
              onClick={() => navigate('/tasks/new')}
            >
              Create Task
            </Button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {recentTasks.map((task: Task) => (
              <TaskCard key={task._id} task={task} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const TaskCard: React.FC<{ task: Task }> = ({ task }) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover p-5 cursor-pointer"
      onClick={() => navigate(`/tasks/${task._id}`)}
    >
      <div className="flex items-start justify-between mb-3">
        <h4 className="font-semibold text-white truncate pr-4">{task.title}</h4>
        <StatusBadge status={task.status} />
      </div>
      <p className="text-sm text-white/40 truncate mb-3">{task.inputText}</p>
      <div className="flex items-center justify-between text-xs text-white/30">
        <span className="capitalize bg-surface-700 px-2 py-1 rounded-lg">
          {task.operation.replace('_', ' ')}
        </span>
        <div className="flex items-center gap-2">
          {task.executionTime != null && (
            <span className="flex items-center gap-1 text-purple-400/70">
              <Timer className="w-3 h-3" />
              {formatExecTime(task.executionTime)}
            </span>
          )}
          <span>{new Date(task.createdAt).toLocaleDateString()}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default DashboardPage;
