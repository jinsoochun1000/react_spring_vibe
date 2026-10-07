import axios, { AxiosError } from 'axios'

const TOKEN_KEY = 'accessToken'

export const tokenStorage = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

/** 백엔드 ErrorResponse 와 동일한 구조 */
export interface ApiError {
  status: number
  message: string
  fieldErrors?: Record<string, string>
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json; charset=UTF-8' },
})

// 요청마다 저장된 JWT 를 Authorization 헤더에 첨부
api.interceptors.request.use((config) => {
  const token = tokenStorage.get()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// 토큰 만료/위조로 401 이 오면 토큰 삭제 후 AuthContext 에 알림
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError) => {
    if (error.response?.status === 401 && tokenStorage.get()) {
      tokenStorage.clear()
      window.dispatchEvent(new Event('auth:logout'))
    }
    return Promise.reject(error)
  },
)

/** 어떤 에러든 화면에 보여줄 메시지로 변환 */
export function toApiError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as Partial<ApiError> | undefined
    const status = error.response?.status ?? 0
    if (data?.message) return { status, message: data.message, fieldErrors: data.fieldErrors }
    if (status === 401) return { status, message: '로그인이 필요합니다.' }
    if (status === 403) return { status, message: '권한이 없습니다.' }
    if (status === 0) return { status, message: '서버에 연결할 수 없습니다.' }
  }
  return { status: 0, message: '알 수 없는 오류가 발생했습니다.' }
}
