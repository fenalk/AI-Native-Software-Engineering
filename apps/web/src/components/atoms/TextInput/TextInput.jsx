export function TextInput({
  autoComplete,
  className = '',
  id,
  name,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
  return (
    <input
      id={id}
      name={name}
      type={type}
      className={[
        'h-[41px] w-full rounded border-0 bg-field px-4 py-2 text-sm leading-normal text-field-ink transition-colors placeholder:text-field-ink placeholder:opacity-100 hover:bg-field-hover focus:outline-2 focus:outline-offset-2 focus:outline-accent',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
    />
  )
}
