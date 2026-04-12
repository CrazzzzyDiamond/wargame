import type { HexPosition } from '../units/Company'

// Константи гексової сітки — мають збігатись з hexGrid.ts
export const HEX_SIZE_LNG = 0.04
export const LAT_SCALE = Math.cos(49.55 * Math.PI / 180)
export const HEX_SIZE_LAT = HEX_SIZE_LNG * LAT_SCALE
export const SQRT3 = Math.sqrt(3)
export const COL_SPACING = HEX_SIZE_LNG * 1.5
export const ROW_SPACING = HEX_SIZE_LAT * SQRT3
export const COL_OFFSET  = HEX_SIZE_LAT * SQRT3 / 2
export const ZONE_LNG_MIN = 36.3
export const ZONE_LAT_MIN = 49.0

// Гекс → географічні координати центру
export function hexToLngLat(col: number, row: number): [number, number] {
  const lng = ZONE_LNG_MIN + col * COL_SPACING
  const offset = (col % 2) * COL_OFFSET
  const lat = ZONE_LAT_MIN + row * ROW_SPACING + offset
  return [lng, lat]
}

// Географічні координати → найближчий гекс
export function lngLatToHex(lng: number, lat: number): HexPosition {
  const colApprox = (lng - ZONE_LNG_MIN) / COL_SPACING

  // Перевіряємо сусідні колонки і знаходимо найближчий центр
  let bestCol = 0
  let bestRow = 0
  let bestDist = Infinity

  for (const col of [Math.floor(colApprox) - 1, Math.floor(colApprox), Math.ceil(colApprox)]) {
    const offset = (col % 2) * COL_OFFSET
    const rowApprox = (lat - ZONE_LAT_MIN - offset) / ROW_SPACING
    const row = Math.round(rowApprox)

    const [hLng, hLat] = hexToLngLat(col, row)
    const dist = Math.hypot(lng - hLng, lat - hLat)

    if (dist < bestDist) {
      bestDist = dist
      bestCol = col
      bestRow = row
    }
  }

  return { col: bestCol, row: bestRow }
}
