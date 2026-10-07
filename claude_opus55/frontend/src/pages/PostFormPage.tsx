import { useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { toApiError } from '../api/client'
import type { PostDetail, PostRequest } from '../api/posts'
import { useAuth } from '../auth/AuthContext'
import { useCreatePost, usePost, useUpdatePost } from '../hooks/usePosts'

/** 등록(/posts/new)과 수정(/posts/:id/edit)을 하나의 화면으로 처리 */
export default function PostFormPage() {
  const params = useParams()
  const id = params.id ? Number(params.id) : undefined

  if (id === undefined) return <PostForm />
  return <EditPostLoader id={id} />
}

function EditPostLoader({ id }: { id: number }) {
  const { user, isAdmin } = useAuth()
  const { data, isPending, isError, error } = usePost(id, false)

  if (isPending) return <p className="text-center text-slate-500">불러오는 중...</p>
  if (isError) return <p className="text-center text-rose-600">{toApiError(error).message}</p>
  if (user?.id !== data.authorId && !isAdmin)
    return <p className="text-center text-rose-600">본인이 작성한 게시글만 수정할 수 있습니다.</p>
  // key 를 주어 다른 글로 이동 시 폼 상태 초기화
  return <PostForm key={data.id} post={data} />
}

function PostForm({ post }: { post?: PostDetail }) {
  const navigate = useNavigate()
  const isEdit = !!post
  const [form, setForm] = useState<PostRequest>({ title: post?.title ?? '', content: post?.content ?? '' })

  const createPost = useCreatePost()
  const updatePost = useUpdatePost(post?.id ?? -1)
  const mutation = isEdit ? updatePost : createPost
  const error = mutation.error ? toApiError(mutation.error) : null

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    mutation.mutate(form, {
      onSuccess: (saved) => navigate(`/posts/${saved.id}`, { replace: true }),
    })
  }

  return (
    <div className="card p-6">
      <h1 className="mb-6 text-2xl font-bold">{isEdit ? '게시글 수정' : '새 글 작성'}</h1>
      <form onSubmit={onSubmit} className="space-y-4">
        <label className="block">
          <span className="mb-1 flex justify-between text-sm text-slate-600">
            제목 <span className="text-xs text-slate-400">{form.title.length}/200</span>
          </span>
          <input
            className="input"
            value={form.title}
            maxLength={200}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
            required
          />
          {error?.fieldErrors?.title && <span className="mt-1 block text-xs text-rose-600">{error.fieldErrors.title}</span>}
        </label>
        <label className="block">
          <span className="mb-1 block text-sm text-slate-600">내용</span>
          <textarea
            className="input min-h-72 resize-y"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            required
          />
          {error?.fieldErrors?.content && <span className="mt-1 block text-xs text-rose-600">{error.fieldErrors.content}</span>}
        </label>
        {error && !error.fieldErrors && <p className="text-sm text-rose-600">{error.message}</p>}
        <div className="flex justify-end gap-2">
          <Link to={isEdit ? `/posts/${post.id}` : '/posts'} className="btn-secondary">
            취소
          </Link>
          <button className="btn-primary" disabled={mutation.isPending}>
            {mutation.isPending ? '저장 중...' : isEdit ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </div>
  )
}
