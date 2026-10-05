import { createContext, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { api } from '../api/client'
import type { MeResponse, TokenResponse } from '../api/types'

type AuthContextValue = {
  token: string | null
  username: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('accessToken'))
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem('username'))

  useEffect(() => {
    const onLogout = () => {
      setToken(null)
      setUsername(null)
    }
    window.addEventListener('auth:logout', onLogout)
    return () => window.removeEventListener('auth:logout', onLogout)
  }, [])

  useEffect(() => {
    if (!token) {
      return
    }
    let cancelled = false
    api<MeResponse>('/api/auth/me')
      .then((me) => {
        if (cancelled) {
          return
        }
        localStorage.setItem('username', me.username)
        setUsername(me.username)
      })
      .catch(() => {
        if (cancelled) {
          return
        }
        localStorage.removeItem('accessToken')
        localStorage.removeItem('username')
        setToken(null)
        setUsername(null)
      })
    return () => {
      cancelled = true
    }
  }, [token])

  async function login(nextUsername: string, password: string) {
    const result = await api<TokenResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username: nextUsername, password }),
    })
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('username', result.username)
    setToken(result.accessToken)
    setUsername(result.username)
  }

  function logout() {
    localStorage.removeItem('accessToken')
    localStorage.removeItem('username')
    setToken(null)
    setUsername(null)
  }

  return (
    <AuthContext.Provider value={{ token, username, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('AuthProvider가 필요합니다.')
  }
  return value
}
