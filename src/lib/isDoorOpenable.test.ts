import { describe, expect, it } from 'vitest'
import { isDoorOpenable } from './isDoorOpenable.ts'

describe('isDoorOpenable', () => {
  it('är låst dagen innan', () => {
    expect(isDoorOpenable(5, 2026, new Date(2026, 11, 4, 23, 59, 59), false)).toBe(false)
  })

  it('går att öppna från midnatt samma dag', () => {
    expect(isDoorOpenable(5, 2026, new Date(2026, 11, 5, 0, 0, 0), false)).toBe(true)
  })

  it('går att öppna senare samma år', () => {
    expect(isDoorOpenable(24, 2026, new Date(2026, 11, 31), false)).toBe(true)
  })

  it('går att öppna året efter', () => {
    expect(isDoorOpenable(24, 2026, new Date(2027, 0, 1), false)).toBe(true)
  })

  it('är låst före december', () => {
    expect(isDoorOpenable(1, 2026, new Date(2026, 10, 30, 12), false)).toBe(false)
  })

  it('är låst om kalendern gäller ett senare år', () => {
    expect(isDoorOpenable(1, 2027, new Date(2026, 11, 24), false)).toBe(false)
  })

  it('går alltid att öppna i förhandsgranskningsläget', () => {
    expect(isDoorOpenable(24, 2027, new Date(2026, 0, 1), true)).toBe(true)
  })
})
