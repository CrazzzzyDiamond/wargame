import type { Map as MapboxMap, MapboxGeoJSONFeature, PointLike } from 'mapbox-gl'
import { TerrainType } from '../units/types'
import { hexToLngLat, HEX_SIZE_LNG, getHexesInRadius } from './hexUtils'
import { hexGridGeoJSON } from '../hexGrid'

// Ключ кешу включає розмір гексу — при зміні HEX_SIZE_LNG кеш автоматично інвалідується
// v2: додано перевірку place_label і bbox запит для сіл без landuse полігонів
const CACHE_KEY = `wargame_terrain_v2_hex${HEX_SIZE_LNG}`

// Класифікація ландшафту за source-layer і властивостями фічей Mapbox
function classifyFeatures(features: MapboxGeoJSONFeature[]): TerrainType {
  let isForest = false

  for (const f of features) {
    const sl = f.sourceLayer

    if (sl === 'water') return TerrainType.Water

    if (sl === 'landuse') {
      const cls = f.properties?.class as string | undefined
      if (!cls) continue
      if (['residential', 'commercial', 'industrial', 'military', 'retail'].includes(cls)) {
        return TerrainType.Urban
      }
      if (['wood', 'forest'].includes(cls)) isForest = true
    }

    if (sl === 'landcover') {
      if ((f.properties?.class as string) === 'wood') isForest = true
    }

    // Маленькі села часто представлені тільки точкою в place_label без landuse полігону
    if (sl === 'place_label' || sl === 'settlement_subdivision') {
      const type = f.properties?.type as string | undefined
      if (type && ['city', 'town', 'village', 'suburb', 'neighbourhood', 'hamlet'].includes(type)) {
        return TerrainType.Urban
      }
    }
  }

  if (isForest) return TerrainType.Forest
  return TerrainType.Open
}

// Завантаження кешу з localStorage
export function loadTerrainCache(): Map<string, TerrainType> | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const entries: [string, TerrainType][] = JSON.parse(raw)
    console.log(`[terrain] кеш завантажено (${entries.length} гексів, ключ: ${CACHE_KEY})`)
    return new Map(entries)
  } catch {
    return null
  }
}

// Аналіз ландшафту через queryRenderedFeatures і збереження у кеш
export function analyzeAndCacheTerrain(map: MapboxMap): Map<string, TerrainType> {
  const result = new Map<string, TerrainType>()

  for (const feature of hexGridGeoJSON.features) {
    const { col, row } = feature.properties
    const [lng, lat] = hexToLngLat(col, row)

    const pixel = map.project([lng, lat] as [number, number])
    // bbox 6px навколо центру гексу — ловить point-фічі сіл (place_label)
    const bbox: [PointLike, PointLike] = [
      [pixel.x - 6, pixel.y - 6],
      [pixel.x + 6, pixel.y + 6],
    ]
    const features = map.queryRenderedFeatures(bbox)
    const terrain = classifyFeatures(features)

    result.set(`${col},${row}`, terrain)
  }

  // Розширюємо Urban на 1 гекс навколо центрів сіл — бо place_label це точка в центрі
  const urbanCenters = [...result.entries()]
    .filter(([, t]) => t === TerrainType.Urban)
    .map(([key]) => {
      const [col, row] = key.split(',').map(Number)
      return { col, row }
    })

  for (const center of urbanCenters) {
    for (const neighbor of getHexesInRadius(center, 1)) {
      const key = `${neighbor.col},${neighbor.row}`
      // Не перезаписуємо воду і ліс — вони важливіші
      const existing = result.get(key)
      if (!existing || existing === TerrainType.Open) {
        result.set(key, TerrainType.Urban)
      }
    }
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify([...result.entries()]))
    console.log(`[terrain] аналіз завершено і збережено (${result.size} гексів)`)
  } catch {
    console.warn('[terrain] не вдалось зберегти у localStorage')
  }

  return result
}

// Зручний геттер — повертає тип ландшафту або Open якщо невідомо
export function getTerrain(
  terrainMap: Map<string, TerrainType>,
  col: number,
  row: number,
): TerrainType {
  return terrainMap.get(`${col},${row}`) ?? TerrainType.Open
}

// Модифікатор швидкості руху залежно від ландшафту (множник до MINUTES_PER_HEX)
export const TERRAIN_MOVE_COST: Record<TerrainType, number> = {
  [TerrainType.Open]:   1.0,
  [TerrainType.Forest]: 2.0,
  [TerrainType.Urban]:  1.5,
  [TerrainType.Water]:  Infinity,  // непрохідна
}
