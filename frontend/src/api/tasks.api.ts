import api from './axios';
import { ApiResponse, Task, TaskStats, CreateTaskFormData, TaskFilters, PaginationMeta } from '@/types';

export interface TaskListResponse {
  data: Task[];
  meta: PaginationMeta;
}

export const tasksApi = {
  create: async (data: CreateTaskFormData): Promise<Task> => {
    const response = await api.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data!;
  },

  getAll: async (filters?: TaskFilters): Promise<TaskListResponse> => {
    const params = new URLSearchParams();
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    if (filters?.status) params.set('status', filters.status);
    if (filters?.operation) params.set('operation', filters.operation);
    if (filters?.search) params.set('search', filters.search);

    const response = await api.get<ApiResponse<Task[]>>(`/tasks?${params.toString()}`);
    return {
      data: response.data.data || [],
      meta: response.data.meta || { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  },

  getById: async (id: string): Promise<Task> => {
    const response = await api.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data!;
  },

  run: async (id: string): Promise<Task> => {
    const response = await api.post<ApiResponse<Task>>(`/tasks/${id}/run`);
    return response.data.data!;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  getStats: async (): Promise<TaskStats> => {
    const response = await api.get<ApiResponse<TaskStats>>('/tasks/stats');
    return response.data.data!;
  },
};
