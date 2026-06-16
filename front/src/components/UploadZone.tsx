import { useRef, useState, useCallback } from 'react'
import { Upload, Camera, Image } from 'lucide-react'
import { useCamera } from '@/hooks/useCamera'
import { cn } from '@/lib/utils'

interface Props {
  onFiles: (files: File[]) => void
  accept?: string
  multiple?: boolean
  className?: string
}

export function UploadZone({ onFiles, accept = 'image/*,video/*', multiple = true, className }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const { isNative, pickFromGallery, takePhoto } = useCamera()

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }, [onFiles])

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFiles(files)
    e.target.value = ''
  }

  const handleGallery = async () => {
    if (isNative) {
      const f = await pickFromGallery()
      if (f) onFiles([f])
    } else {
      inputRef.current?.click()
    }
  }

  const handleCamera = async () => {
    const f = await takePhoto()
    if (f) onFiles([f])
  }

  return (
    <div
      className={cn(
        'border-2 border-dashed rounded-xl p-8 text-center transition-colors',
        dragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/60',
        className
      )}
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
    >
      <input ref={inputRef} type="file" accept={accept} multiple={multiple} className="hidden" onChange={handleInput} />

      <Upload className="mx-auto w-10 h-10 text-muted-foreground mb-3" />
      <p className="text-sm text-muted-foreground mb-4">
        Glissez vos fichiers ici ou choisissez une source
      </p>

      <div className="flex justify-center gap-3">
        <button
          onClick={handleGallery}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90"
        >
          <Image className="w-4 h-4" />
          Galerie
        </button>

        {isNative && (
          <button
            onClick={handleCamera}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-secondary-foreground text-sm hover:bg-secondary/80"
          >
            <Camera className="w-4 h-4" />
            Appareil photo
          </button>
        )}
      </div>
    </div>
  )
}
