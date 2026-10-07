import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { getErrorMessage, getFieldErrors } from '../api/client'
import type { PostDetail, PostRequest } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { useCreatePost, usePost, useUpdatePost } from '../hooks/usePosts'

/** /posts/new (등록) 와 /posts/:id/edit (수정) 를 함께 처리 */
export default function PostFormPage() {
  const params = useParams()
  const isEdit = params.id !== undefined
  const id = Number(params.id)
  const { data: post, isPending, isError, error } = usePost(id)

  if (!isEdit) return <PostForm />
  if (isPending) return <p className="py-10 text-center text-slate-500">불러오는 중…</p>
  if (isError) return <p className="py-10 text-center text-red-600">{getErrorMessage(error)}</p>
  return <PostForm post={post} />
}

function PostForm({ post }: { post?: PostDetail }) {
  const navigate = useNavigate()
  const { canEdit } = useAuth()
  const [form, setForm] = useState<PostRequest>({
    title: post?.title ?? '',
    content: post?.content ?? '',
  })
  const createPost = useCreatePost()
  const updatePost = useUpdatePost(post?.id ?? NaN)
  const mutation = post ? updatePost : createPost
  const fieldErrors = getFieldErrors(mutation.error)

  if (post && !canEdit(post.authorId)) {
    return <Navigate to={`/posts/${post.id}`} replace />
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate(form, {
      onSuccess: (saved) => navigate(`/posts/${saved.id}`, { replace: true }),
    })
  }

  return (
    <div className="card">
      <h1 className="mb-6 text-xl font-bold">{post ? '게시글 수정' : '새 게시글'}</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <label className="block">
          <span className="label">제목</span>
          <input
            className="input"
            maxLength={200}
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          {fieldErrors.title && <span className="mt-1 block text-xs text-red-600">{fieldErrors.title}</span>}
        </label>
        <label className="block">
          <span className="label">내용</span>
          <textarea
            className="input min-h-64"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />
          {fieldErrors.content && <span className="mt-1 block text-xs text-red-600">{fieldErrors.content}</span>}
        </label>
        {mutation.isError && <p className="text-sm text-red-600">{getErrorMessage(mutation.error)}</p>}
        <div className="flex justify-end gap-2">
          <Link to={post ? `/posts/${post.id}` : '/posts'} className="btn-secondary">
            취소
          </Link>
          <button type="submit" className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? '저장 중…' : '저장'}
          </button>
        </div>
      </form>
    </div>
  )
}
