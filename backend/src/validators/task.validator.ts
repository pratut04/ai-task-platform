import { body, param, query } from 'express-validator';
import { TaskOperation, TaskStatus } from '../types';

export const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  body('inputText')
    .trim()
    .notEmpty().withMessage('Input text is required')
    .isLength({ max: 10000 }).withMessage('Input text cannot exceed 10000 characters'),
  body('operation')
    .notEmpty().withMessage('Operation is required')
    .isIn(Object.values(TaskOperation)).withMessage(
      `Operation must be one of: ${Object.values(TaskOperation).join(', ')}`
    ),
];

export const getTasksValidator = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
    .toInt(),
  query('status')
    .optional()
    .isIn(Object.values(TaskStatus)).withMessage(
      `Status must be one of: ${Object.values(TaskStatus).join(', ')}`
    ),
  query('operation')
    .optional()
    .isIn(Object.values(TaskOperation)).withMessage(
      `Operation must be one of: ${Object.values(TaskOperation).join(', ')}`
    ),
  query('search')
    .optional()
    .trim()
    .isLength({ max: 200 }).withMessage('Search query too long'),
];

export const taskIdValidator = [
  param('id')
    .notEmpty().withMessage('Task ID is required')
    .isMongoId().withMessage('Invalid task ID format'),
];
