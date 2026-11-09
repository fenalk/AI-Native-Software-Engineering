import styles from './AuthHeader.module.css'

export function AuthHeader({ title, description }) {
  return (
    <header className={styles.root}>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.description}>{description}</p>
    </header>
  )
}
