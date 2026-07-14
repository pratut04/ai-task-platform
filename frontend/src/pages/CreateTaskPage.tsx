import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tasksApi } from '@/api/tasks.api';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardBody, CardFooter } from '@/components/ui/Card';
import { PlusCircle, Type, FileText, Zap, ArrowLeft, Hash } from 'lucide-react';
import toast from 'react-hot-toast';

const createTaskSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  inputText: z.string().min(1, 'Input text is required').max(10000),
  operation: z.enum(['uppercase', 'lowercase', 'reverse', 'word_count']),
});

type CreateTaskFormValues = z.infer<typeof createTaskSchema>;

const operations = [
  {
    value: 'uppercase' as const,
    label: 'Uppercase',
    description: 'Convert text to UPPERCASE',
    icon: Type,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/30',
    selected: 'bg-blue-500/20 border-blue-500',
  },
  {
    value: 'lowercase' as const,
    label: 'Lowercase',
    description: 'Convert text to lowercase',
    icon: Type,
    color: 'text-purple-400',
    bg: 'bg-purple-500/10 border-purple-500/30',
    selected: 'bg-purple-500/20 border-purple-500',
  },
  {
    value: 'reverse' as const,
    label: 'Reverse',
    description: 'Reverse the text string',
    icon: Zap,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/30',
    selected: 'bg-amber-500/20 border-amber-500',
  },
  {
    value: 'word_count' as const,
    label: 'Word Count',
    description: 'Count words in the text',
    icon: Hash,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/30',
    selected: 'bg-emerald-500/20 border-emerald-500',
  },
];

const CreateTaskPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateTaskFormValues>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: { operation: 'uppercase' },
  });

  const selectedOp = watch('operation');

  const mutation = useMutation({
    mutationFn: tasksApi.create,
    onSuccess: (task) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['task-stats'] });
      toast.success('Task created successfully!');
      navigate(`/tasks/${task._id}`);
    },
  });

  const onSubmit = (data: CreateTaskFormValues) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </button>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-primary rounded-xl flex items-center justify-center shadow-glow">
              <PlusCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create New Task</h2>
              <p className="text-white/40 text-sm">Define your task and select an operation</p>
            </div>
          </div>
        </CardHeader>

        <CardBody>
          <form id="create-task-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-white/70 mb-2">
                Task Title
              </label>
              <input
                id="task-title"
                type="text"
                placeholder="e.g. Process customer feedback"
                className={`input-field ${errors.title ? 'input-error' : ''}`}
                {...register('title')}
              />
              {errors.title && (
                <p className="mt-1.5 text-sm text-red-400">{errors.title.message}</p>
              )}
            </div>

            {/* Input Text */}
            <div>
              <label htmlFor="task-input" className="block text-sm font-medium text-white/70 mb-2">
                <span className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Input Text
                </span>
              </label>
              <textarea
                id="task-input"
                rows={6}
                placeholder="Enter the text you want to process..."
                className={`input-field resize-none font-mono text-sm ${errors.inputText ? 'input-error' : ''}`}
                {...register('inputText')}
              />
              <div className="flex items-center justify-between mt-1">
                {errors.inputText ? (
                  <p className="text-sm text-red-400">{errors.inputText.message}</p>
                ) : (
                  <span />
                )}
                <p className="text-xs text-white/30 ml-auto">
                  {watch('inputText')?.length || 0}/10000
                </p>
              </div>
            </div>

            {/* Operation Selection */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-3">
                <span className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Select Operation
                </span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                {operations.map((op) => (
                  <motion.button
                    key={op.value}
                    type="button"
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setValue('operation', op.value)}
                    className={`p-4 rounded-xl border text-left transition-all duration-200 ${
                      selectedOp === op.value ? op.selected : op.bg
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <op.icon className={`w-4 h-4 ${op.color}`} />
                      <span className="font-semibold text-white text-sm">{op.label}</span>
                    </div>
                    <p className="text-xs text-white/40">{op.description}</p>
                  </motion.button>
                ))}
              </div>
              {errors.operation && (
                <p className="mt-2 text-sm text-red-400">{errors.operation.message}</p>
              )}
            </div>
          </form>
        </CardBody>

        <CardFooter>
          <div className="flex items-center justify-end gap-3 w-full">
            <Button variant="secondary" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button
              form="create-task-form"
              type="submit"
              isLoading={mutation.isPending}
              leftIcon={<PlusCircle className="w-4 h-4" />}
            >
              Create Task
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default CreateTaskPage;
