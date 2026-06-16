import type { Media } from '@/api/media'
import { MediaCard } from './MediaCard'

interface Props {
  media: Media[]
  onEdit?: (m: Media) => void
  onDelete?: (m: Media) => void
  onClick?: (m: Media) => void
}

export function MediaGrid({ media, onEdit, onDelete, onClick }: Props) {
  if (media.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
        <p className="text-lg">Aucun média</p>
        <p className="text-sm">Commencez par uploader des photos ou vidéos.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
      {media.map(m => (
        <MediaCard key={m.id} media={m} onEdit={onEdit} onDelete={onDelete} onClick={onClick} />
      ))}
    </div>
  )
}
