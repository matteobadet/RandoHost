import { useAuthStore } from '@/stores/authStore'

export function usePermission(permission: string): boolean {
  return useAuthStore(s => s.user?.permissions?.includes(permission) ?? false)
}

export function useHasAnyPermission(...permissions: string[]): boolean {
  return useAuthStore(s => permissions.some(p => s.user?.permissions?.includes(p) ?? false))
}
