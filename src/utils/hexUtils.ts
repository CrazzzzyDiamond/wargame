import type { HexPosition } from '../units/Company'
import { HEX_SIZE_LNG as CFG_HEX_SIZE, LAT_CENTER, ZONE } from '../config/mapConfig'

// Похідні константи гексової сітки (джерело — mapConfig.ts)
export const HEX_SIZE_LNG = CFG_HEX_SIZE
export const LAT_SCALE    = Math.cos(LAT_CENTER * Math.PI / 180)
export const HEX_SIZE_LAT = HEX_SIZE_LNG * LAT_SCALE
export const SQRT3        = Math.sqrt(3)
export const COL_SPACING  = HEX_SIZE_LNG * 1.5
export const ROW_SPACING  = HEX_SIZE_LAT * SQRT3
export const COL_OFFSET   = HEX_SIZE_LAT * SQRT3 / 2
export const ZONE_LNG_MIN = ZONE.lngMin
export const ZONE_LNG_MAX = ZONE.lngMax
export const ZONE_LAT_MIN = ZONE.latMin
export const ZONE_LAT_MAX = ZONE.latMax

// Шість напрямків у аксіальних координатах для flat-top гексів
const AXIAL_DIRS: [number, number][] = [
  [+1,  0], [+1, -1], [0, -1],
  [-1,  0], [-1, +1], [0, +1],
]

// Offset → аксіальні координати (odd-q схема)
function toAxial(col: number, row: number): [number, number] {
  return [col, row - Math.floor(col / 2)]
}

// Аксіальні → offset координати
function fromAxial(q: number, r: number): [number, number] {
  return [q, r + Math.floor(q / 2)]
}

// Всі гекси у радіусі від центру (включно з центром)
export function getHexesInRadius(center: HexPosition, radius: number): HexPosition[] {
  const [cq, cr] = toAxial(center.col, center.row)
  const result: HexPosition[] = []

  for (let dq = -radius; dq <= radius; dq++) {
    const rMin = Math.max(-radius, -dq - radius)
    const rMax = Math.min(+radius, -dq + radius)
    for (let dr = rMin; dr <= rMax; dr++) {
      const [col, row] = fromAxial(cq + dq, cr + dr)
      result.push({ col, row })
    }
  }

  return result
}

// Відстань між двома гексами в кубічних координатах
export function hexDistance(a: HexPosition, b: HexPosition): number {
  const [aq, ar] = toAxial(a.col, a.row)
  const [bq, br] = toAxial(b.col, b.row)
  return Math.max(
    Math.abs(aq - bq),
    Math.abs(ar - br),
    Math.abs((-aq - ar) - (-bq - br)),
  )
}

// Усі гекси в кільці від minRange до maxRange включно
export function getHexesInRing(center: HexPosition, minRange: number, maxRange: number): HexPosition[] {
  return getHexesInRadius(center, maxRange).filter(h => hexDistance(center, h) >= minRange)
}

// Один крок від ref у протилежному напрямку — повертає сусідній гекс найдальший від ref
export function stepAwayFrom(pos: HexPosition, ref: HexPosition): HexPosition {
  const [pq, pr] = toAxial(pos.col, pos.row)
  const [rq, rr] = toAxial(ref.col, ref.row)
  let bestDist = -1
  let best: HexPosition = pos
  for (const [dq, dr] of AXIAL_DIRS) {
    const nq = pq + dq
    const nr = pr + dr
    const dist = Math.max(
      Math.abs(nq - rq),
      Math.abs(nr - rr),
      Math.abs((-nq - nr) - (-rq - rr)),
    )
    if (dist > bestDist) {
      bestDist = dist
      const [col, row] = fromAxial(nq, nr)
      best = { col, row }
    }
  }
  return best
}

// Один крок з from у напрямку to — повертає сусідній гекс найближчий до цілі
export function stepToward(from: HexPosition, to: HexPosition): HexPosition {
  if (from.col === to.col && from.row === to.row) return from

  const [fq, fr] = toAxial(from.col, from.row)
  const [tq, tr] = toAxial(to.col, to.row)

  let bestDist = Infinity
  let best: HexPosition = from

  for (const [dq, dr] of AXIAL_DIRS) {
    const nq = fq + dq
    const nr = fr + dr
    const dist = Math.max(
      Math.abs(nq - tq),
      Math.abs(nr - tr),
      Math.abs((-nq - nr) - (-tq - tr)),
    )
    if (dist < bestDist) {
      bestDist = dist
      const [col, row] = fromAxial(nq, nr)
      best = { col, row }
    }
  }

  return best
}

// Вершини гексу у географічних координатах (замкнений полігон)
export function hexLngLatVertices(col: number, row: number): [number, number][] {
  const [centerLng, centerLat] = hexToLngLat(col, row)
  const verts: [number, number][] = []
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i
    verts.push([
      centerLng + HEX_SIZE_LNG * Math.cos(angle),
      centerLat + HEX_SIZE_LAT * Math.sin(angle),
    ])
  }
  verts.push(verts[0])
  return verts
}

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
