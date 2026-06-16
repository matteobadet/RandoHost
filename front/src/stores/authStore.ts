import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AuthUser {
  id: string
  pseudo: string
  email: string
  role: string
  permissions: string[]
  avatarKey?: string
  avatarUrl?: string
}

interface AuthState {
  user: AuthUser | null
  accessToken: string | null
  setAuth: (user: AuthUser, token: string) => void
  setAccessToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      setAuth: (user, accessToken) => set({ user, accessToken }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, accessToken: null }),
    }),
    {
      name: 'randohost-auth',
      version: 1,
      partialize: (s) => ({ user: s.user ? { ...s.user, accessToken: undefined } : null }),
      migrate: (state: unknown) => {
        const s = state as { user?: AuthUser | null }
        if (s?.user && !Array.isArray(s.user.permissions)) {
          s.user.permissions = []
        }
        return s
      },
    }
  )
)

export const usePermission = (permission: string) =>
  useAuthStore(s => s.user?.permissions?.includes(permission) ?? false)

export const useIsAdmin = () =>
  useAuthStore(s => s.user?.role === 'Admin')
