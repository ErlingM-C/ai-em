import type { Background, Door } from './config.ts'

/** Luckans läge och storlek i procent av bakgrundsbilden. */
export type DoorPosition = {
  left: number
  top: number
  width: number
  height: number
}

export function doorPosition(door: Door, background: Background): DoorPosition {
  return {
    left: (door.x / background.width) * 100,
    top: (door.y / background.height) * 100,
    width: (door.width / background.width) * 100,
    height: (door.height / background.height) * 100,
  }
}
