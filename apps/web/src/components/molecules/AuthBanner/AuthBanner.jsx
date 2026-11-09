import styles from './AuthBanner.module.css'

export function AuthBanner({ src, alt }) {
  return (
    <figure className={styles.root}>
      <img className={styles.image} src={src} alt={alt} />
    </figure>
  )
}
