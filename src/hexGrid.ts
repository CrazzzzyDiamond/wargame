import type { Feature, FeatureCollection, Polygon } from 'geojson'
import { HEX_SIZE_LNG, LAT_SCALE, HEX_SIZE_LAT, SQRT3 } from './utils/hexUtils'
import { ZONE } from './config/mapConfig'

export interface HexProperties {
  col: number
  row: number
  id: string
}

function hexVertices(centerLng: number, centerLat: number): [number, number][] {
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

const COL_SPACING = HEX_SIZE_LNG * 1.5
const ROW_SPACING = HEX_SIZE_LAT * SQRT3
const COL_OFFSET  = HEX_SIZE_LAT * SQRT3 / 2

const ZONE_LNG_MIN = ZONE.lngMin
const ZONE_LNG_MAX = ZONE.lngMax
const ZONE_LAT_MIN = ZONE.latMin
const ZONE_LAT_MAX = ZONE.latMax

const numCols = Math.ceil((ZONE_LNG_MAX - ZONE_LNG_MIN) / COL_SPACING) + 2
const numRows = Math.ceil((ZONE_LAT_MAX - ZONE_LAT_MIN) / ROW_SPACING) + 2

const features: Feature<Polygon, HexProperties>[] = []

for (let col = 0; col < numCols; col++) {
  const centerLng = ZONE_LNG_MIN + col * COL_SPACING
  const offset = (col % 2) * COL_OFFSET

  for (let row = 0; row < numRows; row++) {
    const centerLat = ZONE_LAT_MIN + row * ROW_SPACING + offset

    if (centerLng > ZONE_LNG_MAX + HEX_SIZE_LNG) continue
    if (centerLat > ZONE_LAT_MAX + HEX_SIZE_LAT) continue

    features.push({
      type: 'Feature',
      properties: { col, row, id: `${col}-${row}` },
      geometry: {
        type: 'Polygon',
        coordinates: [hexVertices(centerLng, centerLat)],
      },
    })
  }
}

export const hexGridGeoJSON: FeatureCollection<Polygon, HexProperties> = {
  type: 'FeatureCollection',
  features,
}
