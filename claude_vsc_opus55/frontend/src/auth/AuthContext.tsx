import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { TOKEN_KEY, USER_KEY } from '../api/client'
import { authApi } from '../api/auth'
import type { User } from '../api/types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  /** 작성자 본인 또는 관리자인지 */
  canEdit: (authorId: number) => boolean
}

const AuthContext = createContext<AuthState | null>(null)

function loadUser(): User | null {
  if (!localStorage.getItem(TOKEN_KEY)) return null
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) ?? 'null') as User | null
  } catch {
    return null
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(loadUser)

  const login = useCallback(async (username: string, password: string) => {
    const res = await authApi.login(username, password)
    localStorage.setItem(TOKEN_KEY, res.accessToken)
    localStorage.setItem(USER_KEY, JSON.stringify(res.user))
    setUser(res.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
    setUser(null)
  }, [])

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      canEdit: (authorId) => user !== null && (user.id === authorId || user.role === 'ROLE_ADMIN'),
    }),
    [user, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// 훅을 Provider 와 같은 파일에 둔다(Fast Refresh 경고만 해당, 동작 영향 없음)
// oxlint-disable-next-line react/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
