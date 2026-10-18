import { describe, expect, it } from 'vitest'
import { createFlake, hasFallenOut, moveFlake, targetFlakeCount, type Flake } from './snow.ts'

const half = (): number => 0.5

const flake: Flake = { x: 100, y: 50, radius: 2, speed: 40, drift: 10, phase: 0, opacity: 0.8 }

describe('targetFlakeCount', () => {
  it('ger fler flingor vid lätt snöfall än vid minimalt', () => {
    const light = targetFlakeCount('light', 1920, 1080)
    const minimal = targetFlakeCount('minimal', 1920, 1080)
    expect(light).toBeGreaterThan(100)
    expect(minimal).toBeGreaterThan(0)
    expect(minimal).toBeLessThan(light / 5)
  })

  it('ger inga flingor när snön är avstängd', () => {
    expect(targetFlakeCount('none', 1920, 1080)).toBe(0)
  })

  it('ger färre flingor på en mindre yta', () => {
    expect(targetFlakeCount('light', 390, 844)).toBeLessThan(targetFlakeCount('light', 1920, 1080))
  })
})

describe('createFlake', () => {
  it('startar ovanför ytan när den ska falla in uppifrån', () => {
    expect(createFlake(half, 800, 600, true).y).toBeLessThan(0)
  })

  it('startar inne på ytan när ytan ska fyllas direkt', () => {
    const created = createFlake(half, 800, 600, false)
    expect(created.y).toBe(300)
    expect(created.x).toBe(400)
  })
})

describe('moveFlake', () => {
  it('faller med sin hastighet', () => {
    expect(moveFlake(flake, 0.5, 0, 800).y).toBe(70)
  })

  it('driver i sidled', () => {
    const moved = moveFlake({ ...flake, phase: Math.PI / 2 }, 1, 0, 800)
    expect(moved.x).toBeCloseTo(110)
  })

  it('kommer in på andra sidan när den driver ut', () => {
    const moved = moveFlake({ ...flake, x: 801, phase: Math.PI / 2 }, 1, 0, 800)
    expect(moved.x).toBe(-2)
  })
})

describe('hasFallenOut', () => {
  it('är sant först när hela flingan är nedanför ytan', () => {
    expect(hasFallenOut({ ...flake, y: 601 }, 600)).toBe(false)
    expect(hasFallenOut({ ...flake, y: 603 }, 600)).toBe(true)
  })
})
