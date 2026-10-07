// fetch 래퍼: JWT 자동 첨부, JSON 처리, 401 시 로그아웃 처리
const TOKEN_KEY = 'crud.token'

export const tokenStore = {
  get: () => localStorage.getItem(TOKEN_KEY),
  set: (t) => localStorage.setItem(TOKEN_KEY, t),
  clear: () => localStorage.removeItem(TOKEN_KEY),
}

let onUnauthorized = () => {}
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn }

async function request(method, url, body) {
  const headers = { 'Content-Type': 'application/json' }
  const token = tokenStore.get()
  if (token) headers.Authorization = `Bearer ${token}`

  const res = await fetch(`/api${url}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  })

  if (res.status === 204) return null
  const data = await res.json().catch(() => null)

  if (!res.ok) {
    // 로그인 요청 자체의 401 은 "아이디/비밀번호 오류"이므로 세션 만료로 취급하지 않는다
    if (res.status === 401 && url !== '/auth/login') onUnauthorized()
    throw new Error(data?.message || `요청 실패 (${res.status})`)
  }
  return data
}

export const api = {
  login: (username, password) => request('POST', '/auth/login', { username, password }),
  me: () => request('GET', '/auth/me'),
  listPosts: ({ keyword = '', page = 0, size = 10 }) =>
    request('GET', `/posts?keyword=${encodeURIComponent(keyword)}&page=${page}&size=${size}`),
  getPost: (id, countView = true) => request('GET', `/posts/${id}?countView=${countView}`),
  createPost: (post) => request('POST', '/posts', post),
  updatePost: (id, post) => request('PUT', `/posts/${id}`, post),
  deletePost: (id) => request('DELETE', `/posts/${id}`),
}
