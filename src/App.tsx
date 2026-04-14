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
import { loadTerrainCache, analyzeAndCacheTerrain, saveTerrainCache } from './utils/terrainAnalysis'
import { TerrainEditor } from './components/TerrainEditor'
import { UnitPlacer } from './components/UnitPlacer'
import { Company } from './units/Company'
import { playSound } from './utils/sound'
import { playUnitSound } from './utils/unitSounds'
import { BrigadeType, CompanyType, Side, TerrainType } from './units/types'
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
  const { addBrigade, addBattalion, addCompany, selectedCompanyId, companies, brigades, moveCompany, selectCompany, tick, setTerrainMap, setHexTerrain, setZoom, setAttackTarget, terrainMap } = useGameStore()

  const [hoveredHex, setHoveredHex] = useState<HexPosition | null>(null)
  const [devMode, setDevMode] = useState(false)
  const [mapEditor, setMapEditor] = useState(false)
  const [unitPlacer, setUnitPlacer] = useState(false)
  const [editTerrain, setEditTerrain] = useState<TerrainType>(TerrainType.Forest)
  const [placeSide, setPlaceSide] = useState<Side>(Side.Ukraine)
  const [placeType, setPlaceType] = useState<CompanyType>(CompanyType.Line)
  const [placeBrigadeId, setPlaceBrigadeId] = useState('80-odshbr')

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

  // Лівий клік — у dev-режимі редагує terrain, інакше скасовує вибір
  const handleMapClick = useCallback((e: MapMouseEvent) => {
    if (devMode && mapEditor) {
      const { col, row } = lngLatToHex(e.lngLat.lng, e.lngLat.lat)
      setHexTerrain(col, row, editTerrain)
      saveTerrainCache(useGameStore.getState().terrainMap)
      return
    }
    if (devMode && unitPlacer) {
      const { col, row } = lngLatToHex(e.lngLat.lng, e.lngLat.lat)
      const brigade = useGameStore.getState().brigades.get(placeBrigadeId)
      if (!brigade) return
      // Перший батальйон бригади для прив'язки
      const bat = useGameStore.getState().battalions
      const battalionId = Array.from(bat.values()).find(b => b.brigadeId === placeBrigadeId)?.id
      if (!battalionId) return
      const id = `dev-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      addCompany(new Company({
        id,
        name: `[DEV] ${placeType}`,
        type: placeType,
        battalionId,
        brigadeId: placeBrigadeId,
        side: placeSide,
        position: { col, row },
      }))
      return
    }
    if (selectedCompanyId) selectCompany(null)
  }, [devMode, mapEditor, unitPlacer, editTerrain, placeSide, placeType, placeBrigadeId, selectedCompanyId, selectCompany, setHexTerrain, addCompany])

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

  // Рух миші — підсвічуємо гекс під курсором (dev-режим або вибраний юніт)
  const handleMouseMove = useCallback((e: MapMouseEvent) => {
    if (!selectedCompanyId && !(devMode && (mapEditor || unitPlacer))) {
      if (hoveredHex) setHoveredHex(null)
      return
    }
    const hex = lngLatToHex(e.lngLat.lng, e.lngLat.lat)
    setHoveredHex(prev =>
      prev?.col === hex.col && prev?.row === hex.row ? prev : hex
    )
  }, [selectedCompanyId, devMode, mapEditor, unitPlacer, hoveredHex])

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

  // GeoJSON terrain для dev-режиму (кольорові гекси по типу)
  const TERRAIN_COLORS: Record<TerrainType, string | null> = {
    [TerrainType.Open]:   null,
    [TerrainType.Forest]: '#2e7d32',
    [TerrainType.Urban]:  '#90a4ae',
    [TerrainType.Water]:  '#1e88e5',
  }
  const devTerrainGeoJSON: FeatureCollection = {
    type: 'FeatureCollection',
    features: devMode
      ? Array.from(terrainMap.entries())
          .filter(([, t]) => t !== TerrainType.Open)
          .map(([key, t]) => {
            const [col, row] = key.split(',').map(Number)
            return {
              type: 'Feature' as const,
              properties: { color: TERRAIN_COLORS[t] },
              geometry: { type: 'Polygon' as const, coordinates: [hexLngLatVertices(col, row)] },
            }
          })
      : [],
  }

  // GeoJSON підсвіченого гексу (жовтий — hover)
  const hexHighlightGeoJSON: FeatureCollection = hoveredHex && (selectedCompanyId || (devMode && (mapEditor || unitPlacer)))
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

      {devMode && mapEditor && (
        <Source type="geojson" data={devTerrainGeoJSON}>
          <Layer
            id="dev-terrain-fill"
            type="fill"
            paint={{
              'fill-color': ['get', 'color'],
              'fill-opacity': 0.45,
            }}
          />
          <Layer
            id="dev-terrain-border"
            type="line"
            paint={{
              'line-color': ['get', 'color'],
              'line-opacity': 0.8,
              'line-width': 1,
            }}
          />
        </Source>
      )}

      <ZocLayer />
      <FogLayer disabled={devMode} />
      <ArtilleryRangeLayer />
      <MovementLayer />

      <UnitLayer devMode={devMode} />
    </Map>
    <button
      onClick={() => setDevMode(v => !v)}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        padding: '4px 10px',
        background: devMode ? '#e74c3c' : 'rgba(0,0,0,0.6)',
        color: devMode ? '#fff' : '#aaa',
        border: `1px solid ${devMode ? '#e74c3c' : '#555'}`,
        borderRadius: 4,
        fontSize: 11,
        cursor: 'pointer',
        zIndex: 100,
        fontFamily: 'monospace',
        letterSpacing: '0.05em',
      }}
    >
      {devMode ? 'DEV ON' : 'DEV'}
    </button>
    {devMode && (
      <button
        onClick={() => setMapEditor(v => !v)}
        style={{
          position: 'absolute',
          top: 44,
          right: 12,
          padding: '4px 10px',
          background: mapEditor ? '#1565c0' : 'rgba(0,0,0,0.6)',
          color: mapEditor ? '#fff' : '#aaa',
          border: `1px solid ${mapEditor ? '#1565c0' : '#555'}`,
          borderRadius: 4,
          fontSize: 11,
          cursor: 'pointer',
          zIndex: 100,
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
        }}
      >
        {mapEditor ? 'MAP EDIT ON' : 'MAP EDIT'}
      </button>
    )}
    {devMode && mapEditor && (
      <TerrainEditor selected={editTerrain} onChange={setEditTerrain} />
    )}
    {devMode && (
      <button
        onClick={() => setUnitPlacer(v => !v)}
        style={{
          position: 'absolute',
          top: 76,
          right: 12,
          padding: '4px 10px',
          background: unitPlacer ? '#2e7d32' : 'rgba(0,0,0,0.6)',
          color: unitPlacer ? '#fff' : '#aaa',
          border: `1px solid ${unitPlacer ? '#2e7d32' : '#555'}`,
          borderRadius: 4,
          fontSize: 11,
          cursor: 'pointer',
          zIndex: 100,
          fontFamily: 'monospace',
          letterSpacing: '0.05em',
          display: mapEditor ? 'none' : 'block',
        }}
      >
        {unitPlacer ? 'UNIT PLACE ON' : 'UNIT PLACE'}
      </button>
    )}
    {devMode && unitPlacer && !mapEditor && (
      <UnitPlacer
        brigades={brigades}
        side={placeSide}
        type={placeType}
        brigadeId={placeBrigadeId}
        onSideChange={setPlaceSide}
        onTypeChange={setPlaceType}
        onBrigadeChange={setPlaceBrigadeId}
      />
    )}
    <TimeControls />
    <UnitPanel />
    <DirectiveMenu />
    </div>
  )
}
