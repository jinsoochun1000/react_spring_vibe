import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, type SignupRequest } from '../api/auth'
import { toApiError } from '../api/client'

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupRequest>({ username: '', password: '', email: '' })
  const signup = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => navigate('/login', { state: { signedUp: true } }),
  })
  const error = signup.error ? toApiError(signup.error) : null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    signup.mutate({ ...form, username: form.username.trim(), email: form.email.trim() })
  }

  const field = (name: keyof SignupRequest, label: string, type = 'text', autoComplete?: string) => (
    <label className="block">
      <span className="mb-1 block text-sm text-slate-600">{label}</span>
      <input
        className="input"
        type={type}
        value={form[name]}
        autoComplete={autoComplete}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        required
      />
      {error?.fieldErrors?.[name] && <span className="mt-1 block text-xs text-rose-600">{error.fieldErrors[name]}</span>}
    </label>
  )

  return (
    <div className="card mx-auto max-w-sm p-6">
      <h1 className="mb-6 text-xl font-bold">회원가입</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        {field('username', '아이디 (영문/숫자/_ 4~50자)', 'text', 'username')}
        {field('password', '비밀번호 (8자 이상)', 'password', 'new-password')}
        {field('email', '이메일', 'email', 'email')}
        {error && !error.fieldErrors?.username && <p className="text-sm text-rose-600">{error.message}</p>}
        <button className="btn-primary w-full" disabled={signup.isPending}>
          {signup.isPending ? '처리 중...' : '가입하기'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        이미 계정이 있으신가요?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
