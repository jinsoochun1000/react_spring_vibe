import axios from 'axios'

const TOKEN_KEY = 'crud.auth'

export const getAuth = () => {
  try { return JSON.parse(localStorage.getItem(TOKEN_KEY)) } catch { return null }
}
export const setAuth = (auth) => localStorage.setItem(TOKEN_KEY, JSON.stringify(auth))
export const clearAuth = () => localStorage.removeItem(TOKEN_KEY)

const api = axios.create({ baseURL: '/api' })

// 요청마다 JWT 첨부
api.interceptors.request.use((config) => {
  const auth = getAuth()
  if (auth?.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

// 토큰 만료 등 401 -> 로그아웃 처리 후 로그인 화면으로 (로그인 요청 자체는 제외)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config.url.includes('/auth/login')) {
      clearAuth()
      window.location.assign('/login')
    }
    return Promise.reject(err)
  },
)

export const errorMessage = (err) => err.response?.data?.message || '요청 처리 중 오류가 발생했습니다.'

export const login = (username, password) => api.post('/auth/login', { username, password }).then((r) => r.data)
export const fetchPosts = (params) => api.get('/posts', { params }).then((r) => r.data)
export const fetchPost = (id) => api.get(`/posts/${id}`).then((r) => r.data)
export const createPost = (body) => api.post('/posts', body).then((r) => r.data)
export const updatePost = (id, body) => api.put(`/posts/${id}`, body).then((r) => r.data)
export const deletePost = (id) => api.delete(`/posts/${id}`)
