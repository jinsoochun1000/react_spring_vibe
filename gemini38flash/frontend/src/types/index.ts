export type TaskCategory = 'FRONTEND' | 'BACKEND' | 'DATABASE' | 'DEVOPS' | 'DESIGN' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'REVIEW' | 'DONE';

export interface User {
  id: number;
  username: string;
  name: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  createdAt: string;
}

export interface Task {
  id: number;
  title: string;
  content: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string | null;
  authorUsername: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  review: number;
  done: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PageResponse<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number; // current page (0-based)
  first: boolean;
  last: boolean;
  empty: boolean;
}

export interface TaskFilterParams {
  keyword?: string;
  category?: TaskCategory | '';
  status?: TaskStatus | '';
  priority?: TaskPriority | '';
  page?: number;
  size?: number;
  sort?: string;
}

export interface TaskFormData {
  title: string;
  content: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate?: string;
}
