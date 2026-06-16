import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Link } from 'react-router-dom'
import { Mountain } from 'lucide-react'
import { register as registerUser } from '@/api/auth'
import { useState } from 'react'

const schema = z.object({
  pseudo: z.string().min(3, 'Minimum 3 caractères'),
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  confirm: z.string(),
}).refine(d => d.password === d.confirm, { message: 'Les mots de passe ne correspondent pas', path: ['confirm'] })

type Form = z.infer<typeof schema>

export function RegisterPage() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<Form>({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (data: Form) => {
    try {
      setError('')
      await registerUser(data.pseudo, data.email, data.password)
      navigate('/login')
    } catch {
      setError('Pseudo ou email déjà utilisé.')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Mountain className="w-10 h-10 text-primary mb-2" />
          <h1 className="text-2xl font-bold">Créer un compte</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {[
            { name: 'pseudo' as const,   label: 'Pseudo',              type: 'text',     placeholder: 'randonneur42' },
            { name: 'email' as const,    label: 'Email',               type: 'email',    placeholder: 'alice@exemple.fr' },
            { name: 'password' as const, label: 'Mot de passe',        type: 'password', placeholder: '' },
            { name: 'confirm' as const,  label: 'Confirmer le mot de passe', type: 'password', placeholder: '' },
          ].map(({ name, label, type, placeholder }) => (
            <div key={name}>
              <label className="block text-sm font-medium mb-1">{label}</label>
              <input
                {...register(name)}
                type={type}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-ring"
              />
              {errors[name] && <p className="text-destructive text-xs mt-1">{errors[name]?.message}</p>}
            </div>
          ))}

          {error && <p className="text-destructive text-sm text-center">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Création…' : 'Créer mon compte'}
          </button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Déjà un compte ?{' '}
          <Link to="/login" className="text-primary hover:underline">Se connecter</Link>
        </p>
      </div>
    </div>
  )
}
