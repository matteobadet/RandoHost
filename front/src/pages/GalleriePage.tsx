import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMedia, deleteMedia, type Media } from '@/api/media'
import { MediaGrid } from '@/components/MediaGrid'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

export function GalleriePage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [page, setPage] = useState(1)

  const { data: media = [], isLoading } = useQuery({
    queryKey: ['media', page],
    queryFn: () => getMedia(page, 30),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMedia(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['media'] }),
  })

  if (isLoading) return <div className="flex justify-center p-12 text-muted-foreground">Chargement…</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Galerie</h1>
        <span className="text-sm text-muted-foreground">{media.length} médias</span>
      </div>

      <MediaGrid
        media={media}
        onClick={(m: Media) => navigate(`/media/${m.id}`)}
        onDelete={(m: Media) => {
          if (confirm(`Supprimer "${m.filename}" ?`)) deleteMutation.mutate(m.id)
        }}
        onEdit={(m: Media) => navigate(`/media/${m.id}`)}
      />

      {media.length === 30 && (
        <div className="flex justify-center gap-2 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-lg border border-border disabled:opacity-40 hover:bg-accent text-sm"
          >
            Précédent
          </button>
          <span className="px-4 py-2 text-sm text-muted-foreground">Page {page}</span>
          <button
            onClick={() => setPage(p => p + 1)}
            className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-sm"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  )
}
