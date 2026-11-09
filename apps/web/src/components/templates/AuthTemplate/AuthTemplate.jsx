import { BrandWatermark } from '../../molecules/BrandWatermark/BrandWatermark.jsx'
import styles from './AuthTemplate.module.css'

export function AuthTemplate({ banner, children }) {
  return (
    <main className={styles.root}>
      <BrandWatermark />
      <div className={styles.card}>
        <div className={styles.banner}>{banner}</div>
        <div className={styles.content}>{children}</div>
      </div>
    </main>
  )
}
