import { Marker } from 'react-map-gl/mapbox'
import { useGameStore } from '../store/gameStore'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { hexToLngLat } from '../utils/hexUtils'

export function HQLayer() {
  const brigades  = useGameStore(s => s.brigades)
  const selectHQ  = useGameStore(s => s.selectHQ)
  const selectCompany = useGameStore(s => s.selectCompany)

  return (
    <>
      {Array.from(brigades.values()).map(brigade => {
        const [lng, lat] = hexToLngLat(brigade.hqPosition.col, brigade.hqPosition.row)
        const img = BRIGADE_IMAGES[brigade.id]

        return (
          <Marker
            key={brigade.id}
            longitude={lng}
            latitude={lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              selectCompany(null)
              selectHQ(brigade.id)
            }}
          >
            <div style={{ position: 'relative', width: 80, height: 80, cursor: 'pointer' }}>

              {/* Пунктирне коло — радіус когезії */}
              <svg
                width={80}
                height={80}
                viewBox="0 0 80 80"
                style={{ position: 'absolute', top: 0, left: 0 }}
              >
                <circle
                  cx={40} cy={40} r={36}
                  fill="none"
                  stroke="#ffdd00"
                  strokeWidth={1.5}
                  strokeDasharray="5 4"
                  opacity={0.6}
                />
              </svg>

              {/* Шеврон по центру */}
              {img && (
                <img
                  src={img}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 44,
                    height: 44,
                    objectFit: 'contain',
                  }}
                />
              )}
            </div>
          </Marker>
        )
      })}
    </>
  )
}
