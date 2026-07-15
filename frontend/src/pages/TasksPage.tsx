import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { tasksApi } from '@/api/tasks.api';
import StatusBadge from '@/components/ui/StatusBadge';
import { TableSkeleton } from '@/components/ui/Skeleton';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import { Task, TaskFilters, TaskOperation, TaskStatus } from '@/types';
import {
  PlusCircle,
  Search,
  Trash2,
  Eye,
  Play,
  List,
  Timer,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<TaskFilters>({ page: 1, limit: 10 });
  const [searchInput, setSearchInput] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', filters],
    queryFn: () => tasksApi.getAll(filters),
    refetchInterval: 5000,
  });

  const runMutation = useMutation({
    mutationFn: tasksApi.run,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success('Task queued for processing!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: tasksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      setDeleteConfirm(null);
      toast.success('Task deleted');
    },
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters((f) => ({ ...f, search: searchInput, page: 1 }));
  };

  const tasks = data?.data || [];
  const meta = data?.meta;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <List className="w-5 h-5 text-primary-400" />
            All Tasks
          </h2>
          <p className="text-white/40 text-sm mt-0.5">{meta?.total || 0} total tasks</p>
        </div>
        <Button leftIcon={<PlusCircle className="w-4 h-4" />} onClick={() => navigate('/tasks/new')}>
          New Task
        </Button>
      </div>

      {/* Filters Bar */}
      <div className="glass-card p-4 flex flex-wrap items-center gap-3">
        {/* Search */}
        <form onSubmit={handleSearch} className="flex-1 min-w-48">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="input-field pl-9 py-2 text-sm"
            />
          </div>
        </form>

        {/* Status Filter */}
        <select
          value={filters.status || ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              status: e.target.value ? (e.target.value as TaskStatus) : undefined,
              page: 1,
            }))
          }
          className="input-field py-2 text-sm w-36"
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="running">Running</option>
          <option value="success">Success</option>
          <option value="failed">Failed</option>
        </select>

        {/* Operation Filter */}
        <select
          value={filters.operation || ''}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              operation: e.target.value ? (e.target.value as TaskOperation) : undefined,
              page: 1,
            }))
          }
          className="input-field py-2 text-sm w-40"
        >
          <option value="">All Operations</option>
          <option value="uppercase">Uppercase</option>
          <option value="lowercase">Lowercase</option>
          <option value="reverse">Reverse</option>
          <option value="word_count">Word Count</option>
        </select>
      </div>

      {/* Tasks Table */}
      <div className="glass-card overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-[1fr_auto_auto_auto_auto_auto] gap-4 px-6 py-3 border-b border-white/10 text-xs text-white/40 uppercase tracking-wide font-medium">
          <span>Task</span>
          <span className="text-center">Operation</span>
          <span className="text-center">Status</span>
          <span className="text-center">Exec Time</span>
          <span className="text-center">Created</span>
          <span className="text-center">Actions</span>
        </div>

        {isLoading ? (
          <div className="p-4">
            <TableSkeleton rows={5} />
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-16">
            <List className="w-10 h-10 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">No tasks found</p>
            <p className="text-white/25 text-sm mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {tasks.map((task: Task) => (
              <TaskRow
                key={task._id}
                task={task}
                onView={() => navigate(`/tasks/${task._id}`)}
                onRun={() => runMutation.mutate(task._id)}
                onDelete={() => setDeleteConfirm(task._id)}
                isRunning={runMutation.isPending}
                isDeleting={deleteMutation.isPending && deleteConfirm === task._id}
                confirmDelete={deleteConfirm === task._id}
                onCancelDelete={() => setDeleteConfirm(null)}
                onConfirmDelete={() => deleteMutation.mutate(task._id)}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 border-t border-white/10">
            <Pagination
              currentPage={filters.page || 1}
              totalPages={meta.totalPages}
              total={meta.total}
              limit={filters.limit || 10}
              onPageChange={(page) => setFilters((f) => ({ ...f, page }))}
            />
          </div>
        )}
      </div>
    </div>
  );
};

interface TaskRowProps {
  task: Task;
  onView: () => void;
  onRun: () => void;
  onDelete: () => void;
  isRunning: boolean;
  isDeleting: boolean;
  confirmDelete: boolean;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
}

// executionTime is stored in MICROSECONDS (µs)
const formatExecTime = (us: number): string => {
  if (us >= 1_000_000) return `${(us / 1_000_000).toFixed(2)}s`;
  if (us >= 1_000)     return `${(us / 1_000).toFixed(2)}ms`;
  return `${us.toFixed(1)}µs`;
};

const TaskRow: React.FC<TaskRowProps> = ({
  task, onView, onRun, onDelete, isRunning, isDeleting, confirmDelete, onCancelDelete, onConfirmDelete,
}) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto_auto_auto] gap-3 md:gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors items-center"
  >
    {/* Task Info */}
    <div className="min-w-0">
      <p className="font-medium text-white truncate">{task.title}</p>
      <p className="text-xs text-white/30 truncate mt-0.5">{task.inputText}</p>
    </div>

    {/* Operation */}
    <span className="text-xs bg-surface-700 text-white/60 px-2.5 py-1 rounded-lg capitalize text-center">
      {task.operation.replace('_', ' ')}
    </span>

    {/* Status */}
    <div className="flex justify-center">
      <StatusBadge status={task.status} size="sm" />
    </div>

    {/* Exec Time */}
    <div className="flex justify-center">
      {task.executionTime != null ? (
        <span className="flex items-center gap-1 text-xs text-purple-400 bg-purple-500/10 px-2 py-1 rounded-lg">
          <Timer className="w-3 h-3" />
          {formatExecTime(task.executionTime)}
        </span>
      ) : (
        <span className="text-xs text-white/20">—</span>
      )}
    </div>

    {/* Date */}
    <span className="text-xs text-white/30 text-center whitespace-nowrap">
      {new Date(task.createdAt).toLocaleDateString()}
    </span>

    {/* Actions */}
    <div className="flex items-center justify-center gap-1">
      {confirmDelete ? (
        <div className="flex items-center gap-1">
          <button
            onClick={onConfirmDelete}
            disabled={isDeleting}
            className="text-xs px-2 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-all"
          >
            Confirm
          </button>
          <button
            onClick={onCancelDelete}
            className="text-xs px-2 py-1 bg-surface-700 text-white/50 rounded-lg hover:bg-surface-600 transition-all"
          >
            Cancel
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={onView}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all"
            title="View details"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={onRun}
            disabled={isRunning || task.status === 'running'}
            className="p-1.5 text-primary-400 hover:text-primary-300 hover:bg-primary-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Run task"
          >
            <Play className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            disabled={task.status === 'running'}
            className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            title="Delete task"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}
    </div>
  </motion.div>
);

export default TasksPage;
