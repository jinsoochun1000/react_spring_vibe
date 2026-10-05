import { apiClient } from './client';
import { ApiResponse, User } from '../types';

export interface LoginRequestData {
  username: string;
  password: string;
}

export interface LoginResponseData {
  token: string;
  tokenType: string;
  expiresIn: number;
  user: User;
}

export const authApi = {
  login: async (credentials: LoginRequestData): Promise<LoginResponseData> => {
    const response = await apiClient.post<ApiResponse<LoginResponseData>>('/auth/login', credentials);
    return response.data.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get<ApiResponse<User>>('/auth/me');
    return response.data.data;
  },
};
