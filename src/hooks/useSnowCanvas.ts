import { useEffect, useRef, type RefObject } from 'react'
import { advanceSnow, initialSnowState, type Flake, type SnowIntensity } from '../lib/snow.ts'

/** Ett långt uppehåll, till exempel när fliken ligger i bakgrunden, räknas som högst så här många sekunder. */
const MAX_STEP_SECONDS = 0.1

/** Anpassar canvasens upplösning efter skärmens pixeltäthet, så att flingorna blir skarpa. */
function matchCanvasSize(canvas: HTMLCanvasElement, context: CanvasRenderingContext2D): void {
  const ratio = window.devicePixelRatio || 1
  const width = Math.round(canvas.clientWidth * ratio)
  const height = Math.round(canvas.clientHeight * ratio)
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width
    canvas.height = height
    context.setTransform(ratio, 0, 0, ratio, 0, 0)
  }
}

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
 * Låter snö falla i canvasen. Ändras intensiteten slutar nya flingor komma
 * (eller fler kommer), medan flingor som redan faller dalar klart.
 */
export function useSnowCanvas(canvasRef: RefObject<HTMLCanvasElement | null>, intensity: SnowIntensity): void {
  const intensityRef = useRef(intensity)

  useEffect(() => {
    intensityRef.current = intensity
  }, [intensity])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d') ?? null
    if (canvas === null || context === null) {
      return
    }

    let state = initialSnowState()
    let previous = performance.now()
    let frameId = 0

    const frame = (now: number): void => {
      matchCanvasSize(canvas, context)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      const seconds = Math.min((now - previous) / 1000, MAX_STEP_SECONDS)
      previous = now
      state = advanceSnow(
        state,
        { intensity: intensityRef.current, width, height, seconds, time: now / 1000 },
        Math.random,
      )
      context.clearRect(0, 0, width, height)
      drawFlakes(context, state.flakes)
      frameId = requestAnimationFrame(frame)
    }

    frameId = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(frameId)
  }, [canvasRef])
}
