import { useState } from 'react'

function initialsOf(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? '')
    .join('')
    .toUpperCase()
}

/**
 * 32px avatar. Falls back to initials when the user has no avatar or the image
 * fails to load, so author rows never collapse.
 */
export function Avatar({ src, name, className = '', tone = 'field' }) {
  const [failed, setFailed] = useState(false)

  const toneClasses =
    tone === 'soft'
      ? 'bg-ink-soft text-field-ink'
      : 'bg-field text-field-ink'

  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        width="32"
        height="32"
        loading="lazy"
        onError={() => setFailed(true)}
        className={['size-8 shrink-0 rounded-full object-cover', className]
          .filter(Boolean)
          .join(' ')}
      />
    )
  }

  return (
    <span
      aria-hidden="true"
      className={[
        'grid size-8 shrink-0 place-items-center rounded-full text-xs font-semibold',
        toneClasses,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {initialsOf(name) || '?'}
    </span>
  )
}
