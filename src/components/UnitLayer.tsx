import { useEffect, useRef, useState } from 'react'
import { Marker, useMap } from 'react-map-gl/mapbox'
import { useGameStore } from '../store/gameStore'
import { UnitIcon } from './UnitIcon'
import { hexToLngLat } from '../utils/hexUtils'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { CompanyType, Side, EntrenchState } from '../units/types'
import { buildVisibleHexSet, isEnemyVisible } from '../utils/visibility'
import { playSound } from '../utils/sound'
import { playUnitSound } from '../utils/unitSounds'
import battleGun from '../sound/events/battle_gun.wav'
import './UnitIndicators.css'
import { SIDE_COLORS, ACCENT, UI, DEV } from '../config/theme'

// Піхотні типи що генерують звук бою
const INFANTRY_TYPES = new Set([CompanyType.Line, CompanyType.Assault])

interface AnimatedPos {
  lng: number
  lat: number
}

// Коефіцієнт інтерполяції за кадр — менше = плавніше і повільніше
const LERP = 0.08

// Розмір іконки залежно від zoom: zoom 7 → 24px, zoom 13 → 64px
function iconSize(zoom: number): number {
  const t = Math.max(0, Math.min(1, (zoom - 7) / (13 - 7)))
  return Math.round(20 + t * 28)
}

export function UnitLayer({ devMode = false }: { devMode?: boolean }) {
  const companies      = useGameStore(s => s.companies)
  const brigades       = useGameStore(s => s.brigades)
  const selectedId     = useGameStore(s => s.selectedCompanyId)
  const selectCompany  = useGameStore(s => s.selectCompany)
  const removeCompany  = useGameStore(s => s.removeCompany)

  const { current: map } = useMap()
  const [zoom, setZoom] = useState(() => map?.getZoom() ?? 9)

  // Поточні анімовані позиції — не в стейті, бо оновлюємо кожен кадр через ref
  const animPos = useRef<Map<string, AnimatedPos>>(new Map())

  // Аудіо об'єкт звуку бою — зберігаємо щоб зупинити коли бій закінчиться
  const battleAudioRef = useRef<HTMLAudioElement | null>(null)

  // Зупиняємо звук бою при розмонтуванні компонента
  useEffect(() => {
    return () => {
      battleAudioRef.current?.pause()
      battleAudioRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!map) return
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoom', onZoom)
    return () => { map.off('zoom', onZoom) }
  }, [map])

  useEffect(() => {
    const anyInfantryInFight = Array.from(companies.values()).some(c =>
      INFANTRY_TYPES.has(c.type) && (c.inCombat || c.isSuppressed)
    )

    if (anyInfantryInFight && !battleAudioRef.current) {
      // Починаємо бій — запускаємо звук циклічно
      const audio = new Audio(battleGun)
      audio.volume = 0.6
      audio.loop   = true
      audio.play().catch(() => {})
      battleAudioRef.current = audio
    } else if (!anyInfantryInFight && battleAudioRef.current) {
      // Бій закінчився — зупиняємо
      battleAudioRef.current.pause()
      battleAudioRef.current.currentTime = 0
      battleAudioRef.current = null
    }
  }, [companies])

  // Лічильник для примусового ре-рендеру під час анімації
  const [, setTick] = useState(0)

  useEffect(() => {
    let frameId: number

    const animate = () => {
      let moving = false

      for (const [id, company] of companies) {
        if (!company.isDeployed()) continue

        const [targetLng, targetLat] = hexToLngLat(company.position!.col, company.position!.row)
        const existing = animPos.current.get(id)

        if (!existing) {
          // Перша поява юніта — одразу ставимо на місце і тригеримо рендер
          animPos.current.set(id, { lng: targetLng, lat: targetLat })
          moving = true
          continue
        }

        const dx = targetLng - existing.lng
        const dy = targetLat - existing.lat
        const dist = Math.hypot(dx, dy)

        if (dist < 0.00005) {
          animPos.current.set(id, { lng: targetLng, lat: targetLat })
        } else {
          animPos.current.set(id, {
            lng: existing.lng + dx * LERP,
            lat: existing.lat + dy * LERP,
          })
          moving = true
        }
      }

      if (moving) setTick(t => t + 1)
      frameId = requestAnimationFrame(animate)
    }

    frameId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(frameId)
  }, [companies])

  const visibleHexes = buildVisibleHexSet(companies)

  return (
    <>
      {Array.from(companies.values())
        .filter(c => c.isDeployed())
        .filter(c => devMode || isEnemyVisible(c, visibleHexes, companies))
        .map(company => {
          const pos = animPos.current.get(company.id)
          if (!pos) return null

          const isEnemy = company.side === Side.Russia
          const barColor = isEnemy ? SIDE_COLORS.russia : SIDE_COLORS.ukraine

          return (
            <Marker
              key={company.id}
              longitude={pos.lng}
              latitude={pos.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                if (isEnemy) return  // ворожі юніти не вибираються
                const isAlreadySelected = selectedId === company.id
                if (!isAlreadySelected) {
                  playUnitSound(company.type, 'select')
                }
                selectCompany(isAlreadySelected ? null : company.id)
              }}
            >
              <div style={{ cursor: isEnemy ? (selectedId ? 'crosshair' : 'default') : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent', position: 'relative' }}>
                {/* Кнопка видалення в dev-режимі */}
                {devMode && (
                  <div
                    onClick={e => { e.stopPropagation(); removeCompany(company.id) }}
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      width: 14,
                      height: 14,
                      background: DEV.deleteBtn,
                      color: UI.white,
                      borderRadius: '50%',
                      fontSize: 10,
                      lineHeight: '14px',
                      textAlign: 'center',
                      cursor: 'pointer',
                      zIndex: 10,
                      userSelect: 'none',
                    }}
                  >×</div>
                )}
                {/* Індикатори стану над юнітом */}
                <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {company.inCombat && (
                    <div className="unit-crosshair">
                      <div className="unit-crosshair-ring" />
                    </div>
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

                {/* Шеврон + іконка — єдиний прямокутник */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}>
                  {/* Полоска strength на всю ширину */}
                  <div style={{ height: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: '2px 2px 0 0', overflow: 'hidden' }}>
                    <div style={{ width: `${company.strength}%`, height: '100%', backgroundColor: barColor }} />
                  </div>
                  {/* Шеврон і іконка в рядок — однакова висота */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    border: selectedId === company.id ? `1px solid ${ACCENT.yellow}` : `1px solid ${UI.borderDark}`,
                    borderRadius: '0 0 3px 3px',
                    overflow: 'hidden',
                    background: 'rgba(0,0,0,0.35)',
                  }}>
                    {BRIGADE_IMAGES[company.brigadeId] && (
                      <img
                        src={BRIGADE_IMAGES[company.brigadeId]}
                        style={{
                          width: 'auto',
                          height: iconSize(zoom),
                          display: 'block',
                          flexShrink: 0,
                        }}
                      />
                    )}
                    <UnitIcon
                      type={company.type}
                      selected={selectedId === company.id}
                      enemy={isEnemy}
                      size={iconSize(zoom)}
                    />
                  </div>
                </div>
              </div>
            </Marker>
          )
        })}
    </>
  )
}
