import type { Background } from '../lib/config.ts'
import styles from './Calendar.module.css'

type CalendarProps = {
  title: string
  background: Background
}

function Calendar({ title, background }: CalendarProps) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.board}>
        <img className={styles.background} src={background.image} alt="" aria-hidden="true" />
      </div>
      <p className={styles.rotateHint}>Vänd telefonen för att se kalendern större.</p>
    </main>
  )
}

export default Calendar
