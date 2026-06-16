import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getActivites, createActivite, deleteActivite } from '@/api/activites'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Compass, Trash2, ChevronRight } from 'lucide-react'
import { usePermission } from '@/hooks/usePermission'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'

const schema = z.object({
  name: z.string().min(1, 'Nom requis'),
  description: z.string().optional(),
  lieu: z.string().optional(),
  date: z.string().optional(),
})
type Form = z.infer<typeof schema>

export function ActivitesPage() {
  const qc = useQueryClient()
  const isAdmin = usePermission('media.upload')
  const [showForm, setShowForm] = useState(false)

  const navigate = useNavigate()
  const { data: activites = [], isLoading } = useQuery({
    queryKey: ['activites'],
    queryFn: getActivites,
  })

  const createMutation = useMutation({
    mutationFn: createActivite,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['activites'] }); setShowForm(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteActivite,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activites'] }),
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<Form>({ resolver: zodResolver(schema) })
  const onSubmit = (data: Form) => createMutation.mutate(data)

  if (isLoading) return <div className="text-muted-foreground text-center p-12">Chargement…</div>

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Activités</h1>
        {isAdmin && (
          <button
            onClick={() => { setShowForm(v => !v); reset() }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
          >
            <Plus className="w-4 h-4" />
            Nouvelle activité
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit(onSubmit)} className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h2 className="font-semibold">Nouvelle activité</h2>
          <div>
            <input {...register('name')} placeholder="Nom de l'activité *" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
            {errors.name && <p className="text-destructive text-xs mt-1">{errors.name.message}</p>}
          </div>
          <input {...register('lieu')} placeholder="Lieu (ex : Mont Blanc, Col du Galibier…)" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <input {...register('date')} type="date" className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          <textarea {...register('description')} placeholder="Description…" rows={3} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none" />
          <div className="flex gap-2">
            <button type="submit" disabled={createMutation.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50">
              {createMutation.isPending ? 'Création…' : 'Créer'}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent">
              Annuler
            </button>
          </div>
        </form>
      )}

      {activites.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <Compass className="w-10 h-10 mb-2 opacity-40" />
          <p>Aucune activité pour l'instant.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activites.map(a => (
            <div key={a.id} onClick={() => navigate(`/activites/${a.id}`)} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors cursor-pointer">
              <Compass className="w-8 h-8 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{a.name}</p>
                <p className="text-sm text-muted-foreground">
                  {a.lieu && `${a.lieu} · `}{a.date ? formatDate(a.date) : formatDate(a.createdAt)}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {isAdmin && (
                  <button
                    onClick={e => { e.stopPropagation(); if (confirm('Supprimer cette activité ?')) deleteMutation.mutate(a.id) }}
                    className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <Link to={`/activites/${a.id}`} onClick={e => e.stopPropagation()} className="p-2 rounded-lg hover:bg-accent">
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
