import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getMediaById, updateMedia, deleteMedia } from '@/api/media'
import { ArrowLeft, MapPin, Calendar, Ruler, Pencil, Trash2, Check, X } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'
import { usePermission } from '@/hooks/usePermission'
import { AvatarBadge } from '@/components/AvatarBadge'
import { CommentSection } from '@/components/CommentSection'
import { ReactionBar } from '@/components/ReactionBar'

export function MediaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [description, setDescription] = useState('')
  const [lieu, setLieu] = useState('')

  const canEdit = usePermission('media.edit_any') || usePermission('media.edit_own')
  const canDelete = usePermission('media.delete_any') || usePermission('media.delete_own')

  const { data: media, isLoading } = useQuery({
    queryKey: ['media', id],
    queryFn: () => getMediaById(id!),
    enabled: !!id,
  })

  const updateMutation = useMutation({
    mutationFn: (payload: { description?: string; lieu?: string }) => updateMedia(id!, payload),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['media', id] }); setEditing(false) },
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteMedia(id!),
    onSuccess: () => navigate('/galerie'),
  })

  if (isLoading) return <div className="text-center p-12 text-muted-foreground">Chargement…</div>
  if (!media) return <div className="text-center p-12 text-muted-foreground">Média introuvable.</div>

  const startEdit = () => {
    setDescription(media.description ?? '')
    setLieu(media.lieu ?? '')
    setEditing(true)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button onClick={() => navigate('/galerie')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Retour à la galerie
        </button>
        <div className="flex gap-2">
          {canEdit && !editing && (
            <button onClick={startEdit} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent">
              <Pencil className="w-4 h-4" /> Modifier
            </button>
          )}
          {canDelete && (
            <button
              onClick={() => { if (confirm(`Supprimer "${media.filename}" ?`)) deleteMutation.mutate() }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-destructive/50 text-destructive text-sm hover:bg-destructive/10"
            >
              <Trash2 className="w-4 h-4" /> Supprimer
            </button>
          )}
        </div>
      </div>

      {/* Media viewer */}
      <div className="rounded-xl overflow-hidden bg-black flex items-center justify-center max-h-[70vh]">
        {media.type === 'Photo' ? (
          <img src={media.url} alt={media.filename} className="max-h-[70vh] max-w-full object-contain" />
        ) : (
          <video src={media.url} controls className="max-h-[70vh] max-w-full" />
        )}
      </div>

      {/* Metadata */}
      <div className="space-y-4">
        <h1 className="text-xl font-semibold">{media.filename}</h1>

        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
          {media.takenAt && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" /> {formatDate(media.takenAt)}
            </span>
          )}
          {media.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" /> {media.location.y.toFixed(5)}, {media.location.x.toFixed(5)}
            </span>
          )}
          {media.width && media.height && (
            <span className="flex items-center gap-1">
              <Ruler className="w-4 h-4" /> {media.width} × {media.height}
            </span>
          )}
          <span className="flex items-center gap-1">
            {(media.sizeBytes / 1024 / 1024).toFixed(1)} Mo
          </span>
        </div>

        {/* Uploader */}
        {media.uploadedByName && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <AvatarBadge name={media.uploadedByName} avatarUrl={media.uploadedByAvatar} size="sm" />
            <span>Ajouté par <span className="font-medium text-foreground">{media.uploadedByName}</span></span>
          </div>
        )}

        {editing ? (
          <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
            <div>
              <label className="block text-sm font-medium mb-1">Lieu</label>
              <input
                value={lieu}
                onChange={e => setLieu(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                placeholder="Ex : Mont Blanc"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Description</label>
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                placeholder="Description…"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => updateMutation.mutate({ description, lieu })}
                disabled={updateMutation.isPending}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
              >
                <Check className="w-4 h-4" /> Enregistrer
              </button>
              <button onClick={() => setEditing(false)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent">
                <X className="w-4 h-4" /> Annuler
              </button>
            </div>
          </div>
        ) : (
          <>
            {media.lieu && <p className="text-sm"><span className="font-medium">Lieu :</span> {media.lieu}</p>}
            {media.description && <p className="text-sm text-muted-foreground">{media.description}</p>}
          </>
        )}
      </div>

      {/* Reactions */}
      <div className="border-t border-border pt-4">
        <ReactionBar mediaId={id!} />
      </div>

      {/* Comments */}
      <div className="border-t border-border pt-4">
        <CommentSection mediaId={id!} />
      </div>
    </div>
  )
}
