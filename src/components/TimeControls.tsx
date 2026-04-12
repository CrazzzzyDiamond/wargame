import { useGameStore } from '../store/gameStore'
import type { GameSpeed } from '../store/gameStore'

// Початок операції — 6 вересня 2022, 06:00 ранку
const OPERATION_START_EPOCH = new Date('2022-09-06T06:00:00').getTime()

function formatGameTime(elapsedSeconds: number): string {
  const totalMs   = OPERATION_START_EPOCH + elapsedSeconds * 1000
  const date      = new Date(totalMs)
  const day       = date.getUTCDate()
  const month     = date.getUTCMonth() + 1
  const hours     = String(date.getUTCHours()).padStart(2, '0')
  const minutes   = String(date.getUTCMinutes()).padStart(2, '0')
  return `${day}.${String(month).padStart(2, '0')} ${hours}:${minutes}`
}

const BUTTONS: { value: GameSpeed; label: string }[] = [
  { value: 'paused', label: '⏸' },
  { value: 'normal', label: '▶' },
  { value: 'fast',   label: '▶▶' },
]

export function TimeControls() {
  const speed         = useGameStore(s => s.speed)
  const elapsedSeconds = useGameStore(s => s.elapsedSeconds)
  const setSpeed      = useGameStore(s => s.setSpeed)

  return (
    <div style={{
      position: 'absolute',
      top: 16,
      left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(10, 14, 20, 0.88)',
      border: '1px solid rgba(255, 221, 0, 0.35)',
      borderRadius: 6,
      padding: '6px 14px',
      fontFamily: 'monospace',
      userSelect: 'none',
    }}>

      {/* Дата і час операції */}
      <div style={{ color: '#ffdd00', fontSize: 14, fontWeight: 'bold', minWidth: 100, textAlign: 'center' }}>
        {formatGameTime(elapsedSeconds)}
      </div>

      <div style={{ width: 1, height: 18, backgroundColor: 'rgba(255,221,0,0.25)' }} />

      {/* Кнопки швидкості */}
      {BUTTONS.map(btn => {
        const isActive = speed === btn.value
        return (
          <button
            key={btn.value}
            onClick={() => setSpeed(btn.value)}
            style={{
              background: isActive ? 'rgba(255,221,0,0.15)' : 'transparent',
              border: `1px solid ${isActive ? 'rgba(255,221,0,0.6)' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 4,
              color: isActive ? '#ffdd00' : '#8899aa',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 13,
              padding: '3px 10px',
              minWidth: 36,
            }}
          >
            {btn.label}
          </button>
        )
      })}
    </div>
  )
}
