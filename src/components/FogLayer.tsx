import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { FeatureCollection, Polygon } from 'geojson'
import { useGameStore } from '../store/gameStore'
import { hexLngLatVertices } from '../utils/hexUtils'
import { buildVisibleHexSet } from '../utils/visibility'
import { MAP } from '../config/theme'

// Зовнішній контур туману — весь світ, щоб туман виглядав однаково скрізь
const WORLD_RING: [number, number][] = [
  [-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90],
]

interface Props {
  disabled?: boolean
}

export function FogLayer({ disabled = false }: Props) {
  const companies = useGameStore(s => s.companies)

  // Будуємо GeoJSON полігон туману: зона операції з "дірками" у видимих гексах
  const fogGeoJSON = useMemo((): FeatureCollection<Polygon> => {
    // Збираємо видимі гекси тільки від рот ЗСУ
    const visibleKeys = buildVisibleHexSet(companies)
    const visible = new Map<string, [number, number][]>()
    for (const key of visibleKeys) {
      const [col, row] = key.split(',').map(Number)
      visible.set(key, hexLngLatVertices(col, row))
    }

    // Полігон = зовнішня рамка + дірки для кожного видимого гексу
    const coordinates: [number, number][][] = [
      WORLD_RING,
      ...visible.values(),
    ]

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: { type: 'Polygon', coordinates },
      }],
    }
  }, [companies])

  if (disabled) return null

  return (
    <Source type="geojson" data={fogGeoJSON}>
      <Layer
        id="fog-of-war"
        type="fill"
        paint={{
          'fill-color': MAP.fog,
          'fill-opacity': 0.72,
        }}
      />
    </Source>
  )
}
