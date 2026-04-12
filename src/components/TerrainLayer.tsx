import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { FeatureCollection, Polygon } from 'geojson'
import { useGameStore } from '../store/gameStore'
import { TerrainType } from '../units/types'
import { hexLngLatVertices } from '../utils/hexUtils'

export function TerrainLayer() {
  const terrainMap = useGameStore(s => s.terrainMap)

  const urbanGeoJSON = useMemo((): FeatureCollection<Polygon> => {
    const features: FeatureCollection<Polygon>['features'] = []

    for (const [key, terrain] of terrainMap) {
      if (terrain !== TerrainType.Urban) continue
      const [col, row] = key.split(',').map(Number)
      features.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [hexLngLatVertices(col, row)],
        },
      })
    }

    return { type: 'FeatureCollection', features }
  }, [terrainMap])

  return (
    <Source type="geojson" data={urbanGeoJSON}>
      <Layer
        id="terrain-urban"
        type="fill"
        paint={{
          'fill-color': '#c8c0b0',
          'fill-opacity': 0.35,
        }}
      />
    </Source>
  )
}
