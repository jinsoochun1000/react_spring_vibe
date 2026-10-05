export type TokenResponse = {
  accessToken: string
  tokenType: string
  username: string
}

export type MeResponse = {
  id: number
  username: string
}

export type Post = {
  id: number
  title: string
  content: string
  author: string
  createdAt: string
  updatedAt: string
}

export type PostPage = {
  content: Post[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}
