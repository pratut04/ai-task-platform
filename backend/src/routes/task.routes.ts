import { Router } from 'express';
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
  (req, res, next) => taskController.create(req, res, next)
);

/**
 * @route  GET /api/tasks
 * @access Protected
 */
router.get(
  '/',
  getTasksValidator,
  validate,
  (req, res, next) => taskController.getAll(req, res, next)
);

/**
 * @route  GET /api/tasks/stats
 * @access Protected
 */
router.get(
  '/stats',
  (req, res, next) => taskController.getStats(req, res, next)
);

/**
 * @route  GET /api/tasks/:id
 * @access Protected
 */
router.get(
  '/:id',
  taskIdValidator,
  validate,
  (req, res, next) => taskController.getById(req, res, next)
);

/**
 * @route  POST /api/tasks/:id/run
 * @access Protected
 */
router.post(
  '/:id/run',
  taskIdValidator,
  validate,
  (req, res, next) => taskController.runTask(req, res, next)
);

/**
 * @route  DELETE /api/tasks/:id
 * @access Protected
 */
router.delete(
  '/:id',
  taskIdValidator,
  validate,
  (req, res, next) => taskController.delete(req, res, next)
);

export default router;
