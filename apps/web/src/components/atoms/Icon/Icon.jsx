const SIZE_CLASSES = {
  xs: 'text-sm',
  sm: 'text-2xl',
  md: 'text-3xl',
}

/**
 * Material Icons ligature, matching the Figma components. Decorative by
 * default; pass `label` when the icon carries meaning on its own.
 */
export function Icon({ name, size = 'sm', className = '', label }) {
  return (
    <span
      className={[
        'material-icons select-none leading-none',
        SIZE_CLASSES[size] ?? SIZE_CLASSES.sm,
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      aria-hidden={label ? undefined : 'true'}
      role={label ? 'img' : undefined}
      aria-label={label}
    >
      {name}
    </span>
  )
}
