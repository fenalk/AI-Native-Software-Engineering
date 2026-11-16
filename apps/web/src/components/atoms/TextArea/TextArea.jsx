const TONE_CLASSES = {
  field:
    'bg-field text-field-ink placeholder:text-field-ink placeholder:opacity-100 hover:bg-field-hover',
  surface:
    'bg-surface text-ink-soft placeholder:text-muted hover:bg-surface-soft',
}

export function TextArea({
  className = '',
  describedBy,
  id,
  invalid = false,
  mono = true,
  name,
  onChange,
  placeholder,
  required = false,
  rows = 6,
  tone = 'field',
  value,
}) {
  return (
    <textarea
      id={id}
      name={name}
      rows={rows}
      className={[
        'w-full resize-y rounded border-0 px-4 py-3 text-sm leading-normal transition-colors focus:outline-2 focus:outline-offset-2 focus:outline-accent',
        mono ? 'font-mono' : 'font-sans',
        TONE_CLASSES[tone] ?? TONE_CLASSES.field,
        invalid ? 'outline-2 outline-offset-2 outline-danger' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
    />
  )
}
