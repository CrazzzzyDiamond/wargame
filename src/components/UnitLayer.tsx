import { useEffect, useRef, useState } from 'react'
import { Marker, useMap } from 'react-map-gl/mapbox'
import { useGameStore } from '../store/gameStore'
import { UnitIcon } from './UnitIcon'
import { hexToLngLat } from '../utils/hexUtils'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { BrigadeType, Side } from '../units/types'
import { buildVisibleHexSet, isEnemyVisible } from '../utils/visibility'
import { playSound } from '../utils/sound'
import airSelect from '../sound/air-select.mp3'

interface AnimatedPos {
  lng: number
  lat: number
}

// Коефіцієнт інтерполяції за кадр — менше = плавніше і повільніше
const LERP = 0.08

// Розмір іконки залежно від zoom: zoom 7 → 24px, zoom 13 → 64px
function iconSize(zoom: number): number {
  const t = Math.max(0, Math.min(1, (zoom - 7) / (13 - 7)))
  return Math.round(34 + t * 48)
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
        .filter(c => isEnemyVisible(c, visibleHexes))
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
                  const brigade = brigades.get(company.brigadeId)
                  if (brigade?.type === BrigadeType.DSV) playSound(airSelect)
                }
                selectCompany(isAlreadySelected ? null : company.id)
              }}
            >
              <div style={{ cursor: isEnemy ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent' }}>
                {/* Полоска strength над іконкою */}
                <div style={{ width: iconSize(zoom), height: 4, backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${company.strength}%`,
                    height: '100%',
                    borderRadius: 2,
                    backgroundColor: barColor,
                  }} />
                </div>
                {BRIGADE_IMAGES[company.brigadeId] && (
                  <img
                    src={BRIGADE_IMAGES[company.brigadeId]}
                    style={{
                      width: iconSize(zoom),
                      height: iconSize(zoom),
                      objectFit: 'contain',
                      display: 'block',
                      filter: selectedId === company.id ? 'drop-shadow(0 0 3px #ffdd00)' : 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
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
            </Marker>
          )
        })}
    </>
  )
}
