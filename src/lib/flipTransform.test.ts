import { describe, expect, it } from 'vitest'
import { flipTransform } from './flipTransform.ts'

describe('flipTransform', () => {
  it('flyttar och skalar till luckans läge', () => {
    const door = { x: 100, y: 50, width: 80, height: 60 }
    const modal = { x: 300, y: 200, width: 800, height: 600 }
    expect(flipTransform(door, modal)).toBe('translate(-200px, -150px) scale(0.1, 0.1)')
  })

  it('ger ingen förändring när lägena är lika', () => {
    const rect = { x: 10, y: 20, width: 30, height: 40 }
    expect(flipTransform(rect, rect)).toBe('translate(0px, 0px) scale(1, 1)')
  })

  it('delar inte med noll om målet saknar storlek', () => {
    const door = { x: 0, y: 0, width: 80, height: 60 }
    const empty = { x: 0, y: 0, width: 0, height: 0 }
    expect(flipTransform(door, empty)).toBe('translate(0px, 0px) scale(1, 1)')
  })
})
