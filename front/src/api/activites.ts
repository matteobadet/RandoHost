import { gedApi } from '@/lib/axios'
import type { Media } from './media'

export interface Activite {
  id: string
  name: string
  description?: string
  lieu?: string
  date?: string
  createdAt: string
  albumMedia?: { media: Media; order: number }[]
}

export async function getActivites(): Promise<Activite[]> {
  const { data } = await gedApi.get<Activite[]>('/api/album')
  return data
}

export async function getActiviteById(id: string): Promise<Activite> {
  const { data } = await gedApi.get<Activite>(`/api/album/${id}`)
  return data
}

export async function createActivite(payload: { name: string; description?: string; lieu?: string; date?: string }): Promise<{ id: string }> {
  const { data } = await gedApi.post<{ id: string }>('/api/album', payload)
  return data
}

export async function updateActivite(id: string, payload: { name?: string; description?: string; lieu?: string; date?: string }) {
  await gedApi.patch(`/api/album/${id}`, payload)
}

export async function deleteActivite(id: string) {
  await gedApi.delete(`/api/album/${id}`)
}

export async function addMediaToActivite(albumId: string, mediaId: string, order = 0) {
  await gedApi.post(`/api/album/${albumId}/media/${mediaId}`, null, { params: { order } })
}

export async function removeMediaFromActivite(albumId: string, mediaId: string) {
  await gedApi.delete(`/api/album/${albumId}/media/${mediaId}`)
}
