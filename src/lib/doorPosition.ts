import type { Background, Door } from './config.ts'

/** Luckans läge och storlek i procent av bakgrundsbilden. */
export type DoorPosition = {
  left: number
  top: number
  width: number
  height: number
}

/**
 * Var hela bakgrundsbilden ska ligga, i procent av luckans storlek, för att
 * luckan ska visa just den bit av bakgrunden som den täcker.
 */
export function backgroundSlice(position: DoorPosition): DoorPosition {
  return {
    left: (-position.left / position.width) * 100,
    top: (-position.top / position.height) * 100,
    width: (100 / position.width) * 100,
    height: (100 / position.height) * 100,
  }
}

export function doorPosition(door: Door, background: Background): DoorPosition {
  return {
    left: (door.x / background.width) * 100,
    top: (door.y / background.height) * 100,
    width: (door.width / background.width) * 100,
    height: (door.height / background.height) * 100,
  }
}
