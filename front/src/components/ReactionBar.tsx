import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getReactions, toggleReaction, type ReactionGroup } from '@/api/media'
import { useAuthStore } from '@/stores/authStore'
import { useState } from 'react'
import { Plus } from 'lucide-react'

const EMOJI_PICKER = ['❤️', '😂', '😮', '👍', '👎', '🔥', '🎉', '😍', '😢', '💪']

interface Props {
  mediaId: string
}

export function ReactionBar({ mediaId }: Props) {
  const user = useAuthStore(s => s.user)
  const qc = useQueryClient()
  const [showPicker, setShowPicker] = useState(false)

  const { data: reactions = [] } = useQuery<ReactionGroup[]>({
    queryKey: ['reactions', mediaId],
    queryFn: () => getReactions(mediaId),
  })

  const mutation = useMutation({
    mutationFn: (emoji: string) => toggleReaction(mediaId, emoji),
    onSuccess: data => {
      qc.setQueryData(['reactions', mediaId], data)
      setShowPicker(false)
    },
  })

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {reactions.map(r => (
          <button
            key={r.emoji}
            onClick={() => user && mutation.mutate(r.emoji)}
            title={r.users.map(u => u.authorName).join(', ')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border transition-colors
              ${r.mine
                ? 'bg-primary/15 border-primary text-primary font-medium'
                : 'bg-card border-border hover:bg-accent'
              }`}
          >
            <span>{r.emoji}</span>
            <span className="text-xs">{r.count}</span>
          </button>
        ))}

        {user && (
          <div className="relative">
            <button
              onClick={() => setShowPicker(v => !v)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-sm border border-dashed border-border hover:bg-accent text-muted-foreground"
            >
              <Plus className="w-3 h-3" />
            </button>
            {showPicker && (
              <div className="absolute bottom-full left-0 mb-1 z-10 bg-card border border-border rounded-xl p-2 shadow-lg flex flex-wrap gap-1 w-48">
                {EMOJI_PICKER.map(e => (
                  <button
                    key={e}
                    onClick={() => mutation.mutate(e)}
                    className="text-xl hover:scale-125 transition-transform p-0.5 rounded"
                  >
                    {e}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
