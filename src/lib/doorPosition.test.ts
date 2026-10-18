import { describe, expect, it } from 'vitest'
import { backgroundSlice, doorPosition } from './doorPosition.ts'

const background = { image: 'https://example.com/b.jpg', width: 1920, height: 1080 }
const door = {
  day: 1,
  x: 480,
  y: 270,
  width: 192,
  height: 108,
  image: 'https://example.com/1.jpg',
  alt: 'Bild',
  text: 'Text',
}

describe('doorPosition', () => {
  it('räknar om pixlar till procent av bakgrunden', () => {
    expect(doorPosition(door, background)).toEqual({ left: 25, top: 25, width: 10, height: 10 })
  })

  it('ger samma procent oavsett bakgrundens upplösning', () => {
    const large = { ...background, width: 3840, height: 2160 }
    const scaled = { ...door, x: 960, y: 540, width: 384, height: 216 }
    expect(doorPosition(scaled, large)).toEqual(doorPosition(door, background))
  })

  it('placerar en lucka i nedre högra hörnet kant i kant med bilden', () => {
    const corner = { ...door, x: 1728, y: 972 }
    const position = doorPosition(corner, background)
    expect(position.left + position.width).toBe(100)
    expect(position.top + position.height).toBe(100)
  })
})

describe('backgroundSlice', () => {
  it('gör bakgrunden lika stor som hela kalendern och flyttar den till luckans plats', () => {
    expect(backgroundSlice({ left: 25, top: 50, width: 10, height: 20 })).toEqual({
      left: -250,
      top: -250,
      width: 1000,
      height: 500,
    })
  })

  it('lägger bakgrunden i hörnet för en lucka i övre vänstra hörnet', () => {
    const slice = backgroundSlice({ left: 0, top: 0, width: 50, height: 50 })
    expect(slice.left).toBeCloseTo(0)
    expect(slice.top).toBeCloseTo(0)
    expect(slice.width).toBe(200)
  })
})
