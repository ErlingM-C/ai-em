import { useState, type CSSProperties } from 'react'
import { backgroundSlice, type DoorPosition } from '../lib/doorPosition.ts'
import styles from './Door.module.css'

type DoorProps = {
  day: number
  position: DoorPosition
  backgroundImage: string
  image: string
  alt: string
  isOpen: boolean
  isOpenable: boolean
  onClick: (day: number) => void
}

function doorLabel(day: number, alt: string, isOpen: boolean, isOpenable: boolean): string {
  if (isOpen) {
    return `Lucka ${day}, öppnad: ${alt}. Stäng luckan`
  }
  return isOpenable ? `Lucka ${day}` : `Lucka ${day}, låst till ${day} december`
}

function toPercentStyle(position: DoorPosition): CSSProperties {
  return {
    left: `${position.left}%`,
    top: `${position.top}%`,
    width: `${position.width}%`,
    height: `${position.height}%`,
  }
}

function Door({ day, position, backgroundImage, image, alt, isOpen, isOpenable, onClick }: DoorProps) {
  // Bilden ligger kvar efter att luckan stängts, så att den syns medan luckan svänger igen.
  const [photoMounted, setPhotoMounted] = useState(isOpen)
  if (isOpen && !photoMounted) {
    setPhotoMounted(true)
  }

  const slotClass = [styles.slot, isOpen && styles.slotOpen, !isOpenable && styles.locked]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      type="button"
      className={slotClass}
      style={toPercentStyle(position)}
      aria-label={doorLabel(day, alt, isOpen, isOpenable)}
      onClick={() => onClick(day)}
    >
      {photoMounted && <img className={styles.photo} src={image} alt="" />}
      <span className={isOpen ? `${styles.leaf} ${styles.open}` : styles.leaf} aria-hidden="true">
        <span className={styles.front}>
          <img
            className={styles.frontImage}
            src={backgroundImage}
            alt=""
            style={toPercentStyle(backgroundSlice(position))}
          />
          <span className={styles.number}>{day}</span>
        </span>
        <span className={styles.back} />
      </span>
    </button>
  )
}

export default Door
