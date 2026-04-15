import { useEffect, useMemo, useRef, useState } from 'react'
import { useMap } from 'react-map-gl/mapbox'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import mapboxgl from 'mapbox-gl'
import { useGameStore } from '../store/gameStore'
import { UnitIcon } from './UnitIcon'
import { hexToLngLat } from '../utils/hexUtils'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { CompanyType, Side, EntrenchState } from '../units/types'
import type { Company } from '../units/Company'
import { buildVisibleHexSet, isEnemyVisible } from '../utils/visibility'
import { playUnitSound } from '../utils/unitSounds'
import battleGun from '../sound/events/battle_gun.wav'
import './UnitIndicators.css'
import { SIDE_COLORS, ACCENT, UI, DEV } from '../config/theme'

// Піхотні типи що генерують звук бою
const INFANTRY_TYPES = new Set([CompanyType.Line, CompanyType.Assault])

// Коефіцієнт інтерполяції за кадр
const LERP = 0.08

// Частота анімації позицій — не потрібно 60fps для повільних юнітів
const ANIM_INTERVAL = 1000 / 20

interface AnimatedPos { lng: number; lat: number }

// Розмір іконки залежно від zoom
function iconSize(zoom: number): number {
  const t = Math.max(0, Math.min(1, (zoom - 7) / (13 - 7)))
  return Math.round(20 + t * 28)
}

// ─── Вміст одного маркера ───────────────────────────────────────────────────
// Рендериться через ReactDOM.createRoot в окремий DOM-вузол,
// який передається нативному mapboxgl.Marker.
// Оновлюється лише при зміні ігрового стану (тік, вибір), а не при анімації.

interface MarkerContentProps {
  company:           Company
  selectedId:        string | null
  selectedBrigadeId: string | null
  devMode:           boolean
  zoom:              number
  onSelect:          () => void
  onRemove:          () => void
}

function MarkerContent({
  company, selectedId, selectedBrigadeId, devMode, zoom, onSelect, onRemove,
}: MarkerContentProps) {
  const isEnemy          = company.side === Side.Russia
  const barColor         = isEnemy ? SIDE_COLORS.russia : SIDE_COLORS.ukraine
  const isBrigadeGlow    = selectedBrigadeId === company.brigadeId
  const size             = iconSize(zoom)

  return (
    <div
      style={{
        cursor: isEnemy ? (selectedId ? 'crosshair' : 'default') : 'pointer',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
        background: 'transparent', position: 'relative',
        filter: isBrigadeGlow
          ? 'drop-shadow(0 0 6px #ffdd00) drop-shadow(0 0 12px #ffdd0088)'
          : 'none',
      }}
      onClick={e => { e.stopPropagation(); if (!isEnemy) onSelect() }}
    >
      {/* Кнопка видалення в dev-режимі */}
      {devMode && (
        <div
          onClick={e => { e.stopPropagation(); onRemove() }}
          style={{
            position: 'absolute', top: -6, right: -6,
            width: 14, height: 14,
            background: DEV.deleteBtn, color: UI.white,
            borderRadius: '50%', fontSize: 10, lineHeight: '14px',
            textAlign: 'center', cursor: 'pointer', zIndex: 10, userSelect: 'none',
          }}
        >×</div>
      )}

      {/* Індикатори стану над юнітом */}
      <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {company.inCombat && (
          <div className="unit-crosshair"><div className="unit-crosshair-ring" /></div>
        )}
        {!company.inCombat && company.isSuppressed && (
          <span className="unit-suppressed">!</span>
        )}
        {!company.inCombat && company.entrenchState === EntrenchState.Entrenched && (
          <span className="unit-shield">▣</span>
        )}
        {!company.inCombat && company.entrenchState === EntrenchState.Entrenching && (
          <span className="unit-entrenching">⛏</span>
        )}
        {!company.inCombat && company.targetHex && (
          <div style={{ display: 'flex', gap: 1 }}>
            <span className="unit-arrow">▶</span>
            <span className="unit-arrow">▶</span>
            <span className="unit-arrow">▶</span>
          </div>
        )}
      </div>

      {/* Шеврон + іконка */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
        <div style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
          <div style={{ width: `${company.strength}%`, height: '100%', backgroundColor: barColor }} />
        </div>
        <div style={{
          display: 'flex', flexDirection: 'row', alignItems: 'center',
          border: selectedId === company.id ? `1px solid ${ACCENT.yellow}` : `1px solid ${UI.borderDark}`,
          borderRadius: '0 0 3px 3px', overflow: 'hidden', background: 'rgba(0,0,0,0.35)',
        }}>
          {BRIGADE_IMAGES[company.brigadeId] && (
            <img
              src={BRIGADE_IMAGES[company.brigadeId]}
              style={{ width: 'auto', height: size, display: 'block', flexShrink: 0 }}
            />
          )}
          <UnitIcon type={company.type} selected={selectedId === company.id} enemy={isEnemy} size={size} />
        </div>
      </div>
    </div>
  )
}

// ─── UnitLayer ───────────────────────────────────────────────────────────────

export function UnitLayer({
  devMode = false,
  selectedBrigadeId = null,
}: {
  devMode?: boolean
  selectedBrigadeId?: string | null
}) {
  const companies     = useGameStore(s => s.companies)
  const selectedId    = useGameStore(s => s.selectedCompanyId)
  const selectCompany = useGameStore(s => s.selectCompany)
  const removeCompany = useGameStore(s => s.removeCompany)

  const { current: map } = useMap()

  // Нативні Mapbox маркери та їх React roots — живуть поза React-деревом
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map())
  const rootsRef   = useRef<Map<string, Root>>(new Map())

  // Інтерпольовані позиції для плавної анімації
  const animPos = useRef<Map<string, AnimatedPos>>(new Map())

  // Zoom як стан — зміна перемальовує вміст маркерів (розмір іконок)
  const [zoom, setZoom] = useState(9)
  useEffect(() => {
    if (!map) return
    const onZoom = () => {
      // Округлюємо до 0.5 щоб не тригерити оновлення на кожен піксель zoom
      const z = Math.round(map.getZoom() * 2) / 2
      setZoom(prev => prev === z ? prev : z)
    }
    map.on('zoom', onZoom)
    return () => { map.off('zoom', onZoom) }
  }, [map])

  // Звук бою
  const battleAudioRef = useRef<HTMLAudioElement | null>(null)
  useEffect(() => () => { battleAudioRef.current?.pause() }, [])

  // Туман війни — перераховується тільки при зміні companies (кожен тік)
  const visibleHexes = useMemo(() => buildVisibleHexSet(companies), [companies])

  // ── Синхронізація маркерів з ігровим станом ──────────────────────────────
  // Викликається при тіку, виборі юніта/бригади, zoom, devMode.
  // НЕ викликається при анімації позицій → нуль зайвих ре-рендерів.
  useEffect(() => {
    if (!map) return
    const mapInstance = map.getMap()

    // Звук бою
    const anyFight = Array.from(companies.values()).some(c =>
      INFANTRY_TYPES.has(c.type) && (c.inCombat || c.isSuppressed)
    )
    if (anyFight && !battleAudioRef.current) {
      const audio = new Audio(battleGun)
      audio.volume = 0.6; audio.loop = true
      audio.play().catch(() => {})
      battleAudioRef.current = audio
    } else if (!anyFight && battleAudioRef.current) {
      battleAudioRef.current.pause()
      battleAudioRef.current.currentTime = 0
      battleAudioRef.current = null
    }

    // Видаляємо маркери знищених рот
    for (const [id, marker] of markersRef.current) {
      if (!companies.has(id)) {
        marker.remove()
        rootsRef.current.get(id)?.unmount()
        markersRef.current.delete(id)
        rootsRef.current.delete(id)
        animPos.current.delete(id)
      }
    }

    // Додаємо нові маркери / оновлюємо вміст існуючих
    for (const [id, company] of companies) {
      if (!company.isDeployed() || !company.position) continue

      const visible = devMode || isEnemyVisible(company, visibleHexes, companies)

      if (!markersRef.current.has(id)) {
        // Перша поява роти — створюємо нативний маркер
        const el = document.createElement('div')
        const root = createRoot(el)

        const [lng, lat] = hexToLngLat(company.position.col, company.position.row)
        animPos.current.set(id, { lng, lat })

        const marker = new mapboxgl.Marker({ element: el, anchor: 'center' })
          .setLngLat([lng, lat])
          .addTo(mapInstance)

        markersRef.current.set(id, marker)
        rootsRef.current.set(id, root)
      }

      // Туман війни — show/hide без ре-рендеру React
      markersRef.current.get(id)!.getElement().style.display = visible ? '' : 'none'

      // Оновлюємо React-вміст маркера (strength bar, індикатори, вибір)
      rootsRef.current.get(id)!.render(
        <MarkerContent
          company={company}
          selectedId={selectedId}
          selectedBrigadeId={selectedBrigadeId}
          devMode={devMode}
          zoom={zoom}
          onSelect={() => {
            const already = selectedId === id
            if (!already) playUnitSound(company.type, 'select')
            selectCompany(already ? null : id)
          }}
          onRemove={() => removeCompany(id)}
        />
      )
    }
  }, [companies, selectedId, selectedBrigadeId, devMode, zoom, visibleHexes, map, selectCompany, removeCompany])

  // Cleanup при розмонтуванні компонента
  useEffect(() => () => {
    for (const m of markersRef.current.values()) m.remove()
    for (const r of rootsRef.current.values()) r.unmount()
    markersRef.current.clear()
    rootsRef.current.clear()
  }, [])

  // ── rAF: анімація позицій напряму через marker.setLngLat() ───────────────
  // Тут React не задіяний взагалі — позиції оновлюються через Mapbox API.
  useEffect(() => {
    let frameId: number
    let lastTime = 0

    const animate = (timestamp: number) => {
      frameId = requestAnimationFrame(animate)
      if (timestamp - lastTime < ANIM_INTERVAL) return
      lastTime = timestamp

      for (const [id, company] of companies) {
        if (!company.isDeployed() || !company.position) continue
        const marker = markersRef.current.get(id)
        if (!marker) continue

        const [targetLng, targetLat] = hexToLngLat(company.position.col, company.position.row)
        const cur = animPos.current.get(id) ?? { lng: targetLng, lat: targetLat }

        const dx = targetLng - cur.lng
        const dy = targetLat - cur.lat

        const next = Math.hypot(dx, dy) < 0.00005
          ? { lng: targetLng, lat: targetLat }
          : { lng: cur.lng + dx * LERP, lat: cur.lat + dy * LERP }

        animPos.current.set(id, next)
        marker.setLngLat([next.lng, next.lat])
      }
    }

    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [companies])

  // Маркери живуть поза React-деревом — компонент нічого не рендерить
  return null
}
