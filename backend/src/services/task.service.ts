import taskRepository, { CreateTaskData, TaskFilter } from '../repositories/task.repository';
import { ITask } from '../models/Task.model';
import { TaskStatus, TaskOperation, PaginationOptions, PaginationResult } from '../types';
import taskQueueService from '../queue/task.queue';
import logger from '../utils/logger';

export interface CreateTaskDto {
  title: string;
  inputText: string;
  operation: TaskOperation;
}

export class TaskService {
  async create(dto: CreateTaskDto, userId: string): Promise<ITask> {
    const data: CreateTaskData = {
      ...dto,
      createdBy: userId,
    };

    const task = await taskRepository.create(data);
    logger.info(`Task created: ${task._id} by user: ${userId}`);
    return task;
  }

  async getAll(
    userId: string,
    options: PaginationOptions,
    filters: TaskFilter = {}
  ): Promise<PaginationResult<ITask>> {
    return taskRepository.findAllByUser(userId, options, filters);
  }

  async getById(id: string, userId: string): Promise<ITask> {
    const task = await taskRepository.findByIdAndUser(id, userId);
    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }
    return task;
  }

  async runTask(id: string, userId: string): Promise<ITask> {
    const task = await taskRepository.findByIdAndUser(id, userId);
    if (!task) {
      throw new Error('TASK_NOT_FOUND');
    }

    if (task.status === TaskStatus.RUNNING) {
      throw new Error('TASK_ALREADY_RUNNING');
    }

    // Update status to running immediately so UI shows "Processing..."
    const updatedTask = await taskRepository.updateStatus(id, TaskStatus.RUNNING);
    if (!updatedTask) {
      throw new Error('TASK_UPDATE_FAILED');
    }

    // Push to Redis queue
    const enqueued = await taskQueueService.enqueue({
      taskId: id,
      operation: task.operation,
      inputText: task.inputText,
    });

    if (!enqueued) {
      // Rollback: set status back to failed so user knows something went wrong
      await taskRepository.updateStatus(id, TaskStatus.FAILED);
      throw new Error('QUEUE_UNAVAILABLE');
    }

    logger.info(`Task queued: ${id} operation: ${task.operation}`);
    return updatedTask;
  }

  async delete(id: string, userId: string): Promise<void> {
    const deleted = await taskRepository.deleteByIdAndUser(id, userId);
    if (!deleted) {
      throw new Error('TASK_NOT_FOUND');
    }
    logger.info(`Task deleted: ${id} by user: ${userId}`);
  }

  async getStats(userId: string): Promise<Record<TaskStatus, number> & { totalExecutionTime: number; avgExecutionTime: number; executedCount: number }> {
    return taskRepository.getStatsByUser(userId);
  }
}

export default new TaskService();
