import { useRef } from 'react'
import { useSnowCanvas } from '../hooks/useSnowCanvas.ts'
import type { SnowIntensity } from '../lib/snow.ts'
import styles from './Snow.module.css'

type SnowProps = {
  intensity: SnowIntensity
  /** page: täcker hela fönstret. inside: täcker närmaste positionerade förälder. */
  placement: 'page' | 'inside'
}

/** Fallande snö som dekoration. Själva snöfallet sköts av useSnowCanvas. */
function Snow({ intensity, placement }: SnowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useSnowCanvas(canvasRef, intensity)

  const className = placement === 'page' ? `${styles.snow} ${styles.page}` : `${styles.snow} ${styles.inside}`
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}

export default Snow
