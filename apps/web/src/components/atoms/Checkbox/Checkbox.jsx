import styles from './Checkbox.module.css'

function CheckIcon() {
  return (
    <svg viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M2.5 6.2 5 8.7l4.5-5.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function Checkbox({
  checked = false,
  className = '',
  id,
  label,
  name,
  onChange,
}) {
  return (
    <label className={[styles.root, className].filter(Boolean).join(' ')}>
      <input
        id={id}
        name={name}
        type="checkbox"
        className={styles.input}
        checked={checked}
        onChange={onChange}
      />
      <span className={styles.box} aria-hidden="true">
        <CheckIcon />
      </span>
      <span className={styles.label}>{label}</span>
    </label>
  )
}
