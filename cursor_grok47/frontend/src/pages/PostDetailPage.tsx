import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Post } from '../api/types'
import { useAuth } from '../auth/AuthContext'
import { formatDate } from '../format'

export function PostDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { username } = useAuth()

  const query = useQuery({
    queryKey: ['post', id],
    queryFn: () => api<Post>(`/api/posts/${id}`),
    enabled: Boolean(id),
  })

  const remove = useMutation({
    mutationFn: () => api<void>(`/api/posts/${id}`, { method: 'DELETE' }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate('/')
    },
  })

  function onDelete() {
    if (!window.confirm('이 글을 삭제할까요?')) {
      return
    }
    remove.mutate()
  }

  if (query.isLoading) {
    return <p className="text-sm text-stone-500">글을 불러오는 중입니다.</p>
  }

  if (query.isError || !query.data) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {query.error instanceof Error ? query.error.message : '글을 찾을 수 없습니다.'}
        </p>
        <Link to="/" className="text-sm text-teal-800">
          목록
        </Link>
      </div>
    )
  }

  const post = query.data
  const mine = post.author === username
  const edited = post.updatedAt !== post.createdAt

  return (
    <article className="rounded-3xl border border-stone-200 bg-white px-6 py-7">
      <p className="text-sm text-stone-500">
        {post.author} · {formatDate(post.createdAt)}
        {edited ? ` · 수정 ${formatDate(post.updatedAt)}` : ''}
      </p>
      <h1 className="mt-3 text-2xl font-semibold">{post.title}</h1>
      <p className="mt-6 whitespace-pre-wrap leading-7 text-stone-800">{post.content}</p>
      <div className="mt-8 flex flex-wrap gap-2">
        <Link to="/" className="rounded-full border border-stone-300 px-4 py-2 text-sm">
          목록
        </Link>
        {mine ? (
          <>
            <Link
              to={`/posts/${post.id}/edit`}
              className="rounded-full border border-teal-800 px-4 py-2 text-sm text-teal-800"
            >
              수정
            </Link>
            <button
              type="button"
              onClick={onDelete}
              disabled={remove.isPending}
              className="rounded-full bg-rose-700 px-4 py-2 text-sm text-white disabled:opacity-60"
            >
              삭제
            </button>
          </>
        ) : null}
      </div>
      {remove.isError ? (
        <p className="mt-4 rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {remove.error instanceof Error ? remove.error.message : '삭제에 실패했습니다.'}
        </p>
      ) : null}
    </article>
  )
}
