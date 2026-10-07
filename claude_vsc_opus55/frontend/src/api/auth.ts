import { api } from './client'
import type { TokenResponse, User } from './types'

export interface SignupRequest {
  username: string
  password: string
  email: string
}

export const authApi = {
  login: (username: string, password: string) =>
    api.post<TokenResponse>('/auth/login', { username, password }).then((r) => r.data),

  signup: (body: SignupRequest) => api.post<User>('/auth/signup', body).then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),
}
