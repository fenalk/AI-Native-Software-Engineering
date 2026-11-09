import { TextInput } from '../../atoms/TextInput/TextInput.jsx'
import styles from './FormField.module.css'

export function FormField({
  autoComplete,
  id,
  label,
  name,
  onChange,
  placeholder,
  required = false,
  type = 'text',
  value,
}) {
  return (
    <div className={styles.root}>
      <label className={styles.label} htmlFor={id}>
        {label}
      </label>
      <TextInput
        id={id}
        name={name ?? id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
        required={required}
      />
    </div>
  )
}
