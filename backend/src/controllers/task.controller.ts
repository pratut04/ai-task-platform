import { Response, NextFunction } from 'express';
import taskService from '../services/task.service';
import { AuthRequest, TaskOperation, TaskStatus } from '../types';
import { sendSuccess, sendCreated, sendNotFound } from '../utils/response';

export class TaskController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { title, inputText, operation } = req.body;
      const task = await taskService.create(
        { title, inputText, operation: operation as TaskOperation },
        req.user!._id.toString()
      );
      sendCreated(res, task, 'Task created successfully');
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as TaskStatus | undefined;
      const operation = req.query.operation as TaskOperation | undefined;
      const search = req.query.search as string | undefined;

      const result = await taskService.getAll(
        req.user!._id.toString(),
        { page, limit },
        { status, operation, search }
      );

      sendSuccess(
        res,
        result.data,
        'Tasks fetched successfully',
        200,
        {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }
      );
    } catch (error) {
      next(error);
    }
  }

  async getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.getById(req.params.id, req.user!._id.toString());
      sendSuccess(res, task, 'Task fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async runTask(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const task = await taskService.runTask(req.params.id, req.user!._id.toString());
      sendSuccess(res, task, 'Task queued for processing');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      await taskService.delete(req.params.id, req.user!._id.toString());
      sendSuccess(res, null, 'Task deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getStats(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const stats = await taskService.getStats(req.user!._id.toString());
      sendSuccess(res, stats, 'Stats fetched successfully');
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
