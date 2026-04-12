import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { FeatureCollection, LineString, Point } from 'geojson'
import { useGameStore } from '../store/gameStore'
import { hexToLngLat } from '../utils/hexUtils'

export function MovementLayer() {
  const companies = useGameStore(s => s.companies)

  const { lines, targets } = useMemo(() => {
    const lineFeatures: FeatureCollection<LineString>['features'] = []
    const targetFeatures: FeatureCollection<Point>['features'] = []

    for (const company of companies.values()) {
      if (!company.position || !company.targetHex) continue

      const [fromLng, fromLat] = hexToLngLat(company.position.col, company.position.row)
      const [toLng, toLat]     = hexToLngLat(company.targetHex.col, company.targetHex.row)

      lineFeatures.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: [[fromLng, fromLat], [toLng, toLat]],
        },
      })

      targetFeatures.push({
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: [toLng, toLat],
        },
      })
    }

    return {
      lines:   { type: 'FeatureCollection' as const, features: lineFeatures },
      targets: { type: 'FeatureCollection' as const, features: targetFeatures },
    }
  }, [companies])

  return (
    <>
      <Source type="geojson" data={lines}>
        <Layer
          id="movement-lines"
          type="line"
          paint={{
            'line-color': '#ffdd00',
            'line-opacity': 0.55,
            'line-width': 1.5,
            'line-dasharray': [4, 3],
          }}
        />
      </Source>

      <Source type="geojson" data={targets}>
        <Layer
          id="movement-targets"
          type="circle"
          paint={{
            'circle-radius': 5,
            'circle-color': 'transparent',
            'circle-stroke-color': '#ffdd00',
            'circle-stroke-width': 2,
            'circle-opacity': 0,
            'circle-stroke-opacity': 0.8,
          }}
        />
      </Source>
    </>
  )
}
