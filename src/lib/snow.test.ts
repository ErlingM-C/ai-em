import { describe, expect, it } from 'vitest'
import {
  advanceSnow,
  createFlake,
  hasFallenOut,
  initialSnowState,
  moveFlake,
  targetFlakeCount,
  type Flake,
  type SnowStep,
} from './snow.ts'

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

describe('advanceSnow', () => {
  const step: SnowStep = { intensity: 'light', width: 1920, height: 1080, seconds: 0.016, time: 0 }
  const target = targetFlakeCount('light', 1920, 1080)

  it('fyller ytan direkt första gången det ska snöa', () => {
    const next = advanceSnow(initialSnowState(), step, half)
    expect(next.flakes).toHaveLength(target)
    expect(next.filled).toBe(true)
  })

  it('fyller inte ytan när snön är avstängd', () => {
    const next = advanceSnow(initialSnowState(), { ...step, intensity: 'none' }, half)
    expect(next.flakes).toHaveLength(0)
    expect(next.filled).toBe(false)
  })

  it('fyller bara ytan en gång, sedan kommer nya flingor gradvis', () => {
    const next = advanceSnow({ flakes: [], filled: true, spawnBudget: 0 }, { ...step, seconds: 1 }, half)
    expect(next.flakes).toHaveLength(5)
    expect(next.flakes.every((created) => created.y < 0)).toBe(true)
  })

  it('skapar inga nya flingor när snön stängs av, men låter de som faller dala klart', () => {
    const state = { flakes: [flake], filled: true, spawnBudget: 5 }
    const next = advanceSnow(state, { ...step, intensity: 'none', seconds: 0.5 }, half)
    expect(next.flakes).toHaveLength(1)
    expect(next.flakes[0].y).toBe(70)
  })

  it('tar bort flingor som har fallit ut nedtill', () => {
    const state = { flakes: [{ ...flake, y: 1079 }], filled: true, spawnBudget: 0 }
    const next = advanceSnow(state, { ...step, intensity: 'none', seconds: 1 }, half)
    expect(next.flakes).toHaveLength(0)
  })
})
