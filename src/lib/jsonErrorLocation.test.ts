import { describe, expect, it } from 'vitest'
import { jsonErrorLocation } from './jsonErrorLocation.ts'

describe('jsonErrorLocation', () => {
  it('läser rad och kolumn ur Chromes meddelande', () => {
    const message = 'Expected double-quoted property name in JSON at position 11 (line 3 column 1)'
    expect(jsonErrorLocation(message, '')).toEqual({ line: 3, column: 1 })
  })

  it('läser rad och kolumn ur Firefox meddelande', () => {
    const message = 'JSON.parse: expected double-quoted property name at line 5 column 3 of the JSON data'
    expect(jsonErrorLocation(message, '')).toEqual({ line: 5, column: 3 })
  })

  it('räknar ut rad och kolumn när bara positionen anges', () => {
    const text = '{\n  "a": 1,\n}'
    expect(jsonErrorLocation('Unexpected token } in JSON at position 12', text)).toEqual({ line: 3, column: 1 })
  })

  it('räknar position 0 som rad 1, kolumn 1', () => {
    expect(jsonErrorLocation('Unexpected token x in JSON at position 0', 'x')).toEqual({ line: 1, column: 1 })
  })

  it('ger null när meddelandet inte anger var felet finns', () => {
    expect(jsonErrorLocation("JSON Parse error: Expected '}'", '{')).toBeNull()
  })
})
