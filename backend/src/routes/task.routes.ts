import { Router, RequestHandler } from 'express';
import taskController from '../controllers/task.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { validate } from '../middlewares/validation.middleware';
import {
  createTaskValidator,
  getTasksValidator,
  taskIdValidator,
} from '../validators/task.validator';

const router = Router();

// All task routes require authentication
router.use(authenticate);

/**
 * @route  POST /api/tasks
 * @access Protected
 */
router.post(
  '/',
  createTaskValidator,
  validate,
  taskController.create.bind(taskController) as RequestHandler
);

/**
 * @route  GET /api/tasks
 * @access Protected
 */
router.get(
  '/',
  getTasksValidator,
  validate,
  taskController.getAll.bind(taskController) as RequestHandler
);

/**
 * @route  GET /api/tasks/stats
 * @access Protected
 */
router.get(
  '/stats',
  taskController.getStats.bind(taskController) as RequestHandler
);

/**
 * @route  GET /api/tasks/:id
 * @access Protected
 */
router.get(
  '/:id',
  taskIdValidator,
  validate,
  taskController.getById.bind(taskController) as RequestHandler
);

/**
 * @route  POST /api/tasks/:id/run
 * @access Protected
 */
router.post(
  '/:id/run',
  taskIdValidator,
  validate,
  taskController.runTask.bind(taskController) as RequestHandler
);

/**
 * @route  DELETE /api/tasks/:id
 * @access Protected
 */
router.delete(
  '/:id',
  taskIdValidator,
  validate,
  taskController.delete.bind(taskController) as RequestHandler
);

export default router;
