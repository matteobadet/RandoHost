import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'

const API_USER = import.meta.env.VITE_API_USER ?? 'http://localhost:5001'
const API_GED  = import.meta.env.VITE_API_GED  ?? 'http://localhost:5000'

export const userApi = axios.create({ baseURL: API_USER, withCredentials: true })
export const gedApi  = axios.create({ baseURL: API_GED,  withCredentials: true })

let isRefreshing = false
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

function processQueue(error: unknown, token: string | null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token!))
  failedQueue = []
}

function attachInterceptors(instance: typeof userApi) {
  instance.interceptors.request.use(config => {
    const token = useAuthStore.getState().accessToken
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
  })

  instance.interceptors.response.use(
    r => r,
    async error => {
      const original = error.config
      if (error.response?.status !== 401 || original._retry || original.url?.includes('/auth/refresh')) return Promise.reject(error)

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return instance(original)
        })
      }

      original._retry = true
      isRefreshing = true

      try {
        const { data } = await userApi.post<{ accessToken: string }>('/api/auth/refresh')
        useAuthStore.getState().setAccessToken(data.accessToken)
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return instance(original)
      } catch (err) {
        processQueue(err, null)
        useAuthStore.getState().logout()
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }
  )
}

attachInterceptors(userApi)
attachInterceptors(gedApi)
