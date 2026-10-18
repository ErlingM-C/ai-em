import type { CSSProperties } from 'react'
import type { Background, Door as DoorData } from '../lib/config.ts'
import { doorPosition } from '../lib/doorPosition.ts'
import Door from './Door.tsx'
import styles from './Calendar.module.css'

export type DoorView = {
  door: DoorData
  isOpen: boolean
  isOpenable: boolean
}

type CalendarProps = {
  title: string
  background: Background
  doors: DoorView[]
  message: string | null
  onDoorClick: (day: number) => void
  onPhotoClick: (day: number, origin: HTMLElement) => void
}

/** Kalenderytan får bakgrundens proportioner och blir så stor som får plats på skärmen. */
function boardStyle(background: Background): CSSProperties {
  const ratio = background.width / background.height
  return {
    aspectRatio: `${background.width} / ${background.height}`,
    width: `min(100%, calc((100dvh - 5rem) * ${ratio}))`,
  }
}

function Calendar({ title, background, doors, message, onDoorClick, onPhotoClick }: CalendarProps) {
  return (
    <main className={styles.page}>
      <h1 className={styles.title}>{title}</h1>
      <div className={styles.board} style={boardStyle(background)}>
        <img className={styles.background} src={background.image} alt="" aria-hidden="true" />
        {doors.map(({ door, isOpen, isOpenable }) => (
          <Door
            key={door.day}
            day={door.day}
            position={doorPosition(door, background)}
            backgroundImage={background.image}
            image={door.image}
            alt={door.alt}
            isOpen={isOpen}
            isOpenable={isOpenable}
            onDoorClick={onDoorClick}
            onPhotoClick={onPhotoClick}
          />
        ))}
      </div>
      <p className={styles.message} role="status">
        {message}
      </p>
      <p className={styles.rotateHint}>Vänd telefonen för att se kalendern större.</p>
    </main>
  )
}

export default Calendar
