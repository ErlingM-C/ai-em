import { useEffect, useState } from 'react'
import { fetchJson } from '../io/fetchJson.ts'
import { readConfigParam } from '../io/location.ts'
import type { CalendarConfig } from '../lib/config.ts'
import { resolveConfigSource } from '../lib/configSource.ts'
import { validateConfig } from '../lib/validateConfig.ts'

export type CalendarConfigState =
  | { status: 'missing' }
  | { status: 'loading' }
  | { status: 'error'; errors: string[] }
  | { status: 'ready'; config: CalendarConfig; configUrl: string }

async function loadConfig(param: string, signal: AbortSignal): Promise<CalendarConfigState> {
  const source = resolveConfigSource(param)
  if (!source.ok) {
    return { status: 'error', errors: [source.error] }
  }
  const fetched = await fetchJson(source.url, signal)
  if (!fetched.ok) {
    return { status: 'error', errors: [fetched.error] }
  }
  const result = validateConfig(fetched.data, { allowRelativeUrls: source.allowRelativeUrls })
  return result.ok
    ? { status: 'ready', config: result.config, configUrl: source.url }
    : { status: 'error', errors: result.errors }
}

export function useCalendarConfig(): CalendarConfigState {
  const [param] = useState(readConfigParam)
  const [state, setState] = useState<CalendarConfigState>(
    param === null ? { status: 'missing' } : { status: 'loading' },
  )

  useEffect(() => {
    if (param === null) {
      return
    }
    const controller = new AbortController()
    loadConfig(param, controller.signal).then((next) => {
      if (!controller.signal.aborted) {
        setState(next)
      }
    })
    return () => controller.abort()
  }, [param])

  return state
}
