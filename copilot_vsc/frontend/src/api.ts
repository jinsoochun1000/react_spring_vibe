export type User = { id: number; username: string; email: string; role: string };
export type Post = { id: number; title: string; content: string; userId: number; author: string; viewCount: number; createdAt: string; updatedAt: string };
export type PostPage = { items: Post[]; totalElements: number; page: number; size: number; totalPages: number; totalPosts: number; myPosts: number; authors: number };
export class ApiError extends Error { constructor(public status: number, message: string) { super(message); } }
let csrf: { token: string; headerName: string } | null = null;
export async function refreshCsrf() {
  const response = await fetch('/api/auth/csrf', { credentials: 'same-origin' });
  if (!response.ok) throw new ApiError(response.status, '서버에 연결할 수 없습니다.');
  csrf = await response.json();
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.method && !['GET', 'HEAD'].includes(options.method)) {
    if (!csrf) await refreshCsrf();
    headers.set(csrf!.headerName, csrf!.token);
  }
  if (typeof options.body === 'string' && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  let response: Response;
  try { response = await fetch(`/api${path}`, { ...options, headers, credentials: 'same-origin' }); }
  catch { throw new ApiError(0, '서버에 연결할 수 없습니다. 백엔드 실행 상태를 확인해 주세요.'); }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && path !== '/auth/login' && path !== '/auth/me') window.dispatchEvent(new Event('session-expired'));
    if (response.status === 403) csrf = null;
    throw new ApiError(response.status, body.message || '요청을 처리하지 못했습니다.');
  }
  return response.status === 204 ? undefined as T : response.json();
}
export const titleBytes = (text: string) => new TextEncoder().encode(text.trim()).length;
