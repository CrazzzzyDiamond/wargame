import { TerrainType } from '../units/types'
import { hexToLngLat, HEX_SIZE_LNG, getHexesInRadius } from './hexUtils'
import { hexGridGeoJSON } from '../hexGrid'
import { ZONE } from '../config/mapConfig'

const CACHE_KEY = `wargame_terrain_v3_hex${HEX_SIZE_LNG}`

// --- Overpass API ---

interface OverpassElement {
  type: 'way'
  tags?: Record<string, string>
  geometry?: { lat: number; lon: number }[]
}

interface OverpassResponse {
  elements: OverpassElement[]
}

async function fetchOverpassData(): Promise<OverpassResponse> {
  // bbox у форматі Overpass: min_lat,min_lng,max_lat,max_lng
  const bbox = `${ZONE.latMin},${ZONE.lngMin},${ZONE.latMax},${ZONE.lngMax}`
  const query = `[out:json][timeout:30][bbox:${bbox}];
(
  way["natural"="wood"];
  way["landuse"="forest"];
  way["landuse"="residential"];
  way["landuse"="commercial"];
  way["landuse"="industrial"];
  way["landuse"="military"];
  way["natural"="water"];
  way["waterway"="riverbank"];
  way["water"="river"];
);
out geom;`

  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  })
  if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
  return res.json()
}

function elementToTerrain(tags: Record<string, string>): TerrainType {
  const nat = tags.natural
  const lu  = tags.landuse
  const ww  = tags.waterway
  const w   = tags.water

  if (nat === 'water' || ww === 'riverbank' || w === 'river') return TerrainType.Water
  if (nat === 'wood' || lu === 'forest') return TerrainType.Forest
  if (['residential', 'commercial', 'industrial', 'military'].includes(lu ?? '')) return TerrainType.Urban

  return TerrainType.Open
}

// --- Point-in-polygon (ray-casting) ---

function pointInPolygon(lng: number, lat: number, ring: [number, number][]): boolean {
  let inside = false
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]
    const [xj, yj] = ring[j]
    if (((yi > lat) !== (yj > lat)) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// --- Основна функція аналізу ---

export async function analyzeAndCacheTerrain(): Promise<Map<string, TerrainType>> {
  console.log('[terrain] запит до Overpass API...')
  const data = await fetchOverpassData()
  console.log(`[terrain] отримано ${data.elements.length} елементів`)

  // Готуємо полігони: тільки елементи з геометрією
  const polygons: { terrain: TerrainType; ring: [number, number][] }[] = []

  for (const el of data.elements) {
    if (!el.geometry || el.geometry.length < 3) continue
    const terrain = elementToTerrain(el.tags ?? {})
    if (terrain === TerrainType.Open) continue  // ігноруємо незначущі елементи

    const ring: [number, number][] = el.geometry.map(p => [p.lon, p.lat])
    polygons.push({ terrain, ring })
  }

  console.log(`[terrain] класифікую ${hexGridGeoJSON.features.length} гексів...`)
  const result = new Map<string, TerrainType>()

  for (const feature of hexGridGeoJSON.features) {
    const { col, row } = feature.properties
    const [lng, lat] = hexToLngLat(col, row)

    let terrain = TerrainType.Open

    // Пріоритет: Water > Urban > Forest > Open
    for (const poly of polygons) {
      if (pointInPolygon(lng, lat, poly.ring)) {
        if (poly.terrain === TerrainType.Water) { terrain = TerrainType.Water; break }
        if (poly.terrain === TerrainType.Urban)  terrain = TerrainType.Urban
        if (poly.terrain === TerrainType.Forest && terrain === TerrainType.Open) {
          terrain = TerrainType.Forest
        }
      }
    }

    result.set(`${col},${row}`, terrain)
  }

  // Розширюємо Urban на 1 гекс — бо OSM полігони сіл часто менші за реальну забудову
  const urbanCenters = [...result.entries()]
    .filter(([, t]) => t === TerrainType.Urban)
    .map(([key]) => { const [c, r] = key.split(',').map(Number); return { col: c, row: r } })

  for (const center of urbanCenters) {
    for (const nb of getHexesInRadius(center, 1)) {
      const key = `${nb.col},${nb.row}`
      if (!result.has(key) || result.get(key) === TerrainType.Open) {
        result.set(key, TerrainType.Urban)
      }
    }
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify([...result.entries()]))
    console.log('[terrain] збережено у localStorage')
  } catch {
    console.warn('[terrain] localStorage недоступний')
  }

  return result
}

// --- Кеш ---

export function saveTerrainCache(terrain: Map<string, TerrainType>): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify([...terrain.entries()]))
  } catch {
    console.warn('[terrain] localStorage недоступний')
  }
}

export function loadTerrainCache(): Map<string, TerrainType> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entries: [string, TerrainType][] = JSON.parse(raw)
    console.log(`[terrain] кеш завантажено (${entries.length} гексів)`)
    return new Map(entries)
  } catch {
    return null
  }
}

// --- Геттер ---

export function getTerrain(
  terrainMap: Map<string, TerrainType>,
  col: number,
  row: number,
): TerrainType {
  return terrainMap.get(`${col},${row}`) ?? TerrainType.Open
}

export const TERRAIN_MOVE_COST: Record<TerrainType, number> = {
  [TerrainType.Open]:   1.0,
  [TerrainType.Forest]: 2.0,
  [TerrainType.Urban]:  1.5,
  [TerrainType.Water]:  Infinity,
}
