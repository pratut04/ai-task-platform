import { Request } from 'express';
import { IUser } from '../models/User.model';

// Extended Express Request with authenticated user
export interface AuthRequest extends Request {
  user?: IUser;
}

// JWT Payload
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// Task status enum
export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
}

// Task operation enum
export enum TaskOperation {
  UPPERCASE = 'uppercase',
  LOWERCASE = 'lowercase',
  REVERSE = 'reverse',
  WORD_COUNT = 'word_count',
}

// User role enum
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

// Pagination options
export interface PaginationOptions {
  page: number;
  limit: number;
}

// Pagination result
export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Queue job data
export interface TaskJobData {
  taskId: string;
  operation: TaskOperation;
  inputText: string;
}
