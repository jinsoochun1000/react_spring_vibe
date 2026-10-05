import { useState } from 'react'
import type { FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { token, login } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (token) {
    return <Navigate to="/" replace />
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    setPending(true)
    setError(null)
    try {
      await login(username.trim(), password)
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mx-auto mt-16 max-w-md rounded-3xl border border-stone-200 bg-white px-8 py-10 shadow-sm">
      <p className="text-sm font-medium text-teal-800">Board</p>
      <h1 className="mt-2 text-2xl font-semibold">로그인</h1>
      <p className="mt-2 text-sm text-stone-500">데모 계정 guest01 / password123!</p>
      <form className="mt-8 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium" htmlFor="username">
            아이디
          </label>
          <input
            id="username"
            autoComplete="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-teal-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-1 w-full rounded-xl border border-stone-300 px-3 py-2 outline-none focus:border-teal-800"
          />
        </div>
        {error ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-full bg-teal-800 px-4 py-2 text-white disabled:opacity-60"
        >
          {pending ? '로그인 중' : '로그인'}
        </button>
      </form>
    </div>
  )
}
