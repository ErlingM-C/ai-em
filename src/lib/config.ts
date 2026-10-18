export type Background = {
  image: string
  width: number
  height: number
}

export type Door = {
  day: number
  x: number
  y: number
  width: number
  height: number
  image: string
  alt: string
  text: string
}

export type CalendarConfig = {
  version: 1
  title: string
  year: number
  background: Background
  doors: Door[]
}
