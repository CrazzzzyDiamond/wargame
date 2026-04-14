import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { FeatureCollection, Polygon } from 'geojson'
import { useGameStore } from '../store/gameStore'
import { getHexesInRadius } from '../utils/hexUtils'
import { hexLngLatVertices } from '../utils/hexUtils'
import { getZocRadius } from '../utils/unitStatus'
import { MAP } from '../config/theme'

export function ZocLayer() {
  const companies  = useGameStore(s => s.companies)
  const selectedId = useGameStore(s => s.selectedCompanyId)

  const geoJSON = useMemo((): FeatureCollection<Polygon> => {
    const empty: FeatureCollection<Polygon> = { type: 'FeatureCollection', features: [] }

    if (!selectedId) return empty

    const company = companies.get(selectedId)
    if (!company?.position) return empty

    const radius = getZocRadius(company)
    if (radius === 0) return empty

    const hexes = getHexesInRadius(company.position, radius)
      .filter(h => !(h.col === company.position!.col && h.row === company.position!.row))

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
        id="zoc-fill"
        type="fill"
        paint={{
          'fill-color': MAP.zoc,
          'fill-opacity': 0.12,
        }}
      />
      <Layer
        id="zoc-line"
        type="line"
        paint={{
          'line-color': MAP.zoc,
          'line-opacity': 0.5,
          'line-width': 1,
        }}
      />
    </Source>
  )
}
