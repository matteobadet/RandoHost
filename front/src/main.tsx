import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Layout } from '@/components/Layout'
import { LoginPage } from '@/pages/LoginPage'
import { RegisterPage } from '@/pages/RegisterPage'
import { GalleriePage } from '@/pages/GalleriePage'
import { ActivitesPage } from '@/pages/ActivitesPage'
import { ActiviteDetailPage } from '@/pages/ActiviteDetailPage'
import { UploadPage } from '@/pages/UploadPage'
import { ProfilPage } from '@/pages/ProfilPage'
import { AdminPage } from '@/pages/AdminPage'
import { MediaDetailPage } from '@/pages/MediaDetailPage'
import { useAuthStore } from '@/stores/authStore'
import { useThemeStore, applyTheme } from '@/stores/themeStore'
import { userApi } from '@/lib/axios'
import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
})

// Restaure l'accessToken depuis le cookie refresh_token au démarrage
async function restoreSession() {
  const store = useAuthStore.getState()
  if (!store.user) return               // pas d'utilisateur connu, rien à faire
  if (store.accessToken) return         // token déjà en mémoire

  try {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 5000)
    const { data } = await userApi.post<{ accessToken: string }>('/api/auth/refresh', null, { signal: controller.signal })
    clearTimeout(timer)
    store.setAccessToken(data.accessToken)
  } catch {
    store.logout()                       // cookie expiré ou révoqué
  }
}

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore(s => s.user)
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

function App() {
  const theme = useThemeStore(s => s.theme)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    applyTheme(theme)
    restoreSession().finally(() => setReady(true))
  }, [])

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/" element={<RequireAuth><Layout><Navigate to="/galerie" replace /></Layout></RequireAuth>} />
          <Route path="/galerie" element={<RequireAuth><Layout><GalleriePage /></Layout></RequireAuth>} />
          <Route path="/activites" element={<RequireAuth><Layout><ActivitesPage /></Layout></RequireAuth>} />
          <Route path="/activites/:id" element={<RequireAuth><Layout><ActiviteDetailPage /></Layout></RequireAuth>} />
          <Route path="/upload" element={<RequireAuth><Layout><UploadPage /></Layout></RequireAuth>} />
          <Route path="/profil" element={<RequireAuth><Layout><ProfilPage /></Layout></RequireAuth>} />
          <Route path="/media/:id" element={<RequireAuth><Layout><MediaDetailPage /></Layout></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><Layout><AdminPage /></Layout></RequireAuth>} />
          <Route path="*" element={<Navigate to="/galerie" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
