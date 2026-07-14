import React from 'react';
import { motion } from 'framer-motion';
import { TaskStatus } from '@/types';
import { Clock, Loader2, CheckCircle2, XCircle } from 'lucide-react';

interface StatusBadgeProps {
  status: TaskStatus;
  showIcon?: boolean;
  size?: 'sm' | 'md';
}

const statusConfig: Record<TaskStatus, {
  className: string;
  label: string;
  icon: React.ReactNode;
}> = {
  pending: {
    className: 'badge-pending',
    label: 'Pending',
    icon: <Clock className="w-3 h-3" />,
  },
  running: {
    className: 'badge-running',
    label: 'Running',
    icon: <Loader2 className="w-3 h-3 animate-spin" />,
  },
  success: {
    className: 'badge-success',
    label: 'Success',
    icon: <CheckCircle2 className="w-3 h-3" />,
  },
  failed: {
    className: 'badge-failed',
    label: 'Failed',
    icon: <XCircle className="w-3 h-3" />,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  showIcon = true,
  size = 'md',
}) => {
  const config = statusConfig[status];

  return (
    <motion.span
      initial={{ scale: 0.9, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`${config.className} ${size === 'sm' ? 'text-[10px] px-2 py-0.5' : ''}`}
    >
      {showIcon && config.icon}
      {config.label}
    </motion.span>
  );
};

export default StatusBadge;
