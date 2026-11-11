import styles from './AuthBanner.module.css'

const LOGO_SRC = '/logo-code-connect.svg'

export function AuthBanner({ src, alt, logo = true }) {
  return (
    <figure className={styles.root}>
      <img className={styles.image} src={src} alt={alt} />
      {logo ? (
        <img
          className={styles.logo}
          src={LOGO_SRC}
          alt="Code Connect"
          width="128"
          height="40"
        />
      ) : null}
    </figure>
  )
}
