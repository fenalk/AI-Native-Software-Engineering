import { useState } from 'react'
import { Avatar } from '../../atoms/Avatar/Avatar.jsx'
import { Icon } from '../../atoms/Icon/Icon.jsx'

const ACTION_CLASSES =
  'flex cursor-pointer flex-col items-center gap-0.5 rounded text-muted transition-colors hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

/**
 * Like, share and comment counts plus the post author. Guests still see the
 * controls; the page decides whether to send them to the login.
 */
export function PostActions({ onLike, post }) {
  const [copied, setCopied] = useState(false)

  async function handleShare() {
    const url = `${window.location.origin}/posts/${post.id}`

    try {
      if (navigator.share) {
        await navigator.share({ title: post.title, url })
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(url)
      }

      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          className={[ACTION_CLASSES, post.likedByMe ? 'text-accent' : ''].join(
            ' ',
          )}
          onClick={() => onLike?.(post)}
          aria-pressed={post.likedByMe}
          aria-label={
            post.likedByMe ? 'Remover curtida' : 'Curtir post'
          }
        >
          <Icon
            name={post.likedByMe ? 'favorite' : 'favorite_border'}
            className="text-2xl"
          />
          <span className="text-sm leading-normal">{post.likesCount}</span>
        </button>

        <button
          type="button"
          className={ACTION_CLASSES}
          onClick={handleShare}
          aria-label="Compartilhar post"
        >
          <Icon name="share" className="text-2xl" />
          <span className="text-sm leading-normal" aria-live="polite">
            {copied ? 'Copiado' : ''}
          </span>
        </button>

        <a
          href={`/posts/${post.id}#comentarios`}
          className={ACTION_CLASSES}
          aria-label="Comentários do post"
        >
          <Icon name="chat" className="text-2xl" />
          <span className="text-sm leading-normal">{post.commentsCount}</span>
        </a>
      </div>

      <div className="flex items-center gap-2">
        <Avatar src={post.author.avatarUrl} name={post.author.name} />
        <span className="text-sm font-semibold leading-normal text-muted">
          @{post.author.username}
        </span>
      </div>
    </div>
  )
}
