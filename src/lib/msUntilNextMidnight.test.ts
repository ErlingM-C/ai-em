import { describe, expect, it } from 'vitest'
import { msUntilNextMidnight } from './msUntilNextMidnight.ts'

describe('msUntilNextMidnight', () => {
  it('räknar till midnatt samma natt', () => {
    expect(msUntilNextMidnight(new Date(2026, 11, 4, 23, 0, 0))).toBe(60 * 60 * 1000)
  })

  it('ger ett helt dygn precis vid midnatt', () => {
    const now = new Date(2026, 11, 5, 0, 0, 0)
    expect(now.getTime() + msUntilNextMidnight(now)).toBe(new Date(2026, 11, 6).getTime())
  })

  it('ger en millisekund strax före midnatt', () => {
    expect(msUntilNextMidnight(new Date(2026, 11, 4, 23, 59, 59, 999))).toBe(1)
  })

  it('hamnar på midnatt även dagen då sommartiden börjar', () => {
    // I svensk tid har 29 mars 2026 bara 23 timmar.
    const now = new Date(2026, 2, 29, 0, 0, 0)
    expect(now.getTime() + msUntilNextMidnight(now)).toBe(new Date(2026, 2, 30).getTime())
  })

  it('går över månadsskiftet', () => {
    const now = new Date(2026, 10, 30, 12, 0, 0)
    expect(now.getTime() + msUntilNextMidnight(now)).toBe(new Date(2026, 11, 1).getTime())
  })
})
