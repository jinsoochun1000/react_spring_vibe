import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createPost, errorMessage, fetchPost, updatePost } from '../api'

export default function PostFormPage() {
  const { id } = useParams() // id 가 있으면 수정, 없으면 신규
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return
    fetchPost(id)
      .then((p) => { setTitle(p.title); setContent(p.content) })
      .catch((e) => setError(errorMessage(e)))
  }, [id])

  const submit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const saved = id ? await updatePost(id, { title, content }) : await createPost({ title, content })
      navigate(`/posts/${saved.id}`)
    } catch (err) {
      setError(errorMessage(err))
    }
  }

  return (
    <form className="card" onSubmit={submit}>
      <h2>{id ? '글 수정' : '글쓰기'}</h2>
      <label>제목
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={200} required />
      </label>
      <label>내용
        <textarea rows="12" value={content} onChange={(e) => setContent(e.target.value)} maxLength={4000} required />
      </label>
      {error && <p className="error">{error}</p>}
      <div className="actions">
        <Link to={id ? `/posts/${id}` : '/'} className="btn">취소</Link>
        <button className="btn primary" type="submit">저장</button>
      </div>
    </form>
  )
}
