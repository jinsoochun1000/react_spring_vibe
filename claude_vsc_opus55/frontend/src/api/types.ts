// 백엔드 DTO 와 1:1 대응되는 타입 정의

export interface User {
  id: number
  username: string
  email: string
  role: 'ROLE_USER' | 'ROLE_ADMIN'
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface PostSummary {
  id: number
  title: string
  authorUsername: string
  viewCount: number
  createdAt: string
}

export interface PostDetail extends PostSummary {
  content: string
  authorId: number
  updatedAt: string
}

export interface PostRequest {
  title: string
  content: string
}

export interface PageResponse<T> {
  content: T[]
  page: number // 0부터 시작
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
}

export interface ErrorResponse {
  status: number
  message: string
  fieldErrors: Record<string, string>
  timestamp: string
}
