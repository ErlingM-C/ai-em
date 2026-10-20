import { useState, type CSSProperties } from 'react'
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
    width: `min(100%, calc(100dvh * ${ratio}))`,
  }
}

function Calendar({ title, background, doors, message, onDoorClick, onPhotoClick }: CalendarProps) {
  const [backgroundFailed, setBackgroundFailed] = useState(false)

  return (
    <main className={styles.page}>
      <div className={styles.board} style={boardStyle(background)}>
        {!backgroundFailed && (
          <img
            className={styles.background}
            src={background.image}
            alt=""
            aria-hidden="true"
            onError={() => setBackgroundFailed(true)}
          />
        )}
        <h1 className={styles.title}>{title}</h1>
        {backgroundFailed && (
          <p className={styles.imageError} role="alert">
            Bakgrundsbilden kunde inte laddas. Kontrollera att adressen i kalenderfilen stämmer och att
            bilden är delad så att alla kan se den: {background.image}
          </p>
        )}
        {doors.map(({ door, isOpen, isOpenable }) => (
          <Door
            key={door.day}
            day={door.day}
            position={doorPosition(door, background)}
            backgroundImage={backgroundFailed ? null : background.image}
            image={door.image}
            alt={door.alt}
            isOpen={isOpen}
            isOpenable={isOpenable}
            onDoorClick={onDoorClick}
            onPhotoClick={onPhotoClick}
          />
        ))}
        <p className={styles.message} role="status">
          {message !== null && <span className={styles.messageText}>{message}</span>}
        </p>
      </div>
      <p className={styles.rotateHint}>Vänd telefonen för att se kalendern större.</p>
    </main>
  )
}

export default Calendar
