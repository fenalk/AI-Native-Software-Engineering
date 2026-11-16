import { Icon } from '../Icon/Icon.jsx'

const TONE_CLASSES = {
  field: 'bg-field text-field-ink',
  soft: 'bg-ink-soft text-field-ink',
}

const BASE_CLASSES =
  'inline-flex items-center gap-2 rounded px-2 py-1 text-lg leading-normal'

/**
 * Small pill used by post cards and the feed filter. Interactive tags render a
 * button with `aria-pressed`; selected filter tags also show a close icon.
 */
export function Tag({
  children,
  className = '',
  onClick,
  pressed = false,
  removeLabel,
  tone = 'field',
}) {
  const classes = [
    BASE_CLASSES,
    TONE_CLASSES[tone] ?? TONE_CLASSES.field,
    onClick
      ? 'cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'
      : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  if (!onClick) {
    return <span className={classes}>{children}</span>
  }

  return (
    <button
      type="button"
      className={classes}
      onClick={onClick}
      aria-pressed={pressed}
      aria-label={pressed && removeLabel ? removeLabel : undefined}
    >
      {children}
      {pressed ? <Icon name="close" size="xs" /> : null}
    </button>
  )
}
