export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}
let csrf: { token: string; headerName: string } | null = null;
export async function refreshCsrf() {
  const response = await fetch("/api/auth/csrf", {
    credentials: "same-origin",
  });
  if (!response.ok)
    throw new ApiError(response.status, "서버에 연결할 수 없습니다.");
  csrf = await response.json();
}
export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const method = options.method || "GET";
  const headers = new Headers(options.headers);
  if (!["GET", "HEAD"].includes(method)) {
    if (!csrf) await refreshCsrf();
    headers.set(csrf!.headerName, csrf!.token);
  }
  if (options.body && !(options.body instanceof URLSearchParams))
    headers.set("Content-Type", "application/json");
  let response: Response;
  try {
    response = await fetch(path, {
      ...options,
      headers,
      credentials: "same-origin",
    });
  } catch {
    throw new ApiError(
      0,
      "서버에 연결할 수 없습니다. 연결 상태를 확인해 주세요.",
    );
  }
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    if (response.status === 401 && path !== "/api/auth/login")
      window.dispatchEvent(new Event("session-expired"));
    throw new ApiError(
      response.status,
      body.message || "요청을 처리할 수 없습니다. 다시 시도해 주세요.",
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export type Account = {
  id: number;
  username: string;
  email: string;
  role: string;
};
export type Post = {
  id: number;
  title: string;
  content: string;
  userId: number;
  username: string;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
};
export type Page = {
  items: Post[];
  total: number;
  page: number;
  size: number;
  totalPages: number;
};
export type Stats = { total: number; mine: number; views: number };
