import { useEffect, useCallback, useState } from 'react'
import Map, { Source, Layer } from 'react-map-gl/mapbox'
import type { MapMouseEvent } from 'react-map-gl/mapbox'
import type { FeatureCollection } from 'geojson'
import 'mapbox-gl/dist/mapbox-gl.css'
import { hexGridGeoJSON } from './hexGrid'
import { UnitLayer } from './components/UnitLayer'
import { FogLayer } from './components/FogLayer'
import { TerrainLayer } from './components/TerrainLayer'
import { MovementLayer } from './components/MovementLayer'
import { ArtilleryRangeLayer } from './components/ArtilleryRangeLayer'
import { ZocLayer } from './components/ZocLayer'
import { TimeControls } from './components/TimeControls'
import { DirectiveMenu } from './components/DirectiveMenu'
import { UnitPanel } from './components/UnitPanel'
import { useGameStore } from './store/gameStore'
import { seedScenario } from './units/seed'
import { INITIAL_VIEW, MAP_BOUNDS, ZONE } from './config/mapConfig'
import { lngLatToHex, hexLngLatVertices } from './utils/hexUtils'
import { loadTerrainCache, analyzeAndCacheTerrain } from './utils/terrainAnalysis'
import { playSound } from './utils/sound'
import { playUnitSound } from './utils/unitSounds'
import { BrigadeType, CompanyType, Side } from './units/types'
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
  const { addBrigade, addBattalion, addCompany, selectedCompanyId, companies, moveCompany, selectCompany, tick, setTerrainMap, setZoom, setAttackTarget } = useGameStore()
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
    const company = companies.get(selectedCompanyId)
    const brigade = brigades.get(company?.brigadeId ?? '')
    const hex = lngLatToHex(e.lngLat.lng, e.lngLat.lat)

    const hasEnemy = Array.from(companies.values()).some(c =>
      c.side !== company?.side && c.position?.col === hex.col && c.position?.row === hex.row
    )

    if (company?.type === CompanyType.Artillery && hasEnemy) {
      // Артилерія + ворог на гексі → встановити ціль атаки
      setAttackTarget(selectedCompanyId, hex)
    } else {
      // Всі інші випадки → рух
      const played = playUnitSound(company!.type, 'move')
      if (!played && brigade?.type === BrigadeType.DSV) playSound(airMove)
      moveCompany(selectedCompanyId, hex)
    }
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

  // GeoJSON усіх гексів із нашими юнітами (зелений)
  const occupiedHexGeoJSON: FeatureCollection = {
    type: 'FeatureCollection',
    features: Array.from(companies.values())
      .filter(c => c.position)
      .map(c => ({
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [hexLngLatVertices(c.position!.col, c.position!.row)],
        },
      })),
  }

  // GeoJSON цільових гексів юнітів що рухаються (жовтий — куди йдуть)
  const movingHexGeoJSON: FeatureCollection = {
    type: 'FeatureCollection',
    features: Array.from(companies.values())
      .filter(c => c.targetHex && c.side === Side.Ukraine)
      .map(c => ({
        type: 'Feature' as const,
        properties: {},
        geometry: {
          type: 'Polygon' as const,
          coordinates: [hexLngLatVertices(c.targetHex!.col, c.targetHex!.row)],
        },
      })),
  }

  // GeoJSON підсвіченого гексу (жовтий — hover)
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

      <Source type="geojson" data={occupiedHexGeoJSON}>
        <Layer
          id="occupied-hex-fill"
          type="fill"
          paint={{ 'fill-color': '#00ff88', 'fill-opacity': 0.18 }}
        />
        <Layer
          id="occupied-hex-border"
          type="line"
          paint={{ 'line-color': '#00ff88', 'line-opacity': 0.8, 'line-width': 2 }}
        />
      </Source>

      <Source type="geojson" data={movingHexGeoJSON}>
        <Layer
          id="moving-hex-fill"
          type="fill"
          paint={{ 'fill-color': '#ffdd00', 'fill-opacity': 0.22 }}
        />
        <Layer
          id="moving-hex-border"
          type="line"
          paint={{ 'line-color': '#ffdd00', 'line-opacity': 0.95, 'line-width': 2 }}
        />
      </Source>

      <TerrainLayer />
      <ZocLayer />
      <FogLayer />
      <ArtilleryRangeLayer />
      <MovementLayer />

      <UnitLayer />
    </Map>
    <TimeControls />
    <UnitPanel />
    <DirectiveMenu />
    </div>
  )
}
