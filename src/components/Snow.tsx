import { useEffect, useRef } from 'react'
import {
  createFlake,
  hasFallenOut,
  moveFlake,
  targetFlakeCount,
  type Flake,
  type SnowIntensity,
} from '../lib/snow.ts'
import styles from './Snow.module.css'

type SnowProps = {
  intensity: SnowIntensity
  /** page: täcker hela fönstret. inside: täcker närmaste positionerade förälder. */
  placement: 'page' | 'inside'
}

/** Nya flingor per sekund som mest, så att snöfallet tilltar gradvis. */
const MAX_SPAWN_PER_SECOND = 60

function drawFlakes(context: CanvasRenderingContext2D, flakes: Flake[]): void {
  context.fillStyle = '#fff'
  for (const flake of flakes) {
    context.globalAlpha = flake.opacity
    context.beginPath()
    context.arc(flake.x, flake.y, flake.radius, 0, Math.PI * 2)
    context.fill()
  }
  context.globalAlpha = 1
}

/**
 * Fallande snö som dekoration. Ändras intensiteten slutar nya flingor komma
 * (eller fler kommer), medan flingor som redan faller dalar klart.
 */
function Snow({ intensity, placement }: SnowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intensityRef = useRef(intensity)

  useEffect(() => {
    intensityRef.current = intensity
  }, [intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (canvas === null || context === null || context === undefined) {
      return
    }

    let flakes: Flake[] = []
    let filled = false
    let spawnBudget = 0
    let previous = performance.now()
    let frameId = requestAnimationFrame(frame)

    function resize(target: HTMLCanvasElement, ctx: CanvasRenderingContext2D): void {
      const ratio = window.devicePixelRatio || 1
      const width = Math.round(target.clientWidth * ratio)
      const height = Math.round(target.clientHeight * ratio)
      if (target.width !== width || target.height !== height) {
        target.width = width
        target.height = height
        ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
      }
    }

    function frame(now: number): void {
      if (canvas === null || context === null || context === undefined) {
        return
      }
      resize(canvas, context)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const seconds = Math.min((now - previous) / 1000, 0.1)
      previous = now
      const target = targetFlakeCount(intensityRef.current, width, height)

      if (!filled && target > 0) {
        flakes = Array.from({ length: target }, () => createFlake(Math.random, width, height, false))
        filled = true
      }

      const moved = flakes.map((flake) => moveFlake(flake, seconds, now / 1000, width))
      flakes = moved.filter((flake) => !hasFallenOut(flake, height))

      spawnBudget = Math.min(spawnBudget + MAX_SPAWN_PER_SECOND * seconds, 5)
      while (flakes.length < target && spawnBudget >= 1) {
        flakes.push(createFlake(Math.random, width, height, true))
        spawnBudget -= 1
      }

      context.clearRect(0, 0, width, height)
      drawFlakes(context, flakes)
      frameId = requestAnimationFrame(frame)
    }

    return () => cancelAnimationFrame(frameId)
  }, [])

  const className = placement === 'page' ? `${styles.snow} ${styles.page}` : `${styles.snow} ${styles.inside}`
  return <canvas ref={canvasRef} className={className} aria-hidden="true" />
}

export default Snow
