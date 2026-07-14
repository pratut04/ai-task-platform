import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Map service error codes to HTTP responses
const errorMap: Record<string, { statusCode: number; message: string }> = {
  EMAIL_ALREADY_EXISTS: { statusCode: 409, message: 'Email already exists' },
  INVALID_CREDENTIALS: { statusCode: 401, message: 'Invalid email or password' },
  USER_NOT_FOUND: { statusCode: 404, message: 'User not found' },
  INVALID_ACCESS_TOKEN: { statusCode: 401, message: 'Invalid or expired token' },
  INVALID_REFRESH_TOKEN: { statusCode: 401, message: 'Invalid or expired refresh token' },
  TASK_NOT_FOUND: { statusCode: 404, message: 'Task not found' },
  TASK_ALREADY_RUNNING: { statusCode: 400, message: 'Task is already running' },
  TASK_UPDATE_FAILED: { statusCode: 500, message: 'Failed to update task' },
  QUEUE_UNAVAILABLE: { statusCode: 503, message: 'Queue service unavailable — Redis is not running. Start Redis and try again.' },
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  logger.error(`${req.method} ${req.path} - Error:`, {
    message: err.message,
    stack: err.stack,
  });

  // Check for known error codes
  if (err.message in errorMap) {
    const { statusCode, message } = errorMap[err.message];
    res.status(statusCode).json({
      success: false,
      message,
    });
    return;
  }

  // AppError (operational)
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    res.status(400).json({
      success: false,
      message: 'Validation error',
      error: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    });
    return;
  }

  // Mongoose CastError (invalid ObjectId)
  if (err.name === 'CastError') {
    res.status(400).json({
      success: false,
      message: 'Invalid ID format',
    });
    return;
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token',
    });
    return;
  }

  // Generic server error
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { error: err.message }),
  });
};

export const notFoundHandler = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.path} not found`,
  });
};
