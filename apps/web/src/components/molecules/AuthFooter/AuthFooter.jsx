import { Link } from '../../atoms/Link/Link.jsx'
import styles from './AuthFooter.module.css'

export function AuthFooter({ question, linkLabel, linkHref, icon }) {
  return (
    <p className={styles.root}>
      <span className={styles.question}>{question}</span>
      <Link href={linkHref} variant="accent">
        {linkLabel}
        {icon}
      </Link>
    </p>
  )
}
