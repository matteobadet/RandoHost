import { Play, MapPin, Pencil, Trash2 } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Media } from '@/api/media'
import { usePermission } from '@/hooks/usePermission'
import { AvatarBadge } from './AvatarBadge'

interface Props {
  media: Media
  onEdit?: (media: Media) => void
  onDelete?: (media: Media) => void
  onClick?: (media: Media) => void
}

export function MediaCard({ media, onEdit, onDelete, onClick }: Props) {
  const canEdit = usePermission('media.edit_any') || usePermission('media.edit_own')
  const canDelete = usePermission('media.delete_any') || usePermission('media.delete_own')

  return (
    <div
      className="group relative overflow-hidden rounded-lg bg-card cursor-pointer aspect-square"
      onClick={() => onClick?.(media)}
    >
      {media.type === 'Photo' ? (
        <img
          src={media.url}
          alt={media.filename}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full bg-muted flex items-center justify-center">
          <Play className="w-12 h-12 text-muted-foreground" />
        </div>
      )}

      {/* Overlay au hover */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200">
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-full group-hover:translate-y-0 transition-transform duration-200">
          <p className="text-white text-xs truncate">{media.filename}</p>
          {media.takenAt && (
            <p className="text-white/70 text-xs">{formatDate(media.takenAt)}</p>
          )}
        </div>

        {/* Uploader badge (bottom-left, on hover) */}
        {media.uploadedByName && (
          <div className="absolute bottom-8 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex items-center gap-1.5 bg-black/70 rounded-full px-2 py-1">
              <AvatarBadge name={media.uploadedByName} avatarUrl={media.uploadedByAvatar} size="sm" />
              <span className="text-white text-xs whitespace-nowrap">{media.uploadedByName}</span>
            </div>
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {media.location && (
            <span className="bg-black/60 rounded p-1">
              <MapPin className="w-3 h-3 text-white" />
            </span>
          )}
          {canEdit && (
            <button
              onClick={e => { e.stopPropagation(); onEdit?.(media) }}
              className="bg-black/60 rounded p-1 hover:bg-primary/80"
            >
              <Pencil className="w-3 h-3 text-white" />
            </button>
          )}
          {canDelete && (
            <button
              onClick={e => { e.stopPropagation(); onDelete?.(media) }}
              className="bg-black/60 rounded p-1 hover:bg-destructive/80"
            >
              <Trash2 className="w-3 h-3 text-white" />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
