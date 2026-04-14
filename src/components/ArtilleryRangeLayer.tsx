import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { FeatureCollection, Polygon } from 'geojson'
import { useGameStore } from '../store/gameStore'
import { getHexesInRing, hexLngLatVertices } from '../utils/hexUtils'
import { getAttackRange } from '../utils/unitStatus'
import { MAP } from '../config/theme'

export function ArtilleryRangeLayer() {
  const companies  = useGameStore(s => s.companies)
  const selectedId = useGameStore(s => s.selectedCompanyId)

  const geoJSON = useMemo((): FeatureCollection<Polygon> => {
    const empty: FeatureCollection<Polygon> = { type: 'FeatureCollection', features: [] }

    if (!selectedId) return empty

    const company = companies.get(selectedId)
    if (!company?.position) return empty

    const range = getAttackRange(company.type)
    if (!range) return empty

    const hexes = getHexesInRing(company.position, range.min, range.max)

    return {
      type: 'FeatureCollection',
      features: hexes.map(h => ({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [hexLngLatVertices(h.col, h.row)],
        },
      })),
    }
  }, [selectedId, companies])

  return (
    <Source type="geojson" data={geoJSON}>
      <Layer
        id="artillery-range-fill"
        type="fill"
        paint={{
          'fill-color': MAP.artilleryRange,
          'fill-opacity': 0.15,
        }}
      />
      <Layer
        id="artillery-range-line"
        type="line"
        paint={{
          'line-color': MAP.artilleryRange,
          'line-opacity': 0.45,
          'line-width': 1,
        }}
      />
    </Source>
  )
}
