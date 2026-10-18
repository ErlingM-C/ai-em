import type { DoorPosition } from '../lib/doorPosition.ts'
import styles from './Door.module.css'

type DoorProps = {
  day: number
  position: DoorPosition
}

function Door({ day, position }: DoorProps) {
  return (
    <button
      type="button"
      className={styles.door}
      style={{
        left: `${position.left}%`,
        top: `${position.top}%`,
        width: `${position.width}%`,
        height: `${position.height}%`,
      }}
      aria-label={`Lucka ${day}`}
    >
      <span className={styles.number} aria-hidden="true">
        {day}
      </span>
    </button>
  )
}

export default Door
