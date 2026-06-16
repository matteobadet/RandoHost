import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getAllUsers, setUserRole, setUserPermissions, setUserActive, deleteUser } from '@/api/admin'
import { Shield, UserX, UserCheck, Trash2, ChevronDown, Search } from 'lucide-react'
import { useState, useEffect, useMemo } from 'react'
import { formatDate } from '@/lib/utils'
import { useIsAdmin } from '@/stores/authStore'
import { useNavigate } from 'react-router-dom'

const ALL_PERMISSIONS = [
  'media.view', 'media.upload', 'media.edit_own', 'media.delete_own',
  'media.edit_any', 'media.delete_any', 'album.manage', 'user.manage',
]

const ROLES = [
  { id: 1, label: 'Admin' },
  { id: 2, label: 'Contributor' },
  { id: 3, label: 'ReadOnly' },
]

const ROLE_DISPLAY: Record<string, string> = {
  Admin: 'Admin',
  Contributor: 'Contributeur',
  ReadOnly: 'Lecture seule',
}

const PAGE_SIZE = 8

export function AdminPage() {
  const isAdmin = useIsAdmin()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!isAdmin) navigate('/galerie')
  }, [isAdmin, navigate])

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: getAllUsers,
    enabled: isAdmin,
  })

  const roleMutation = useMutation({
    mutationFn: ({ id, roleId }: { id: string; roleId: number }) => setUserRole(id, roleId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const permMutation = useMutation({
    mutationFn: ({ id, extra, revoked }: { id: string; extra: string[]; revoked: string[] }) =>
      setUserPermissions(id, extra, revoked),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const activeMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => setUserActive(id, isActive),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); setExpanded(null) },
  })

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim()
    if (!q) return users
    return users.filter(u =>
      u.pseudo.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)
    )
  }, [users, search])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const safePage = Math.min(page, totalPages)
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE)

  // Reset page on search change
  useEffect(() => { setPage(1) }, [search])

  if (!isAdmin) return null
  if (isLoading) return <div className="text-center p-12 text-muted-foreground">Chargement…</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Shield className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold">Panel Admin</h1>
        <span className="ml-auto text-sm text-muted-foreground">{users.length} utilisateur(s)</span>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Rechercher par nom ou email…"
          className="w-full pl-9 pr-4 py-2 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* User list */}
      <div className="space-y-2">
        {paged.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Aucun utilisateur trouvé.</p>
        )}
        {paged.map(user => {
          const extra = user.extraPermissions ?? []
          const revoked = user.revokedPermissions ?? []

          return (
            <div key={user.id} className="rounded-xl border border-border bg-card overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-accent/50 transition-colors"
                onClick={() => setExpanded(expanded === user.id ? null : user.id)}
              >
                <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                  {user.pseudo.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium">{user.pseudo}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {user.email} · {ROLE_DISPLAY[user.role] ?? user.role}
                    {user.lastLoginAt && ` · Dernière connexion ${formatDate(user.lastLoginAt)}`}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-xs ${user.isActive ? 'bg-green-500/10 text-green-600' : 'bg-destructive/10 text-destructive'}`}>
                    {user.isActive ? 'Actif' : 'Désactivé'}
                  </span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${expanded === user.id ? 'rotate-180' : ''}`} />
                </div>
              </button>

              {expanded === user.id && (
                <div className="border-t border-border p-4 space-y-4">
                  {/* Info */}
                  <div className="text-xs text-muted-foreground grid grid-cols-2 gap-1">
                    <span>Créé le {formatDate(user.createdAt)}</span>
                    {user.lastLoginAt && <span>Connecté le {formatDate(user.lastLoginAt)}</span>}
                  </div>

                  {/* Rôle */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Rôle</label>
                    <div className="flex gap-2">
                      {ROLES.map(r => (
                        <button
                          key={r.id}
                          onClick={() => roleMutation.mutate({ id: user.id, roleId: r.id })}
                          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                            user.role === r.label
                              ? 'bg-primary text-primary-foreground border-primary'
                              : 'border-border hover:bg-accent'
                          }`}
                        >
                          {ROLE_DISPLAY[r.label]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Permissions */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Permissions</label>
                    <div className="flex flex-wrap gap-2">
                      {ALL_PERMISSIONS.map(p => {
                        const isEffective = user.permissions.includes(p)
                        const isExtra = extra.includes(p)
                        const isRevoked = revoked.includes(p)

                        const toggle = () => {
                          const newExtra = isExtra
                            ? extra.filter(x => x !== p)
                            : isEffective ? extra : [...extra, p]
                          const newRevoked = isRevoked
                            ? revoked.filter(x => x !== p)
                            : isEffective ? [...revoked, p] : revoked
                          permMutation.mutate({ id: user.id, extra: newExtra, revoked: newRevoked })
                        }

                        return (
                          <button
                            key={p}
                            onClick={toggle}
                            title={isRevoked ? 'Révoquée' : isExtra ? 'Ajoutée manuellement' : isEffective ? 'Du rôle (cliquer pour révoquer)' : 'Inactive (cliquer pour ajouter)'}
                            className={`px-2 py-1 rounded-full text-xs font-mono transition-colors ${
                              isRevoked ? 'bg-destructive/20 text-destructive line-through' :
                              isExtra ? 'bg-green-500/20 text-green-600 ring-1 ring-green-500/40' :
                              isEffective ? 'bg-primary/10 text-primary' :
                              'bg-muted text-muted-foreground'
                            }`}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5">
                      <span className="inline-block w-3 h-3 rounded-full bg-primary/20 mr-1" />du rôle
                      <span className="inline-block w-3 h-3 rounded-full bg-green-500/20 mx-1 ml-3" />ajoutée
                      <span className="inline-block w-3 h-3 rounded-full bg-destructive/20 mx-1 ml-3" />révoquée
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-border">
                    <button
                      onClick={() => activeMutation.mutate({ id: user.id, isActive: !user.isActive })}
                      disabled={activeMutation.isPending}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-50"
                    >
                      {user.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                      {user.isActive ? 'Désactiver' : 'Réactiver'}
                    </button>
                    <button
                      onClick={() => { if (confirm(`Supprimer définitivement ${user.pseudo} ?`)) deleteMutation.mutate(user.id) }}
                      disabled={deleteMutation.isPending}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-destructive/50 text-destructive text-sm hover:bg-destructive/10 disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                      Supprimer
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-40"
          >
            ← Précédent
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className={`w-8 h-8 rounded-lg text-sm border transition-colors ${
                n === safePage ? 'bg-primary text-primary-foreground border-primary' : 'border-border hover:bg-accent'
              }`}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent disabled:opacity-40"
          >
            Suivant →
          </button>
        </div>
      )}
    </div>
  )
}
