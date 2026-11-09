import styles from './SocialButton.module.css'

export function SocialButton({ href = '#', icon, label }) {
  return (
    <a href={href} className={styles.root}>
      <span className={styles.icon}>
        <img className={styles.image} src={icon} alt="" width="30" height="30" />
      </span>
      <span className={styles.label}>{label}</span>
    </a>
  )
}
