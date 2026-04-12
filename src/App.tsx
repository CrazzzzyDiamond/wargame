import { useEffect, useCallback, useState } from 'react'
import Map, { Source, Layer } from 'react-map-gl/mapbox'
import type { MapMouseEvent } from 'react-map-gl/mapbox'
import type { FeatureCollection } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import { hexGridGeoJSON } from './hexGrid'
import { UnitLayer } from './components/UnitLayer'
import { HQLayer } from './components/HQLayer'
import { FogLayer } from './components/FogLayer'
import { TerrainLayer } from './components/TerrainLayer'
import { MovementLayer } from './components/MovementLayer'
import { TimeControls } from './components/TimeControls'
import { DirectiveMenu } from './components/DirectiveMenu'
import { UnitPanel } from './components/UnitPanel'
import { useGameStore } from './store/gameStore'
import { seedScenario } from './units/seed'
import { INITIAL_VIEW, MAP_BOUNDS, ZONE } from './config/mapConfig'
import { lngLatToHex, hexLngLatVertices } from './utils/hexUtils'
import { loadTerrainCache, analyzeAndCacheTerrain } from './utils/terrainAnalysis'
import { playSound } from './utils/sound'
import { BrigadeType } from './units/types'
import airMove from './sound/air-move.mp3'
import type { HexPosition } from './units/Company'

// Інтервал тіку в мілісекундах реального часу
const TICK_INTERVAL_MS = 500
const TICK_DELTA_SEC    = TICK_INTERVAL_MS / 1000

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN

const ZONE_RING: [number, number][] = [
  [ZONE.lngMin, ZONE.latMax],
  [ZONE.lngMax, ZONE.latMax],
  [ZONE.lngMax, ZONE.latMin],
  [ZONE.lngMin, ZONE.latMin],
  [ZONE.lngMin, ZONE.latMax],
]

const maskGeoJSON: FeatureCollection = {
  type: 'FeatureCollection',
  features: [{
    type: 'Feature',
    properties: {},
    geometry: {
      type: 'Polygon',
      coordinates: [
        [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
        [...ZONE_RING].reverse(),
      ],
    },
  }],
}

export default function App() {
  const { addBrigade, addBattalion, addCompany, selectedCompanyId, moveCompany, selectCompany, tick, setTerrainMap, setZoom } = useGameStore()
  const [hoveredHex, setHoveredHex] = useState<HexPosition | null>(null)

  useEffect(() => {
    seedScenario({ addBrigade, addBattalion, addCompany })
  }, [])

  // Ігровий тікер — запускає ігровий час і рух юнітів
  useEffect(() => {
    const id = setInterval(() => tick(TICK_DELTA_SEC), TICK_INTERVAL_MS)
    return () => clearInterval(id)
  }, [tick])

  // Клавіатурні скорочення: пробіл — пауза/старт, 1/2 — швидкість
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const { speed, setSpeed } = useGameStore.getState()
      if (e.code === 'Space') {
        e.preventDefault()
        setSpeed(speed === 'paused' ? 'normal' : 'paused')
      } else if (e.code === 'Digit1') {
        setSpeed('normal')
      } else if (e.code === 'Digit2') {
        setSpeed('fast')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // Аналіз ландшафту через Overpass API при старті
  useEffect(() => {
    const cached = loadTerrainCache()
    if (cached) { setTerrainMap(cached); return }
    analyzeAndCacheTerrain().then(setTerrainMap)
  }, [])

  // Лівий клік — скасувати вибір
  const handleMapClick = useCallback(() => {
    if (selectedCompanyId) selectCompany(null)
  }, [selectedCompanyId, selectCompany])

  // Правий клік — перемістити вибраний юніт
  const handleMapRightClick = useCallback((e: MapMouseEvent) => {
    if (!selectedCompanyId) return
    e.preventDefault()
    const { companies, brigades } = useGameStore.getState()
    const brigade = brigades.get(companies.get(selectedCompanyId)?.brigadeId ?? '')
    if (brigade?.type === BrigadeType.DSV) playSound(airMove)
    const hex = lngLatToHex(e.lngLat.lng, e.lngLat.lat)
    moveCompany(selectedCompanyId, hex)
  }, [selectedCompanyId, moveCompany])

  // Рух миші — підсвічуємо гекс під курсором якщо є вибраний юніт
  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    if (!selectedCompanyId) {
      if (hoveredHex) setHoveredHex(null)
      return
    }
    const hex = lngLatToHex(e.lngLat.lng, e.lngLat.lat)
    setHoveredHex(prev =>
      prev?.col === hex.col && prev?.row === hex.row ? prev : hex
    )
  }, [selectedCompanyId, hoveredHex])

  // GeoJSON підсвіченого гексу
  const hexHighlightGeoJSON: FeatureCollection = hoveredHex && selectedCompanyId
    ? {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Polygon',
            coordinates: [hexLngLatVertices(hoveredHex.col, hoveredHex.row)],
          },
        }],
      }
    : { type: 'FeatureCollection', features: [] }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
    <Map

      initialViewState={INITIAL_VIEW}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      mapboxAccessToken={MAPBOX_TOKEN}
      minZoom={7}
      maxZoom={13}
      maxBounds={MAP_BOUNDS}
      onClick={handleMapClick}
      onContextMenu={handleMapRightClick}
      onZoom={e => setZoom(e.viewState.zoom)}
      onMouseMove={handleMouseMove}

    >
      <Source type="geojson" data={maskGeoJSON}>
        <Layer
          id="operation-mask"
          type="fill"
          paint={{ 'fill-color': '#000000', 'fill-opacity': 0.6 }}
        />
      </Source>

      <Source type="geojson" data={hexGridGeoJSON}>
        <Layer
          id="hex-grid"
          type="line"
          paint={{
            'line-color': '#00cfff',
            'line-opacity': 0.7,
            'line-width': 1.5,
          }}
        />
      </Source>

      <Source type="geojson" data={hexHighlightGeoJSON}>
        <Layer
          id="hex-highlight"
          type="fill"
          paint={{ 'fill-color': '#ffdd00', 'fill-opacity': 0.18 }}
        />
        <Layer
          id="hex-highlight-border"
          type="line"
          paint={{ 'line-color': '#ffdd00', 'line-opacity': 0.7, 'line-width': 1.5 }}
        />
      </Source>

      <TerrainLayer />
      <FogLayer />
      <MovementLayer />
      <HQLayer />
      <UnitLayer />
    </Map>
    <TimeControls />
    <UnitPanel />
    <DirectiveMenu />
    </div>
  )
}
