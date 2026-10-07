import { api } from './client'
import type { PageResponse, PostDetail, PostRequest, PostSummary } from './types'

export interface PostListParams {
  page: number // 0부터 시작
  size: number
  keyword?: string
}

export const postApi = {
  list: ({ page, size, keyword }: PostListParams) =>
    api
      .get<PageResponse<PostSummary>>('/posts', {
        params: { page, size, keyword: keyword || undefined },
      })
      .then((r) => r.data),

  get: (id: number) => api.get<PostDetail>(`/posts/${id}`).then((r) => r.data),

  create: (body: PostRequest) => api.post<PostDetail>('/posts', body).then((r) => r.data),

  update: (id: number, body: PostRequest) =>
    api.put<PostDetail>(`/posts/${id}`, body).then((r) => r.data),

  remove: (id: number) => api.delete<void>(`/posts/${id}`).then(() => undefined),
}
