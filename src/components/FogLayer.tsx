import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { FeatureCollection, Polygon } from 'geojson'
import { useGameStore } from '../store/gameStore'
import { hexLngLatVertices } from '../utils/hexUtils'
import { buildVisibleHexSet } from '../utils/visibility'

// Зовнішній контур зони операції (охоплює весь ігровий простір)
const ZONE_RING: [number, number][] = [
  [36.3, 50.1], [38.3, 50.1], [38.3, 49.0], [36.3, 49.0], [36.3, 50.1],
]

export function FogLayer() {
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
      ZONE_RING,
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

  return (
    <Source type="geojson" data={fogGeoJSON}>
      <Layer
        id="fog-of-war"
        type="fill"
        paint={{
          'fill-color': '#000000',
          'fill-opacity': 0.72,
        }}
      />
    </Source>
  )
}
