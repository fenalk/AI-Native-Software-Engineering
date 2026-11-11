import styles from './SocialButton.module.css'

export function SocialButton({ href = '#', icon, iconSize = 'md', label }) {
  return (
    <a href={href} className={styles.root}>
      <span className={styles.icon}>
        <img
          className={[styles.image, styles[iconSize]].filter(Boolean).join(' ')}
          src={icon}
          alt=""
        />
      </span>
      <span className={styles.label}>{label}</span>
    </a>
  )
}
