import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { tasksApi } from '@/api/tasks.api';
import StatusBadge from '@/components/ui/StatusBadge';
import { Skeleton } from '@/components/ui/Skeleton';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import {
  ArrowLeft,
  Play,
  Trash2,
  Clock,
  Zap,
  FileText,
  Terminal,
  Timer,
  CheckCircle2,
} from 'lucide-react';
import toast from 'react-hot-toast';

const TaskDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getById(id!),
    enabled: !!id,
    // Auto-refresh if task is pending or running
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === 'pending' || status === 'running' ? 2000 : false;
    },
  });

  const runMutation = useMutation({
    mutationFn: () => tasksApi.run(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['task', id] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success('Task queued for processing!');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => tasksApi.delete(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      toast.success('Task deleted');
      navigate('/tasks');
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48 rounded-xl" />
        <div className="glass-card p-8 space-y-6">
          <Skeleton className="h-7 w-64 rounded" />
          <Skeleton className="h-4 w-full rounded" />
          <Skeleton className="h-4 w-3/4 rounded" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!task) {
    return (
      <div className="text-center py-20">
        <p className="text-white/40 text-lg">Task not found</p>
        <Button className="mt-4" onClick={() => navigate('/tasks')}>
          Back to Tasks
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate('/tasks')}
        className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Tasks
      </button>

      {/* Main Card */}
      <Card animate={false}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-white">{task.title}</h2>
              <p className="text-white/40 text-sm mt-1">
                Created {new Date(task.createdAt).toLocaleString()}
              </p>
            </div>
            <StatusBadge status={task.status} />
          </div>
        </CardHeader>

        <CardBody className="space-y-6">
          {/* Metadata Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetaItem
              icon={<Zap className="w-4 h-4 text-amber-400" />}
              label="Operation"
              value={task.operation.replace('_', ' ')}
            />
            <MetaItem
              icon={<Clock className="w-4 h-4 text-blue-400" />}
              label="Status"
              value={task.status}
            />
            <MetaItem
              icon={<Timer className="w-4 h-4 text-purple-400" />}
              label="Exec Time"
              value={task.executionTime != null
                ? task.executionTime >= 1_000_000
                  ? `${(task.executionTime / 1_000_000).toFixed(2)}s`
                  : task.executionTime >= 1_000
                    ? `${(task.executionTime / 1_000).toFixed(2)}ms`
                    : `${task.executionTime.toFixed(1)}µs`
                : '—'}
            />
            <MetaItem
              icon={<FileText className="w-4 h-4 text-emerald-400" />}
              label="Input Length"
              value={`${task.inputText.length} chars`}
            />
          </div>

          {/* Input Text */}
          <div>
            <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Input Text
            </h4>
            <pre className="bg-surface-700/50 border border-white/10 rounded-xl p-4 text-sm text-white/80 font-mono whitespace-pre-wrap break-words">
              {task.inputText}
            </pre>
          </div>

          {/* Result */}
          {task.result !== null && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Result
              </h4>
              <pre className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4 text-sm text-emerald-300 font-mono whitespace-pre-wrap break-words">
                {task.result}
              </pre>
            </motion.div>
          )}

          {/* Logs */}
          {task.logs && task.logs.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3 flex items-center gap-2">
                <Terminal className="w-4 h-4" />
                Execution Logs
              </h4>
              <div className="bg-surface-900 border border-white/10 rounded-xl p-4 space-y-1 font-mono text-xs max-h-48 overflow-y-auto">
                {task.logs.map((log, i) => (
                  <p key={i} className="text-white/50">
                    <span className="text-primary-500/60 mr-2">[{i + 1}]</span>
                    {log}
                  </p>
                ))}
              </div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          variant="danger"
          leftIcon={<Trash2 className="w-4 h-4" />}
          isLoading={deleteMutation.isPending}
          onClick={() => deleteMutation.mutate()}
          disabled={task.status === 'running'}
        >
          Delete
        </Button>
        <Button
          leftIcon={<Play className="w-4 h-4" />}
          isLoading={runMutation.isPending}
          onClick={() => runMutation.mutate()}
          disabled={task.status === 'running'}
        >
          {task.status === 'running' ? 'Processing...' : 'Run Task'}
        </Button>
      </div>
    </div>
  );
};

const MetaItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon, label, value,
}) => (
  <div className="bg-surface-700/40 rounded-xl p-3">
    <div className="flex items-center gap-1.5 mb-1.5">{icon}<span className="text-xs text-white/40">{label}</span></div>
    <p className="text-sm font-semibold text-white capitalize">{value}</p>
  </div>
);

export default TaskDetailPage;
