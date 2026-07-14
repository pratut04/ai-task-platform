import mongoose from 'mongoose';
import Task, { ITask } from '../models/Task.model';
import { TaskStatus, TaskOperation, PaginationOptions, PaginationResult } from '../types';

export interface CreateTaskData {
  title: string;
  inputText: string;
  operation: TaskOperation;
  createdBy: string;
}

export interface TaskFilter {
  status?: TaskStatus;
  operation?: TaskOperation;
  search?: string;
}

export class TaskRepository {
  async create(data: CreateTaskData): Promise<ITask> {
    const task = new Task(data);
    return task.save();
  }

  async findById(id: string): Promise<ITask | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Task.findById(id).populate('createdBy', 'name email').exec();
  }

  async findByIdAndUser(id: string, userId: string): Promise<ITask | null> {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return Task.findOne({ _id: id, createdBy: userId }).exec();
  }

  async findAllByUser(
    userId: string,
    options: PaginationOptions,
    filters: TaskFilter = {}
  ): Promise<PaginationResult<ITask>> {
    const { page, limit } = options;
    const skip = (page - 1) * limit;

    const query: mongoose.FilterQuery<ITask> = { createdBy: userId };

    if (filters.status) query.status = filters.status;
    if (filters.operation) query.operation = filters.operation;
    if (filters.search) {
      query.$or = [
        { title: { $regex: filters.search, $options: 'i' } },
        { inputText: { $regex: filters.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Task.find(query).skip(skip).limit(limit).sort({ createdAt: -1 }).exec(),
      Task.countDocuments(query).exec(),
    ]);

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async updateStatus(id: string, status: TaskStatus): Promise<ITask | null> {
    return Task.findByIdAndUpdate(
      id,
      { status, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  async updateResult(
    id: string,
    data: { result: string; logs: string[]; executionTime: number; status: TaskStatus }
  ): Promise<ITask | null> {
    return Task.findByIdAndUpdate(
      id,
      { ...data, updatedAt: new Date() },
      { new: true }
    ).exec();
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const result = await Task.findOneAndDelete({ _id: id, createdBy: userId }).exec();
    return result !== null;
  }

  async getStatsByUser(userId: string): Promise<Record<TaskStatus, number> & { totalExecutionTime: number; avgExecutionTime: number; executedCount: number }> {
    const [statusStats, execStats] = await Promise.all([
      Task.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),
      Task.aggregate([
        {
          $match: {
            createdBy: new mongoose.Types.ObjectId(userId),
            executionTime: { $ne: null, $gt: 0 },
          },
        },
        {
          $group: {
            _id: null,
            totalExecutionTime: { $sum: '$executionTime' },
            avgExecutionTime: { $avg: '$executionTime' },
            executedCount: { $sum: 1 },
          },
        },
      ]),
    ]);

    const result: Record<string, number> = {
      [TaskStatus.PENDING]: 0,
      [TaskStatus.RUNNING]: 0,
      [TaskStatus.SUCCESS]: 0,
      [TaskStatus.FAILED]: 0,
      totalExecutionTime: 0,
      avgExecutionTime: 0,
      executedCount: 0,
    };

    for (const stat of statusStats) {
      result[stat._id] = stat.count;
    }

    if (execStats.length > 0) {
      result.totalExecutionTime = Math.round(execStats[0].totalExecutionTime);
      result.avgExecutionTime = Math.round(execStats[0].avgExecutionTime);
      result.executedCount = execStats[0].executedCount;
    }

    return result as Record<TaskStatus, number> & { totalExecutionTime: number; avgExecutionTime: number; executedCount: number };
  }
}

export default new TaskRepository();
