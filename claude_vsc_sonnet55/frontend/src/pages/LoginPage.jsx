import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { errorMessage, login, setAuth } from '../api'

export default function LoginPage({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const auth = await login(username, password)
      setAuth(auth)
      onLogin(auth)
      navigate('/')
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>로그인</h2>
      <label>아이디
        <input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus required />
      </label>
      <label>비밀번호
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
      </label>
      {error && <p className="error">{error}</p>}
      <button className="btn primary" type="submit">로그인</button>
    </form>
  )
}
