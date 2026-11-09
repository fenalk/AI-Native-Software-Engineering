import styles from './Button.module.css'

export function Button({
  children,
  className = '',
  disabled = false,
  fullWidth = false,
  iconRight = null,
  onClick,
  type = 'button',
  variant = 'primary',
}) {
  const classes = [
    styles.root,
    styles[variant],
    fullWidth ? styles.fullWidth : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      <span className={styles.content}>{children}</span>
      {iconRight ? (
        <span className={styles.iconRight} aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </button>
  )
}
