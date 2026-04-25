import { useEffect, useCallback, useState, useMemo } from 'react'
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
import { INITIAL_VIEW, MAP_BOUNDS } from './config/mapConfig'
import { lngLatToHex, hexLngLatVertices } from './utils/hexUtils'
import { loadTerrainCache, analyzeAndCacheTerrain, saveTerrainCache } from './utils/terrainAnalysis'
import { LoadingScreen } from './components/LoadingScreen'
import { usePreloader } from './utils/usePreloader'
import { BrigadePanel } from './components/BrigadePanel'
import { BrigadeCommandPanel } from './components/BrigadeCommandPanel'
import { TerrainEditor } from './components/TerrainEditor'
import { UnitPlacer } from './components/UnitPlacer'
import { Company } from './units/Company'
import { playUnitSound } from './utils/unitSounds'
import { playBrigadeSelectSound, playBrigadeMoveSound } from './utils/brigadeSound'
import { CompanyType, Side, TerrainType } from './units/types'
import { MAP, TERRAIN_COLORS, DEV, UI } from './config/theme'
import type { HexPosition } from './units/Company'

// Інтервал тіку в мілісекундах реального часу
const TICK_INTERVAL_MS = 500

const TICK_DELTA_SEC    = TICK_INTERVAL_MS / 1000

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN



export default function App() {
  const { addBrigade, addBattalion, addCompany, selectedCompanyId, companies, brigades, moveCompany, moveBrigade, selectCompany, tick, setTerrainMap, setHexTerrain, setZoom, setAttackTarget, setAssaultTarget, terrainMap } = useGameStore()

  const [hoveredHex, setHoveredHex] = useState<HexPosition | null>(null)
  const [selectedBrigadeId, setSelectedBrigadeId] = useState<string | null>(null)
  const [brigadePlanningMode, setBrigadePlanningMode] = useState(false)
  const [mapReady, setMapReady] = useState(false)
  const { ready: assetsReady, progress } = usePreloader()
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
    if (brigadePlanningMode && selectedBrigadeId) {
      const { col, row } = lngLatToHex(e.lngLat.lng, e.lngLat.lat)
      moveBrigade(selectedBrigadeId, { col, row })
      setBrigadePlanningMode(false)
      playBrigadeMoveSound()
      return
    }
    if (selectedCompanyId) selectCompany(null)
    if (selectedBrigadeId) setSelectedBrigadeId(null)
  }, [devMode, mapEditor, unitPlacer, editTerrain, placeSide, placeType, placeBrigadeId, selectedCompanyId, selectedBrigadeId, brigadePlanningMode, selectCompany, setHexTerrain, addCompany, moveBrigade])

  // Правий клік — перемістити вибраний юніт
  const handleMapRightClick = useCallback((e: MapMouseEvent) => {
    if (!selectedCompanyId) return
    e.preventDefault()
    const { companies } = useGameStore.getState()
    const company = companies.get(selectedCompanyId)
    const hex = lngLatToHex(e.lngLat.lng, e.lngLat.lat)

    const enemyOnHex = Array.from(companies.values()).find(c =>
      c.side !== company?.side && c.position?.col === hex.col && c.position?.row === hex.row
    )

    if (company?.type === CompanyType.Artillery && enemyOnHex) {
      // Артилерія + ворог на гексі → встановити ціль атаки
      setAttackTarget(selectedCompanyId, hex)
      playUnitSound(company.type, 'attack')
    } else if (enemyOnHex && company?.type !== CompanyType.Artillery) {
      // Піхота/танк + ворог на гексі → наказ штурму
      setAssaultTarget(selectedCompanyId, enemyOnHex.id)
      playUnitSound(company!.type, 'attack')
    } else {
      // Порожній гекс → рух, скасовуємо штурм
      setAssaultTarget(selectedCompanyId, null)
      playUnitSound(company!.type, 'move')
      moveCompany(selectedCompanyId, hex)
    }
  }, [selectedCompanyId, moveCompany, setAssaultTarget])

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
  // Перераховується лише при зміні companies (кожен тік), не при русі миші
  const occupiedHexGeoJSON = useMemo((): FeatureCollection => ({
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
  }), [companies])

  // GeoJSON цільових гексів юнітів що рухаються (жовтий — куди йдуть)
  const movingHexGeoJSON = useMemo((): FeatureCollection => ({
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
  }), [companies])

  // GeoJSON terrain для dev-режиму (кольорові гекси по типу)
  const devTerrainGeoJSON = useMemo((): FeatureCollection => {
    if (!devMode) return { type: 'FeatureCollection', features: [] }
    const colorByType: Partial<Record<TerrainType, string>> = {
      [TerrainType.Forest]: TERRAIN_COLORS.forest,
      [TerrainType.Urban]:  TERRAIN_COLORS.urban,
      [TerrainType.Water]:  TERRAIN_COLORS.water,
    }
    return {
      type: 'FeatureCollection',
      features: Array.from(terrainMap.entries())
        .filter(([, t]) => t !== TerrainType.Open)
        .map(([key, t]) => {
          const [col, row] = key.split(',').map(Number)
          return {
            type: 'Feature' as const,
            properties: { color: colorByType[t] ?? '#888' },
            geometry: { type: 'Polygon' as const, coordinates: [hexLngLatVertices(col, row)] },
          }
        }),
    }
  }, [terrainMap, devMode])

  // GeoJSON підсвіченого гексу (жовтий — hover)
  const hexHighlightGeoJSON = useMemo((): FeatureCollection => {
    if (!hoveredHex || !(selectedCompanyId || (devMode && (mapEditor || unitPlacer)))) {
      return { type: 'FeatureCollection', features: [] }
    }
    return {
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
  }, [hoveredHex, selectedCompanyId, devMode, mapEditor, unitPlacer])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', cursor: brigadePlanningMode ? 'crosshair' : 'default' }}>
    <Map

      initialViewState={INITIAL_VIEW}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
      mapboxAccessToken={MAPBOX_TOKEN}
      minZoom={7}
      maxZoom={13}
      maxBounds={MAP_BOUNDS}
      onLoad={() => setMapReady(true)}
      onClick={handleMapClick}
      onContextMenu={handleMapRightClick}
      onZoom={e => setZoom(e.viewState.zoom)}
      onMouseMove={handleMouseMove}

    >
      <Source type="geojson" data={hexGridGeoJSON}>
        <Layer
          id="hex-grid"
          type="line"
          paint={{
            'line-color': MAP.hexGrid,
            'line-opacity': 0.7,
            'line-width': 1.5,
          }}
        />
      </Source>

      <Source type="geojson" data={hexHighlightGeoJSON}>
        <Layer
          id="hex-highlight"
          type="fill"
          paint={{ 'fill-color': MAP.hexMoving, 'fill-opacity': 0.18 }}
        />
        <Layer
          id="hex-highlight-border"
          type="line"
          paint={{ 'line-color': MAP.hexMoving, 'line-opacity': 0.7, 'line-width': 1.5 }}
        />
      </Source>

      <Source type="geojson" data={occupiedHexGeoJSON}>
        <Layer
          id="occupied-hex-fill"
          type="fill"
          paint={{ 'fill-color': MAP.hexOccupied, 'fill-opacity': 0.18 }}
        />
        <Layer
          id="occupied-hex-border"
          type="line"
          paint={{ 'line-color': MAP.hexOccupied, 'line-opacity': 0.8, 'line-width': 2 }}
        />
      </Source>

      <Source type="geojson" data={movingHexGeoJSON}>
        <Layer
          id="moving-hex-fill"
          type="fill"
          paint={{ 'fill-color': MAP.hexMoving, 'fill-opacity': 0.22 }}
        />
        <Layer
          id="moving-hex-border"
          type="line"
          paint={{ 'line-color': MAP.hexMoving, 'line-opacity': 0.95, 'line-width': 2 }}
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

      <UnitLayer devMode={devMode} selectedBrigadeId={selectedBrigadeId} />
    </Map>
    <button
      onClick={() => setDevMode(v => !v)}
      style={{
        position: 'absolute',
        top: 12,
        right: 12,
        padding: '4px 10px',
        background: devMode ? DEV.on : UI.black60,
        color: devMode ? UI.white : UI.textMuted,
        border: `1px solid ${devMode ? DEV.on : UI.borderMuted}`,
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
          background: mapEditor ? DEV.mapEdit : UI.black60,
          color: mapEditor ? UI.white : UI.textMuted,
          border: `1px solid ${mapEditor ? DEV.mapEdit : UI.borderMuted}`,
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
          background: unitPlacer ? DEV.unitPlace : UI.black60,
          color: unitPlacer ? UI.white : UI.textMuted,
          border: `1px solid ${unitPlacer ? DEV.unitPlace : UI.borderMuted}`,
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
    <BrigadePanel selectedBrigadeId={selectedBrigadeId} onSelect={(id) => {
      setSelectedBrigadeId(id)
      setBrigadePlanningMode(false)
      if (id) {
        const brigade = brigades.get(id)
        if (brigade) playBrigadeSelectSound(brigade.shortName)
      }
    }} dimmed={!!selectedCompanyId} />
    {selectedBrigadeId && !selectedCompanyId && (
      <BrigadeCommandPanel
        brigadeId={selectedBrigadeId}
        planningMode={brigadePlanningMode}
        onOccupy={() => setBrigadePlanningMode(v => !v)}
        onClose={() => { setSelectedBrigadeId(null); setBrigadePlanningMode(false) }}
      />
    )}
    <TimeControls />
    <UnitPanel />
    <DirectiveMenu />
    <LoadingScreen ready={mapReady && assetsReady} progress={progress} />
    </div>
  )
}
