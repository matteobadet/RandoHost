import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { getActiviteById, addMediaToActivite, removeMediaFromActivite } from '@/api/activites'
import { getMedia } from '@/api/media'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { MediaGrid } from '@/components/MediaGrid'
import { PermissionGate } from '@/components/PermissionGate'
import { MapPin, Plus, ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useState } from 'react'
import 'leaflet/dist/leaflet.css'

export function ActiviteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [showAddMedia, setShowAddMedia] = useState(false)

  const { data: activite, isLoading } = useQuery({
    queryKey: ['activite', id],
    queryFn: () => getActiviteById(id!),
    enabled: !!id,
  })

  const { data: allMedia = [] } = useQuery({
    queryKey: ['media', 1],
    queryFn: () => getMedia(1, 100),
    enabled: showAddMedia,
  })

  const addMutation = useMutation({
    mutationFn: (mediaId: string) => addMediaToActivite(id!, mediaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activite', id] }),
  })

  const removeMutation = useMutation({
    mutationFn: (mediaId: string) => removeMediaFromActivite(id!, mediaId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['activite', id] }),
  })

  if (isLoading || !activite) return <div className="text-muted-foreground text-center p-12">Chargement…</div>

  const mediaWithGps = (activite.albumMedia ?? [])
    .map(am => am.media)
    .filter(m => m.location)

  const existingIds = new Set((activite.albumMedia ?? []).map(am => am.media.id))
  const mediaToAdd = allMedia.filter(m => !existingIds.has(m.id))

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate('/activites')} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4" /> Retour aux activités
      </button>

      <div>
        <h1 className="text-3xl font-bold">{activite.name}</h1>
        <div className="flex items-center gap-3 mt-1 text-muted-foreground text-sm">
          {activite.lieu && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{activite.lieu}</span>}
          {activite.date && <span>{formatDate(activite.date)}</span>}
        </div>
        {activite.description && <p className="mt-3 text-sm">{activite.description}</p>}
      </div>

      {/* Carte si médias avec GPS */}
      {mediaWithGps.length > 0 && (
        <div className="rounded-xl overflow-hidden border border-border h-64">
          <MapContainer
            center={[mediaWithGps[0].location!.y, mediaWithGps[0].location!.x]}
            zoom={12}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            {mediaWithGps.map(m => (
              <Marker key={m.id} position={[m.location!.y, m.location!.x]}>
                <Popup>{m.filename}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      )}

      {/* Médias de l'activité */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Médias ({activite.albumMedia?.length ?? 0})</h2>
          <PermissionGate permission="media.upload">
            <button
              onClick={() => setShowAddMedia(v => !v)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-border text-sm hover:bg-accent"
            >
              <Plus className="w-3 h-3" /> Ajouter des médias
            </button>
          </PermissionGate>
        </div>

        {showAddMedia && mediaToAdd.length > 0 && (
          <div className="p-3 rounded-xl border border-dashed border-border">
            <p className="text-sm text-muted-foreground mb-3">Cliquez sur un média pour l'ajouter :</p>
            <MediaGrid
              media={mediaToAdd}
              onClick={m => addMutation.mutate(m.id)}
            />
          </div>
        )}

        <MediaGrid
          media={(activite.albumMedia ?? []).map(am => am.media)}
          onClick={m => navigate(`/media/${m.id}`)}
          onDelete={m => removeMutation.mutate(m.id)}
        />
      </div>
    </div>
  )
}
