interface Props {
  name: string
  avatarUrl?: string
  size?: 'sm' | 'md'
  className?: string
}

export function AvatarBadge({ name, avatarUrl, size = 'sm', className = '' }: Props) {
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?'
  const dim = size === 'sm' ? 'w-6 h-6 text-xs' : 'w-8 h-8 text-sm'

  return (
    <div className={`${dim} rounded-full overflow-hidden shrink-0 bg-primary/20 flex items-center justify-center font-semibold text-primary ${className}`}>
      {avatarUrl
        ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" onError={e => { (e.target as HTMLImageElement).style.display = 'none' }} />
        : <span>{initials}</span>
      }
    </div>
  )
}
