import mongoose, { Document, Schema } from 'mongoose';
import { TaskStatus, TaskOperation } from '../types';

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  inputText: string;
  operation: TaskOperation;
  result: string | null;
  logs: string[];
  status: TaskStatus;
  executionTime: number | null; // microseconds (µs) — use /1000 for ms, /1000000 for s
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    inputText: {
      type: String,
      required: [true, 'Input text is required'],
      trim: true,
      maxlength: [10000, 'Input text cannot exceed 10000 characters'],
    },
    operation: {
      type: String,
      enum: Object.values(TaskOperation),
      required: [true, 'Operation is required'],
    },
    result: {
      type: String,
      default: null,
    },
    logs: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: Object.values(TaskStatus),
      default: TaskStatus.PENDING,
    },
    executionTime: {
      type: Number,
      default: null,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'createdBy is required'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// Indexes for performance
TaskSchema.index({ createdBy: 1, createdAt: -1 });
TaskSchema.index({ status: 1 });
TaskSchema.index({ createdBy: 1, status: 1 });

const Task = mongoose.model<ITask>('Task', TaskSchema);
export default Task;
