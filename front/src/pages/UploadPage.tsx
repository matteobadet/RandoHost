import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { UploadZone } from '@/components/UploadZone'
import { uploadMedia } from '@/api/media'
import { formatFileSize } from '@/lib/utils'

interface UploadItem {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  progress: number
  id?: string
}

export function UploadPage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [items, setItems] = useState<UploadItem[]>([])

  const update = (index: number, patch: Partial<UploadItem>) =>
    setItems(prev => prev.map((it, i) => i === index ? { ...it, ...patch } : it))

  const handleFiles = async (files: File[]) => {
    const newItems: UploadItem[] = files.map(file => ({ file, status: 'pending', progress: 0 }))
    setItems(prev => [...prev, ...newItems])
    const offset = items.length

    for (let i = 0; i < newItems.length; i++) {
      const idx = offset + i
      update(idx, { status: 'uploading' })
      try {
        const res = await uploadMedia(newItems[i].file, pct => update(idx, { progress: pct }))
        update(idx, { status: 'done', id: res.id, progress: 100 })
      } catch {
        update(idx, { status: 'error' })
      }
    }

    qc.invalidateQueries({ queryKey: ['media'] })
  }

  const allDone = items.length > 0 && items.every(it => it.status === 'done' || it.status === 'error')

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Uploader des médias</h1>

      <UploadZone onFiles={handleFiles} />

      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-card border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{item.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(item.file.size)}</p>
                {item.status === 'uploading' && (
                  <div className="mt-1 h-1 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary transition-all" style={{ width: `${item.progress}%` }} />
                  </div>
                )}
              </div>
              <div className="shrink-0">
                {item.status === 'uploading' && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
                {item.status === 'done' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {item.status === 'error' && <XCircle className="w-4 h-4 text-destructive" />}
              </div>
            </div>
          ))}
        </div>
      )}

      {allDone && (
        <div className="flex gap-3">
          <button onClick={() => setItems([])} className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-accent">
            Uploader d'autres fichiers
          </button>
          <button onClick={() => navigate('/galerie')} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90">
            Voir la galerie
          </button>
        </div>
      )}
    </div>
  )
}
