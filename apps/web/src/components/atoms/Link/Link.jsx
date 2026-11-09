import styles from './Link.module.css'

export function Link({
  children,
  className = '',
  href = '#',
  variant = 'subtle',
}) {
  return (
    <a
      href={href}
      className={[styles.root, styles[variant], className]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </a>
  )
}
