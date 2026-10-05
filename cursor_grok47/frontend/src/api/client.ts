const TOKEN_KEY = 'accessToken'
const USER_KEY = 'username'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

type ErrorBody = {
  message?: string
}

export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers)
  if (options.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const response = await fetch(path, { ...options, headers })
  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  let body: (ErrorBody & T) | undefined
  if (text) {
    body = JSON.parse(text) as ErrorBody & T
  }

  if (response.status === 401 && !path.startsWith('/api/auth/login')) {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    window.dispatchEvent(new Event('auth:logout'))
  }

  if (!response.ok) {
    const message = body?.message || '요청에 실패했습니다.'
    throw new ApiError(response.status, message)
  }

  return body as T
}
