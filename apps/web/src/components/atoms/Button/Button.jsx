const BASE_CLASSES =
  'inline-flex h-[51px] cursor-pointer items-center justify-center gap-2 rounded-lg border-0 px-4 py-3 text-lg font-semibold leading-normal transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-focus active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60'

const VARIANT_CLASSES = {
  primary:
    'bg-accent text-accent-ink enabled:hover:bg-accent-hover enabled:hover:shadow-accent',
}

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
    BASE_CLASSES,
    VARIANT_CLASSES[variant],
    fullWidth ? 'w-full' : '',
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
      <span className="inline-flex items-center gap-2">{children}</span>
      {iconRight ? (
        <span className="inline-flex items-center" aria-hidden="true">
          {iconRight}
        </span>
      ) : null}
    </button>
  )
}
