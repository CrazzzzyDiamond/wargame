import { useMemo } from 'react'
import { Source, Layer } from 'react-map-gl/mapbox'
import type { FeatureCollection, LineString, Point } from 'geojson'
import { useGameStore } from '../store/gameStore'
import { hexToLngLat } from '../utils/hexUtils'
import { MAP } from '../config/theme'

export function MovementLayer() {
  const companies = useGameStore(s => s.companies)

  const { lines, targets, artTargets } = useMemo(() => {
    const lineFeatures: FeatureCollection<LineString>['features'] = []
    const targetFeatures: FeatureCollection<Point>['features'] = []
    const artTargetFeatures: FeatureCollection<Point>['features'] = []

    for (const company of companies.values()) {
      if (company.position && company.targetHex) {
        const [fromLng, fromLat] = hexToLngLat(company.position.col, company.position.row)
        const [toLng, toLat]     = hexToLngLat(company.targetHex.col, company.targetHex.row)
        lineFeatures.push({ type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: [[fromLng, fromLat], [toLng, toLat]] } })
        targetFeatures.push({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [toLng, toLat] } })
      }

      // Ціль артилерійського вогню
      if (company.position && company.attackTargetHex) {
        const [lng, lat] = hexToLngLat(company.attackTargetHex.col, company.attackTargetHex.row)
        artTargetFeatures.push({ type: 'Feature', properties: {}, geometry: { type: 'Point', coordinates: [lng, lat] } })
      }
    }

    return {
      lines:      { type: 'FeatureCollection' as const, features: lineFeatures },
      targets:    { type: 'FeatureCollection' as const, features: targetFeatures },
      artTargets: { type: 'FeatureCollection' as const, features: artTargetFeatures },
    }
  }, [companies])

  return (
    <>
      <Source type="geojson" data={lines}>
        <Layer
          id="movement-lines"
          type="line"
          paint={{
            'line-color': MAP.hexMoving,
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
            'circle-stroke-color': MAP.hexMoving,
            'circle-stroke-width': 2,
            'circle-opacity': 0,
            'circle-stroke-opacity': 0.8,
          }}
        />
      </Source>

      <Source type="geojson" data={artTargets}>
        <Layer
          id="artillery-targets-outer"
          type="circle"
          paint={{
            'circle-radius': 10,
            'circle-color': 'transparent',
            'circle-stroke-color': MAP.artilleryRange,
            'circle-stroke-width': 2,
            'circle-stroke-opacity': 0.9,
          }}
        />
        <Layer
          id="artillery-targets-inner"
          type="circle"
          paint={{
            'circle-radius': 3,
            'circle-color': MAP.artilleryRange,
            'circle-opacity': 0.9,
          }}
        />
      </Source>
    </>
  )
}
