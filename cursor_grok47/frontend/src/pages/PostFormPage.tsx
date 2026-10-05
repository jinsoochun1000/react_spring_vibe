import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { api } from '../api/client'
import type { Post } from '../api/types'

export function PostFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')

  const existing = useQuery({
    queryKey: ['post', id],
    queryFn: () => api<Post>(`/api/posts/${id}`),
    enabled: isEdit,
  })

  useEffect(() => {
    if (!existing.data) {
      return
    }
    setTitle(existing.data.title)
    setContent(existing.data.content)
  }, [existing.data])

  const save = useMutation({
    mutationFn: () => {
      const body = JSON.stringify({ title: title.trim(), content: content.trim() })
      if (isEdit) {
        return api<Post>(`/api/posts/${id}`, { method: 'PUT', body })
      }
      return api<Post>('/api/posts', { method: 'POST', body })
    },
    onSuccess: async (post) => {
      await queryClient.invalidateQueries({ queryKey: ['posts'] })
      await queryClient.invalidateQueries({ queryKey: ['post', String(post.id)] })
      navigate(`/posts/${post.id}`)
    },
  })

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    save.mutate()
  }

  if (isEdit && existing.isLoading) {
    return <p className="text-sm text-stone-500">글을 불러오는 중입니다.</p>
  }

  if (isEdit && existing.isError) {
    return (
      <div className="space-y-4">
        <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {existing.error instanceof Error ? existing.error.message : '글을 찾을 수 없습니다.'}
        </p>
        <Link to="/" className="text-sm text-teal-800">
          목록
        </Link>
      </div>
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">{isEdit ? '글 수정' : '글쓰기'}</h1>
      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div>
          <label className="block text-sm font-medium" htmlFor="title">
            제목
          </label>
          <input
            id="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={200}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-800"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="content">
            내용
          </label>
          <textarea
            id="content"
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={10}
            className="mt-1 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 outline-none focus:border-teal-800"
          />
        </div>
        {save.isError ? (
          <p className="rounded-xl bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {save.error instanceof Error ? save.error.message : '저장에 실패했습니다.'}
          </p>
        ) : null}
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={save.isPending}
            className="rounded-full bg-teal-800 px-4 py-2 text-sm text-white disabled:opacity-60"
          >
            {isEdit ? '저장' : '등록'}
          </button>
          <Link to={isEdit ? `/posts/${id}` : '/'} className="rounded-full border border-stone-300 px-4 py-2 text-sm">
            취소
          </Link>
        </div>
      </form>
    </section>
  )
}
