import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Mountain, Images, Compass, Upload, User, Shield, Sun, Moon, LogOut } from 'lucide-react'
import { useAuthStore, useIsAdmin } from '@/stores/authStore'
import { useThemeStore } from '@/stores/themeStore'
import { usePermission } from '@/hooks/usePermission'
import { logout } from '@/api/auth'
import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

const navItems = [
  { to: '/galerie',   label: 'Galerie',    icon: Images,   permission: null },
  { to: '/activites', label: 'Activités',  icon: Compass,  permission: null },
  { to: '/upload',    label: 'Upload',     icon: Upload,   permission: 'media.upload' },
  { to: '/profil',    label: 'Profil',     icon: User,     permission: null },
  { to: '/admin',     label: 'Admin',      icon: Shield,   admin: true },
]

export function Layout({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { theme, toggle } = useThemeStore()
  const isAdmin = useIsAdmin()
  const canUpload = usePermission('media.upload')
  const user = useAuthStore(s => s.user)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const visibleItems = navItems.filter(item => {
    if (item.admin) return isAdmin
    if (item.permission === 'media.upload') return canUpload
    return true
  })

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top bar */}
      <header className="border-b border-border px-4 py-3 flex items-center justify-between sticky top-0 z-40 bg-background/80 backdrop-blur">
        <Link to="/galerie" className="flex items-center gap-2 font-bold text-primary">
          <Mountain className="w-5 h-5" />
          RandoHost
        </Link>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:block">{user?.pseudo}</span>
          <button onClick={toggle} className="p-2 rounded-lg hover:bg-accent">
            {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-accent text-muted-foreground hover:text-destructive">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar desktop */}
        <nav className="hidden md:flex flex-col w-56 border-r border-border p-3 gap-1 sticky top-14 h-[calc(100vh-3.5rem)]">
          {visibleItems.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                location.pathname.startsWith(to)
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
            </Link>
          ))}
        </nav>

        {/* Main */}
        <main className="flex-1 p-4 md:p-6 pb-24 md:pb-6">{children}</main>
      </div>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 border-t border-border bg-background flex justify-around py-2 z-40">
        {visibleItems.map(({ to, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className={cn(
              'flex flex-col items-center p-2 rounded-lg',
              location.pathname.startsWith(to) ? 'text-primary' : 'text-muted-foreground'
            )}
          >
            <Icon className="w-5 h-5" />
          </Link>
        ))}
      </nav>
    </div>
  )
}
