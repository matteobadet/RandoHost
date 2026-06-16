import { userApi } from '@/lib/axios'
import type { AuthUser } from '@/stores/authStore'

interface RawAdminUser {
  id: string
  pseudo: string
  email: string
  role: string
  effectivePermissions: string[]
  extraPermissions: string[]
  revokedPermissions: string[]
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  avatarUrl?: string
}

export interface AdminUser {
  id: string
  pseudo: string
  email: string
  role: string
  permissions: string[]
  extraPermissions: string[]
  revokedPermissions: string[]
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
  avatarUrl?: string
}

export async function getAllUsers(): Promise<AdminUser[]> {
  const { data } = await userApi.get<RawAdminUser[]>('/api/users')
  return data.map(u => ({
    ...u,
    permissions: u.effectivePermissions ?? [],
    extraPermissions: u.extraPermissions ?? [],
    revokedPermissions: u.revokedPermissions ?? [],
  }))
}

export async function setUserRole(userId: string, roleId: number) {
  await userApi.patch(`/api/users/${userId}/role`, { roleId })
}

export async function setUserPermissions(userId: string, extraPermissions: string[], revokedPermissions: string[]) {
  await userApi.patch(`/api/users/${userId}/permissions`, { extraPermissions, revokedPermissions })
}

export async function setUserActive(userId: string, isActive: boolean) {
  await userApi.patch(`/api/users/${userId}/active`, { isActive })
}

export async function deleteUser(userId: string) {
  await userApi.delete(`/api/users/${userId}`)
}
