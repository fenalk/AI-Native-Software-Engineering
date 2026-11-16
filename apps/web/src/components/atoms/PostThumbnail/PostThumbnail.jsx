import { useState } from 'react'
import { BrandMark } from '../BrandMark/BrandMark.jsx'

/**
 * Post preview image. `src` is data-supplied, so the component must survive a
 * missing value and a broken URL: both render the same placeholder.
 *
 * `priority` marks an image above the fold (the detail page): it loads eagerly
 * with a high fetch priority instead of lazily. The frame has a fixed height,
 * so the image never shifts the layout while it loads.
 */
export function PostThumbnail({
  src,
  alt = '',
  variant = 'feed',
  priority = variant === 'detail',
}) {
  const [failed, setFailed] = useState(false)
  const hasImage = Boolean(src) && !failed

  const frame =
    variant === 'detail'
      ? 'h-[320px] rounded-lg'
      : 'h-[192px] rounded-lg'

  return (
    <div className="bg-field p-6">
      <div className={`relative overflow-hidden shadow-editor ${frame}`}>
        {hasImage ? (
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            fetchPriority={priority ? 'high' : 'auto'}
            decoding="async"
            onError={() => setFailed(true)}
            className="size-full object-cover"
          />
        ) : (
          <div
            role="img"
            aria-label="Post sem imagem de prévia"
            className="flex size-full flex-col items-center justify-center gap-2 bg-surface-soft text-muted"
          >
            <BrandMark className="h-12 w-10 text-accent opacity-40" />
            <span className="text-sm leading-normal">Sem prévia</span>
          </div>
        )}
      </div>
    </div>
  )
}
