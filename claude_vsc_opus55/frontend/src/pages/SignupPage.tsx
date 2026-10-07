import { useMutation } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi, type SignupRequest } from '../api/auth'
import { getErrorMessage, getFieldErrors } from '../api/client'

export default function SignupPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState<SignupRequest>({ username: '', password: '', email: '' })

  const signup = useMutation({
    mutationFn: authApi.signup,
    onSuccess: () => {
      alert('회원가입이 완료되었습니다. 로그인해 주세요.')
      navigate('/login')
    },
  })
  const fieldErrors = getFieldErrors(signup.error)

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    signup.mutate(form)
  }

  const field = (name: keyof SignupRequest, label: string, type = 'text') => (
    <label className="block">
      <span className="label">{label}</span>
      <input
        className="input"
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
      />
      {fieldErrors[name] && <span className="mt-1 block text-xs text-red-600">{fieldErrors[name]}</span>}
    </label>
  )

  return (
    <div className="card mx-auto max-w-sm">
      <h1 className="mb-6 text-xl font-bold">회원가입</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {field('username', '아이디 (영문/숫자/_ 4자 이상)')}
        {field('password', '비밀번호 (8자 이상)', 'password')}
        {field('email', '이메일', 'email')}
        {signup.isError && <p className="text-sm text-red-600">{getErrorMessage(signup.error)}</p>}
        <button type="submit" className="btn-primary w-full" disabled={signup.isPending}>
          {signup.isPending ? '처리 중…' : '가입하기'}
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-500">
        이미 계정이 있나요?{' '}
        <Link to="/login" className="text-indigo-600 hover:underline">
          로그인
        </Link>
      </p>
    </div>
  )
}
