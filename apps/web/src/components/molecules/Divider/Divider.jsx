import styles from './Divider.module.css'

export function Divider({ children }) {
  return (
    <div className={styles.root} role="separator">
      <span className={styles.line} aria-hidden="true" />
      <span className={styles.text}>{children}</span>
      <span className={styles.line} aria-hidden="true" />
    </div>
  )
}
