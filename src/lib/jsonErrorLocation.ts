export type TextLocation = {
  line: number
  column: number
}

/** Rad och kolumn (båda från 1) för ett tecken i texten, räknat från 0. */
function locationOf(text: string, position: number): TextLocation {
  const before = text.slice(0, position)
  const lines = before.split('\n')
  return { line: lines.length, column: lines[lines.length - 1].length + 1 }
}

/**
 * Var i texten ett JSON-fel finns, enligt felmeddelandet från JSON.parse. Webbläsarna skriver
 * olika meddelanden: Chrome och Firefox anger rad och kolumn ("line 3 column 1"), äldre Chrome
 * bara tecknets position ("at position 11"), och Safari ingenting. Då returneras null.
 */
export function jsonErrorLocation(message: string, text: string): TextLocation | null {
  const lineColumn = /line (\d+) column (\d+)/.exec(message)
  if (lineColumn !== null) {
    return { line: Number(lineColumn[1]), column: Number(lineColumn[2]) }
  }
  const position = /position (\d+)/.exec(message)
  if (position !== null) {
    return locationOf(text, Number(position[1]))
  }
  return null
}
