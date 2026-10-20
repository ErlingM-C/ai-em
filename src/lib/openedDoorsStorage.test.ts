import { describe, expect, it } from 'vitest'
import { openedDoorsKey, parseOpenedDays, serializeOpenedDays } from './openedDoorsStorage.ts'

describe('openedDoorsKey', () => {
  it('ger olika nycklar för olika kalendrar', () => {
    expect(openedDoorsKey('https://a.example/k.json', false)).not.toBe(
      openedDoorsKey('https://b.example/k.json', false),
    )
  })

  it('sparar förhandsgranskningen separat', () => {
    const url = 'https://a.example/k.json'
    expect(openedDoorsKey(url, true)).not.toBe(openedDoorsKey(url, false))
  })
})

describe('parseOpenedDays', () => {
  it('ger inga luckor när inget är sparat', () => {
    expect(parseOpenedDays(null)).toEqual(new Set())
  })

  it('läser sparade dagar', () => {
    expect(parseOpenedDays('[1,5,24]')).toEqual(new Set([1, 5, 24]))
  })

  it.each(['inte json', '{"1":true}', '"1"', '42', 'null'])('ignorerar %j', (raw) => {
    expect(parseOpenedDays(raw)).toEqual(new Set())
  })

  it('hoppar över värden som inte är giltiga dagar', () => {
    expect(parseOpenedDays('[0, 3, 25, 2.5, "4", null, 7]')).toEqual(new Set([3, 7]))
  })
})

describe('serializeOpenedDays', () => {
  it('sparar dagarna sorterade och går att läsa tillbaka', () => {
    const raw = serializeOpenedDays(new Set([12, 2, 7]))
    expect(raw).toBe('[2,7,12]')
    expect(parseOpenedDays(raw)).toEqual(new Set([2, 7, 12]))
  })
})
