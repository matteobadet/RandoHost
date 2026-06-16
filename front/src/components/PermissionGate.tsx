import { usePermission } from '@/hooks/usePermission'
import type { ReactNode } from 'react'

interface Props {
  permission: string
  fallback?: ReactNode
  children: ReactNode
}

export function PermissionGate({ permission, fallback = null, children }: Props) {
  const allowed = usePermission(permission)
  return allowed ? <>{children}</> : <>{fallback}</>
}
