import type { Background, Door as DoorData } from '../lib/config.ts'
import { doorPosition } from '../lib/doorPosition.ts'
import Door from './Door.tsx'
import styles from './Calendar.module.css'

type CalendarProps = {
  title: string
  background: Background
  doors: DoorData[]
}

function Calendar({ title, background, doors }: CalendarProps) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.board}>
        <img className={styles.background} src={background.image} alt="" aria-hidden="true" />
        {doors.map((door) => (
          <Door key={door.day} day={door.day} position={doorPosition(door, background)} />
        ))}
      </div>
      <p className={styles.rotateHint}>Vänd telefonen för att se kalendern större.</p>
    </main>
  )
}

export default Calendar
