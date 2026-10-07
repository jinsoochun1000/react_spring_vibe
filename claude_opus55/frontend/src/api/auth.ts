import { api } from './client'

export interface User {
  id: number
  username: string
  email: string
  role: 'ROLE_USER' | 'ROLE_ADMIN' | string
}

export interface TokenResponse {
  accessToken: string
  tokenType: string
  expiresIn: number
  user: User
}

export interface SignupRequest {
  username: string
  password: string
  email: string
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { username, password }).then((r) => r.data),
  signup: (req: SignupRequest) => api.post<User>('/auth/signup', req).then((r) => r.data),
  me: () => api.get<User>('/auth/me').then((r) => r.data),
}
