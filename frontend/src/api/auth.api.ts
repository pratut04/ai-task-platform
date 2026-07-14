import api from './axios';
import { ApiResponse, AuthResult, User } from '@/types';

export const authApi = {
  register: async (data: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthResult> => {
    const response = await api.post<ApiResponse<AuthResult>>('/auth/register', data);
    return response.data.data!;
  },

  login: async (data: { email: string; password: string }): Promise<AuthResult> => {
    const response = await api.post<ApiResponse<AuthResult>>('/auth/login', data);
    return response.data.data!;
  },

  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
  },

  getProfile: async (): Promise<User> => {
    const response = await api.get<ApiResponse<User>>('/auth/profile');
    return response.data.data!;
  },

  refresh: async (refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> => {
    const response = await api.post<ApiResponse<{ accessToken: string; refreshToken: string }>>(
      '/auth/refresh',
      { refreshToken }
    );
    return response.data.data!;
  },
};
