import { api } from './client'

export interface PostSummary {
  id: number
  title: string
  authorId: number
  authorName: string
  viewCount: number
  createdAt: string
  updatedAt: string
}

export interface PostDetail extends PostSummary {
  content: string
}

export interface PostRequest {
  title: string
  content: string
}

export interface Page<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface PostListParams {
  page: number
  size: number
  keyword?: string
}

export const postApi = {
  list: (params: PostListParams) => api.get<Page<PostSummary>>('/posts', { params }).then((r) => r.data),
  get: (id: number, increaseView = true) =>
    api.get<PostDetail>(`/posts/${id}`, { params: { increaseView } }).then((r) => r.data),
  create: (req: PostRequest) => api.post<PostDetail>('/posts', req).then((r) => r.data),
  update: (id: number, req: PostRequest) => api.put<PostDetail>(`/posts/${id}`, req).then((r) => r.data),
  remove: (id: number) => api.delete<void>(`/posts/${id}`),
}
