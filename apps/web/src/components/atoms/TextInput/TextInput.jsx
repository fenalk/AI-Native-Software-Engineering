import styles from './TextInput.module.css'

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
      className={[styles.root, className].filter(Boolean).join(' ')}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      autoComplete={autoComplete}
      required={required}
    />
  )
}
