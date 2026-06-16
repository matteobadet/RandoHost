import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Camera, Save } from 'lucide-react'
import { updateMe, uploadAvatar } from '@/api/auth'
import { useAuthStore } from '@/stores/authStore'

const schema = z.object({
  pseudo: z.string().min(3).optional().or(z.literal('')),
  email: z.string().email().optional().or(z.literal('')),
  password: z.string().min(8).optional().or(z.literal('')),
})
type Form = z.infer<typeof schema>

export function ProfilPage() {
  const user = useAuthStore(s => s.user)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const { register, handleSubmit, formState: { isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { pseudo: user?.pseudo, email: user?.email },
  })

  const onSubmit = async (data: Form) => {
    const payload = Object.fromEntries(Object.entries(data).filter(([, v]) => v !== ''))
    try {
      await updateMe(payload)
      setSaved(true)
      setSaveError(false)
      setTimeout(() => setSaved(false), 2000)
    } catch {
      setSaveError(true)
      setTimeout(() => setSaveError(false), 3000)
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    await uploadAvatar(file)
  }

  const initials = user?.pseudo.slice(0, 2).toUpperCase() ?? '??'

  return (
    <div className="max-w-lg mx-auto space-y-8">
      <h1 className="text-2xl font-bold">Mon profil</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden border-2 border-border">
            {avatarPreview || user?.avatarUrl
              ? <img src={avatarPreview ?? user?.avatarUrl ?? ''} alt="avatar" className="w-full h-full object-cover" />
              : <span className="text-2xl font-bold text-primary">{initials}</span>
            }
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90"
          >
            <Camera className="w-4 h-4" />
          </button>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        </div>
        <div className="text-center">
          <p className="font-semibold">{user?.pseudo}</p>
          <p className="text-sm text-muted-foreground">{user?.role}</p>
        </div>
      </div>

      {/* Permissions badge */}
      <div>
        <p className="text-sm font-medium mb-2">Mes permissions</p>
        <div className="flex flex-wrap gap-2">
          {user?.permissions.map(p => (
            <span key={p} className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-mono">{p}</span>
          ))}
        </div>
      </div>

      {/* Formulaire */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Pseudo</label>
          <input {...register('pseudo')} className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input {...register('email')} type="email" className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Nouveau mot de passe <span className="text-muted-foreground">(laisser vide pour ne pas changer)</span></label>
          <input {...register('password')} type="password" className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring text-sm" />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm hover:bg-primary/90 disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saveError ? 'Erreur !' : saved ? 'Enregistré !' : isSubmitting ? 'Sauvegarde…' : 'Sauvegarder'}
        </button>
      </form>
    </div>
  )
}
