import type { Feature, FeatureCollection, Polygon } from 'geojson'

const HEX_SIZE_LNG = 0.04
const LAT_SCALE = Math.cos(49.55 * Math.PI / 180)
const HEX_SIZE_LAT = HEX_SIZE_LNG * LAT_SCALE
const SQRT3 = Math.sqrt(3)

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

const ZONE_LNG_MIN = 36.3
const ZONE_LNG_MAX = 38.3
const ZONE_LAT_MIN = 49.0
const ZONE_LAT_MAX = 50.1

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
