import { userApi } from '@/lib/axios'
import { useAuthStore, type AuthUser } from '@/stores/authStore'

interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export async function login(email: string, password: string) {
  const { data } = await userApi.post<LoginResponse>('/api/auth/login', { email, password })
  useAuthStore.getState().setAuth(data.user, data.accessToken)
  return data.user
}

export async function register(pseudo: string, email: string, password: string) {
  const { data } = await userApi.post('/api/auth/register', { pseudo, email, password })
  return data
}

export async function logout() {
  await userApi.post('/api/auth/logout').catch(() => {})
  useAuthStore.getState().logout()
}

export async function getMe() {
  const { data } = await userApi.get<AuthUser>('/api/users/me')
  return data
}

export async function updateMe(payload: { pseudo?: string; email?: string; password?: string }) {
  await userApi.put('/api/users/me', payload)
}

export async function uploadAvatar(file: File) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await userApi.put<{ avatarUrl: string }>('/api/users/me/avatar', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  // Persist avatar URL in store so it survives navigation
  const store = useAuthStore.getState()
  if (store.user) {
    store.setAuth({ ...store.user, avatarUrl: data.avatarUrl }, store.accessToken!)
  }
  return data.avatarUrl
}
