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
  onDoorClick: (day: number) => void
  onPhotoClick: (day: number) => void
}

function leafLabel(day: number, isOpen: boolean, isOpenable: boolean): string {
  if (isOpen) {
    return `Stäng lucka ${day}`
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

function Door(props: DoorProps) {
  const { day, position, backgroundImage, image, alt, isOpen, isOpenable } = props

  // Bilden ligger kvar efter att luckan stängts, så att den syns medan luckan svänger igen.
  const [photoMounted, setPhotoMounted] = useState(isOpen)
  if (isOpen && !photoMounted) {
    setPhotoMounted(true)
  }

  const slotClass = isOpen ? `${styles.slot} ${styles.slotOpen}` : styles.slot
  const leafClass = [styles.leaf, isOpen && styles.open, !isOpenable && styles.locked]
    .filter(Boolean)
    .join(' ')

  return (
    <div className={slotClass} style={toPercentStyle(position)}>
      <button
        type="button"
        className={leafClass}
        aria-label={leafLabel(day, isOpen, isOpenable)}
        onClick={() => props.onDoorClick(day)}
      >
        <span className={styles.front} aria-hidden="true">
          <img
            className={styles.frontImage}
            src={backgroundImage}
            alt=""
            style={toPercentStyle(backgroundSlice(position))}
          />
          <span className={styles.number}>{day}</span>
        </span>
        <span className={styles.back} aria-hidden="true" />
      </button>
      {photoMounted && (
        <button
          type="button"
          className={styles.photoButton}
          aria-label={`Visa lucka ${day} i större format: ${alt}`}
          disabled={!isOpen}
          onClick={() => props.onPhotoClick(day)}
        >
          <img className={styles.photo} src={image} alt="" />
        </button>
      )}
    </div>
  )
}

export default Door
