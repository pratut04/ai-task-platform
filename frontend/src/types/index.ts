// ── Auth Types ────────────────────────────────────────────────────────────
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  user: User;
  tokens: AuthTokens;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// ── Task Types ────────────────────────────────────────────────────────────
export type TaskStatus = 'pending' | 'running' | 'success' | 'failed';
export type TaskOperation = 'uppercase' | 'lowercase' | 'reverse' | 'word_count';

export interface Task {
  _id: string;
  title: string;
  inputText: string;
  operation: TaskOperation;
  result: string | null;
  logs: string[];
  status: TaskStatus;
  executionTime: number | null;
  createdBy: string | User;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  pending: number;
  running: number;
  success: number;
  failed: number;
  totalExecutionTime: number;   // milliseconds, sum across all executed tasks
  avgExecutionTime: number;     // milliseconds, average across all executed tasks
  executedCount: number;        // number of tasks that have a recorded execution time
}

export interface CreateTaskFormData {
  title: string;
  inputText: string;
  operation: TaskOperation;
}

// ── API Types ─────────────────────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: PaginationMeta;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ── Filter Types ──────────────────────────────────────────────────────────
export interface TaskFilters {
  status?: TaskStatus;
  operation?: TaskOperation;
  search?: string;
  page?: number;
  limit?: number;
}
