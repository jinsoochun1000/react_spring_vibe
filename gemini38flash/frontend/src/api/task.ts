import { apiClient } from './client';
import {
  ApiResponse,
  PageResponse,
  Task,
  TaskFilterParams,
  TaskFormData,
  TaskStats,
  TaskStatus
} from '../types';

export const taskApi = {
  getTasks: async (params: TaskFilterParams): Promise<PageResponse<Task>> => {
    const cleanParams: Record<string, any> = {};
    if (params.keyword?.trim()) cleanParams.keyword = params.keyword.trim();
    if (params.category) cleanParams.category = params.category;
    if (params.status) cleanParams.status = params.status;
    if (params.priority) cleanParams.priority = params.priority;
    cleanParams.page = params.page ?? 0;
    cleanParams.size = params.size ?? 9;
    cleanParams.sort = params.sort ?? 'createdAt,desc';

    const response = await apiClient.get<ApiResponse<PageResponse<Task>>>('/tasks', {
      params: cleanParams,
    });
    return response.data.data;
  },

  getTaskById: async (id: number): Promise<Task> => {
    const response = await apiClient.get<ApiResponse<Task>>(`/tasks/${id}`);
    return response.data.data;
  },

  createTask: async (data: TaskFormData): Promise<Task> => {
    const response = await apiClient.post<ApiResponse<Task>>('/tasks', data);
    return response.data.data;
  },

  updateTask: async (id: number, data: TaskFormData): Promise<Task> => {
    const response = await apiClient.put<ApiResponse<Task>>(`/tasks/${id}`, data);
    return response.data.data;
  },

  updateTaskStatus: async (id: number, status: TaskStatus): Promise<Task> => {
    const response = await apiClient.patch<ApiResponse<Task>>(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  deleteTask: async (id: number): Promise<void> => {
    await apiClient.delete<ApiResponse<void>>(`/tasks/${id}`);
  },

  getTaskStats: async (): Promise<TaskStats> => {
    const response = await apiClient.get<ApiResponse<TaskStats>>('/tasks/stats');
    return response.data.data;
  },
};
