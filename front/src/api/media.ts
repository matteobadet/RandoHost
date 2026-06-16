import { gedApi } from '@/lib/axios'
import { useAuthStore } from '@/stores/authStore'

export interface Media {
  id: string
  filename: string
  type: 'Photo' | 'Video'
  mimeType: string
  sizeBytes: number
  width?: number
  height?: number
  durationSeconds?: number
  takenAt?: string
  createdAt: string
  url: string
  location?: { x: number; y: number }
  description?: string
  lieu?: string
  uploadedById?: string
  uploadedByName?: string
  uploadedByAvatar?: string
  reactionCount?: { emoji: string; count: number }[]
}

export interface Comment {
  id: string
  authorId: string
  authorName: string
  authorAvatar?: string
  content: string
  createdAt: string
}

export interface ReactionGroup {
  emoji: string
  count: number
  users: { authorId: string; authorName: string }[]
  mine: boolean
}

export interface MediaPage {
  items: Media[]
  page: number
  pageSize: number
}

export async function getMedia(page = 1, pageSize = 30): Promise<Media[]> {
  const { data } = await gedApi.get<Media[]>('/api/media', { params: { page, pageSize } })
  return data
}

export async function getMediaById(id: string): Promise<Media> {
  const { data } = await gedApi.get<Media>(`/api/media/${id}`)
  return data
}

export async function uploadMedia(file: File, onProgress?: (pct: number) => void): Promise<{ id: string }> {
  const form = new FormData()
  form.append('file', file)
  const user = useAuthStore.getState().user
  const { data } = await gedApi.post<{ id: string }>('/api/media/upload', form, {
    headers: {
      'Content-Type': 'multipart/form-data',
      ...(user && {
        'X-User-Id': user.id,
        'X-User-Name': user.pseudo,
        ...(user.avatarUrl && { 'X-User-Avatar': user.avatarUrl }),
      }),
    },
    onUploadProgress: e => onProgress?.(Math.round((e.loaded * 100) / (e.total ?? 1))),
  })
  return data
}

export async function getComments(mediaId: string): Promise<Comment[]> {
  const { data } = await gedApi.get<Comment[]>(`/api/media/${mediaId}/comments`)
  return data
}

export async function addComment(mediaId: string, content: string): Promise<Comment> {
  const user = useAuthStore.getState().user
  const { data } = await gedApi.post<Comment>(`/api/media/${mediaId}/comments`, { content }, {
    headers: user ? { 'X-User-Id': user.id, 'X-User-Name': user.pseudo, ...(user.avatarUrl && { 'X-User-Avatar': user.avatarUrl }) } : {},
  })
  return data
}

export async function deleteComment(mediaId: string, commentId: string): Promise<void> {
  await gedApi.delete(`/api/media/${mediaId}/comments/${commentId}`)
}

export async function getReactions(mediaId: string): Promise<ReactionGroup[]> {
  const user = useAuthStore.getState().user
  const { data } = await gedApi.get<ReactionGroup[]>(`/api/media/${mediaId}/reactions`, {
    params: user ? { userId: user.id } : {},
  })
  return data
}

export async function toggleReaction(mediaId: string, emoji: string): Promise<ReactionGroup[]> {
  const user = useAuthStore.getState().user
  const { data } = await gedApi.post<ReactionGroup[]>(`/api/media/${mediaId}/reactions`, { emoji }, {
    headers: user ? { 'X-User-Id': user.id, 'X-User-Name': user.pseudo } : {},
  })
  return data
}

export async function updateMedia(id: string, payload: { description?: string; lieu?: string }) {
  await gedApi.patch(`/api/media/${id}`, payload)
}

export async function deleteMedia(id: string) {
  await gedApi.delete(`/api/media/${id}`)
}
