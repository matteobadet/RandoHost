import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getComments, addComment, deleteComment, type Comment } from '@/api/media'
import { useAuthStore } from '@/stores/authStore'
import { AvatarBadge } from './AvatarBadge'
import { formatDate } from '@/lib/utils'
import { Trash2 } from 'lucide-react'
import { useState } from 'react'

interface Props {
  mediaId: string
}

export function CommentSection({ mediaId }: Props) {
  const user = useAuthStore(s => s.user)
  const qc = useQueryClient()
  const [draft, setDraft] = useState('')

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ['comments', mediaId],
    queryFn: () => getComments(mediaId),
  })

  const addMutation = useMutation({
    mutationFn: (content: string) => addComment(mediaId, content),
    onSuccess: c => {
      qc.setQueryData<Comment[]>(['comments', mediaId], prev => [...(prev ?? []), c])
      setDraft('')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (commentId: string) => deleteComment(mediaId, commentId),
    onSuccess: (_, commentId) => {
      qc.setQueryData<Comment[]>(['comments', mediaId], prev => prev?.filter(c => c.id !== commentId))
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = draft.trim()
    if (trimmed) addMutation.mutate(trimmed)
  }

  return (
    <div className="space-y-3">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
        Commentaires ({comments.length})
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-muted-foreground italic">Aucun commentaire pour l'instant.</p>
      )}

      <div className="space-y-3">
        {comments.map(c => (
          <div key={c.id} className="flex gap-2.5 group">
            <AvatarBadge name={c.authorName} avatarUrl={c.authorAvatar} size="sm" className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{c.authorName}</span>
                <span className="text-xs text-muted-foreground">{formatDate(c.createdAt)}</span>
                {user && user.id === c.authorId && (
                  <button
                    onClick={() => deleteMutation.mutate(c.id)}
                    className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
              <p className="text-sm mt-0.5 break-words">{c.content}</p>
            </div>
          </div>
        ))}
      </div>

      {user && (
        <form onSubmit={handleSubmit} className="flex gap-2 pt-1">
          <AvatarBadge name={user.pseudo} avatarUrl={user.avatarUrl} size="sm" className="mt-1.5 shrink-0" />
          <div className="flex-1 flex gap-2">
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Ajouter un commentaire…"
              className="flex-1 text-sm px-3 py-1.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
              maxLength={500}
            />
            <button
              type="submit"
              disabled={!draft.trim() || addMutation.isPending}
              className="px-3 py-1.5 text-sm rounded-lg bg-primary text-primary-foreground disabled:opacity-50 hover:opacity-90"
            >
              Envoyer
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
