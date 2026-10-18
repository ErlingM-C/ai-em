import { describe, expect, it } from 'vitest'
import demoJson from '../../public/examples/demo.json?raw'
import { validateConfig } from './validateConfig.ts'

describe('exempelkalendern', () => {
  it('följer formatet', () => {
    const data: unknown = JSON.parse(demoJson)
    const result = validateConfig(data, { allowRelativeUrls: true })
    expect(result.ok ? [] : result.errors).toEqual([])
  })
})
