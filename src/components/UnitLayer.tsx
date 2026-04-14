import { useEffect, useRef, useState } from 'react'
import { Marker, useMap } from 'react-map-gl/mapbox'
import { useGameStore } from '../store/gameStore'
import { UnitIcon } from './UnitIcon'
import { hexToLngLat } from '../utils/hexUtils'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { BrigadeType, Side, EntrenchState } from '../units/types'
import { buildVisibleHexSet, isEnemyVisible } from '../utils/visibility'
import { playSound } from '../utils/sound'
import { playUnitSound } from '../utils/unitSounds'
import airSelect from '../sound/air-select.mp3'
import './UnitIndicators.css'

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

export function UnitLayer() {
  const companies     = useGameStore(s => s.companies)
  const brigades      = useGameStore(s => s.brigades)
  const selectedId    = useGameStore(s => s.selectedCompanyId)
  const selectCompany = useGameStore(s => s.selectCompany)

  const { current: map } = useMap()
  const [zoom, setZoom] = useState(() => map?.getZoom() ?? 9)

  useEffect(() => {
    if (!map) return
    const onZoom = () => setZoom(map.getZoom())
    map.on('zoom', onZoom)
    return () => { map.off('zoom', onZoom) }
  }, [map])

  // Поточні анімовані позиції — не в стейті, бо оновлюємо кожен кадр через ref
  const animPos = useRef<Map<string, AnimatedPos>>(new Map())

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
        .filter(c => isEnemyVisible(c, visibleHexes, companies))
        .map(company => {
          const pos = animPos.current.get(company.id)
          if (!pos) return null

          const isEnemy = company.side === Side.Russia
          const barColor = isEnemy ? '#e74c3c' : '#4caf50'

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
                  const played = playUnitSound(company.type, 'select')
                  if (!played) {
                    const brigade = brigades.get(company.brigadeId)
                    if (brigade?.type === BrigadeType.DSV) playSound(airSelect)
                  }
                }
                selectCompany(isAlreadySelected ? null : company.id)
              }}
            >
              <div style={{ cursor: isEnemy ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent' }}>
                {/* Індикатори стану над юнітом */}
                <div style={{ height: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {company.inCombat && (
                    <div className="unit-crosshair">
                      <div className="unit-crosshair-ring" />
                    </div>
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
                    border: selectedId === company.id ? '1px solid #ffdd00' : '1px solid rgba(0,0,0,0.6)',
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
