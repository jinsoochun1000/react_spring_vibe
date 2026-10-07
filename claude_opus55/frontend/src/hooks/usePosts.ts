import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { postApi, type PostListParams, type PostRequest } from '../api/posts'

// Query Key 를 한 곳에서 관리 → invalidate 시 실수 방지
export const postKeys = {
  all: ['posts'] as const,
  list: (params: PostListParams) => [...postKeys.all, 'list', params] as const,
  detail: (id: number) => [...postKeys.all, 'detail', id] as const,
}

/** R: 목록 (페이지 이동 시 이전 데이터를 유지해 깜빡임 방지) */
export function usePostList(params: PostListParams) {
  return useQuery({
    queryKey: postKeys.list(params),
    queryFn: () => postApi.list(params),
    placeholderData: keepPreviousData,
  })
}

/** R: 상세 (increaseView=false 는 수정 화면용) */
export function usePost(id: number, increaseView = true) {
  return useQuery({
    queryKey: [...postKeys.detail(id), { increaseView }],
    queryFn: () => postApi.get(id, increaseView),
    enabled: Number.isFinite(id),
    staleTime: increaseView ? 0 : 30_000,
  })
}

/** C */
export function useCreatePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: PostRequest) => postApi.create(req),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  })
}

/** U */
export function useUpdatePost(id: number) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (req: PostRequest) => postApi.update(id, req),
    onSuccess: () => qc.invalidateQueries({ queryKey: postKeys.all }),
  })
}

/** D */
export function useDeletePost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: number) => postApi.remove(id),
    onSuccess: (_data, id) => {
      qc.removeQueries({ queryKey: postKeys.detail(id) })
      return qc.invalidateQueries({ queryKey: postKeys.all })
    },
  })
}
