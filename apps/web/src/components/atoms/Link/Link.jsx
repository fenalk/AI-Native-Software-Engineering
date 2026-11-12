const BASE_CLASSES =
  'no-underline transition-colors focus-visible:rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-accent'

const VARIANT_CLASSES = {
  subtle: 'text-sm text-muted hover:text-ink',
  accent: 'inline-flex items-center gap-3 text-lg text-accent hover:text-accent-hover',
}

export function Link({
  children,
  className = '',
  href = '#',
  variant = 'subtle',
}) {
  return (
    <a
      href={href}
      className={[BASE_CLASSES, VARIANT_CLASSES[variant], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </a>
  )
}
