// Вся географічна конфігурація гри — змінюй тут для переносу на інший сектор

export const ZONE = {
  lngMin: 36.3,
  lngMax: 38.3,
  latMin: 49.0,
  latMax: 50.1,
}

// Початковий вид камери
export const INITIAL_VIEW = {
  longitude: 37.6,
  latitude:  49.6,
  zoom:      9,
  pitch:     0,
  bearing:   0,
}

// Межі панорамування — трохи ширші за зону операції
export const MAP_BOUNDS: [[number, number], [number, number]] = [
  [36.0, 48.8],
  [38.8, 50.4],
]

// Розмір гексу та центральна широта для корекції пропорцій
export const HEX_SIZE_LNG = 0.015
export const LAT_CENTER   = 49.55  // cos(LAT_CENTER) стискає висоту гексу

// Початок операції (UTC)
export const OPERATION_START = '2022-09-06T06:00:00'
