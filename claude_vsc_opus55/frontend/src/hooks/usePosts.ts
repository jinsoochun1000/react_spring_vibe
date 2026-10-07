import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { postApi, type PostListParams } from '../api/posts'
import type { PostRequest } from '../api/types'

/** 쿼리 키를 한 곳에서 관리해 invalidate 범위를 명확히 한다. */
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (params: PostListParams) => [...postKeys.lists(), params] as const,
  detail: (id: number) => [...postKeys.all, 'detail', id] as const,
}

export function usePostList(params: PostListParams) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postApi.list(params),
    placeholderData: keepPreviousData, // 페이지 이동 시 이전 목록을 유지해 깜빡임 방지
  })
}

export function usePost(id: number, enabled = true) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postApi.get(id),
    enabled: enabled && Number.isFinite(id),
  })
}

export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PostRequest) => postApi.create(body),
    onSuccess: (created) => {
      qc.setQueryData(postKeys.detail(created.id), created)
      qc.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

export function useUpdatePost(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: PostRequest) => postApi.update(id, body),
    onSuccess: (updated) => {
      // 상세는 응답으로 바로 갱신(재조회 시 조회수 증가 방지), 목록은 무효화
      qc.setQueryData(postKeys.detail(id), updated)
      qc.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}

export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => postApi.remove(id),
    onSuccess: (_, id) => {
      qc.removeQueries({ queryKey: postKeys.detail(id) })
      qc.invalidateQueries({ queryKey: postKeys.lists() })
    },
  })
}
