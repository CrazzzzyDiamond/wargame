import { useEffect, useRef, useState } from 'react'
import { Marker } from 'react-map-gl/mapbox'
import { useGameStore } from '../store/gameStore'
import { UnitIcon } from './UnitIcon'
import { hexToLngLat } from '../utils/hexUtils'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'

interface AnimatedPos {
  lng: number
  lat: number
}

// Коефіцієнт інтерполяції за кадр — менше = плавніше і повільніше
const LERP = 0.08

export function UnitLayer() {
  const companies    = useGameStore(s => s.companies)
  const selectedId   = useGameStore(s => s.selectedCompanyId)
  const selectCompany = useGameStore(s => s.selectCompany)

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

  return (
    <>
      {Array.from(companies.values())
        .filter(c => c.isDeployed())
        .map(company => {
          const pos = animPos.current.get(company.id)
          if (!pos) return null

          return (
            <Marker
              key={company.id}
              longitude={pos.lng}
              latitude={pos.lat}
              anchor="center"
              onClick={(e) => {
                e.originalEvent.stopPropagation()
                selectCompany(selectedId === company.id ? null : company.id)
              }}
            >
              <div style={{ cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, background: 'transparent' }}>
                {BRIGADE_IMAGES[company.brigadeId] && (
                  <img
                    src={BRIGADE_IMAGES[company.brigadeId]}
                    style={{
                      width: 44,
                      height: 44,
                      objectFit: 'contain',
                      display: 'block',
                      filter: selectedId === company.id ? 'drop-shadow(0 0 3px #ffdd00)' : 'drop-shadow(0 0 2px rgba(0,0,0,0.8))',
                    }}
                  />
                )}
                <UnitIcon
                  type={company.type}
                  selected={selectedId === company.id}
                />
              </div>
            </Marker>
          )
        })}
    </>
  )
}
