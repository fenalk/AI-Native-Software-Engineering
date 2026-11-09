import { BrandMark } from '../../atoms/BrandMark/BrandMark.jsx'
import styles from './BrandWatermark.module.css'

export function BrandWatermark() {
  return (
    <div className={styles.root} aria-hidden="true">
      <BrandMark className={styles.top} />
      <BrandMark className={styles.bottom} />
    </div>
  )
}
