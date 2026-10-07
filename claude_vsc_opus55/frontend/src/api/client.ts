import axios, { AxiosError } from 'axios'
import type { ErrorResponse } from './types'

export const TOKEN_KEY = 'accessToken'
export const USER_KEY = 'user'

/** 모든 API 호출이 공유하는 axios 인스턴스. baseURL 은 Vite 프록시(/api) 기준. */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  headers: { 'Content-Type': 'application/json' },
})

// 요청마다 저장된 JWT 를 Authorization 헤더에 실어 보낸다.
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// 토큰 만료/위조로 401 이 오면 저장된 인증정보를 지우고 로그인 화면으로 보낸다.
api.interceptors.response.use(
  (res) => res,
  (error: AxiosError<ErrorResponse>) => {
    const isLoginCall = error.config?.url?.includes('/auth/login')
    if (error.response?.status === 401 && !isLoginCall && localStorage.getItem(TOKEN_KEY)) {
      localStorage.removeItem(TOKEN_KEY)
      localStorage.removeItem(USER_KEY)
      window.location.href = '/login?expired=1'
    }
    return Promise.reject(error)
  },
)

/** 서버 ErrorResponse 에서 사용자에게 보여줄 메시지를 꺼낸다. */
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.message ?? '서버에 연결할 수 없습니다.'
  }
  return '알 수 없는 오류가 발생했습니다.'
}

/** 필드별 검증 오류 (예: { title: '제목을 입력하세요.' }) */
export function getFieldErrors(error: unknown): Record<string, string> {
  if (axios.isAxiosError<ErrorResponse>(error)) {
    return error.response?.data?.fieldErrors ?? {}
  }
  return {}
}
