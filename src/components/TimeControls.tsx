import { useGameStore } from '../store/gameStore'
import type { GameSpeed } from '../store/gameStore'
import { OPERATION_START } from '../config/mapConfig'
import { ACCENT, UI } from '../config/theme'

const OPERATION_START_EPOCH = new Date(OPERATION_START).getTime()

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
      backgroundColor: UI.bgDark,
      border: `1px solid ${ACCENT.yellowDim}`,
      borderRadius: 6,
      padding: '6px 14px',
      fontFamily: 'monospace',
      userSelect: 'none',
    }}>

      {/* Дата і час операції */}
      <div style={{ color: ACCENT.yellow, fontSize: 14, fontWeight: 'bold', minWidth: 100, textAlign: 'center' }}>
        {formatGameTime(elapsedSeconds)}
      </div>

      <div style={{ width: 1, height: 18, backgroundColor: ACCENT.yellowGlow }} />

      {/* Кнопки швидкості */}
      {BUTTONS.map(btn => {
        const isActive = speed === btn.value
        return (
          <button
            key={btn.value}
            onClick={() => setSpeed(btn.value)}
            style={{
              background: isActive ? ACCENT.yellowFaint : 'transparent',
              border: `1px solid ${isActive ? ACCENT.yellowBorder : UI.overlay}`,
              borderRadius: 4,
              color: isActive ? ACCENT.yellow : UI.textMuted,
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 13,
              padding: '3px 10px',
              minWidth: 36,
              transition: 'filter 0.1s',
            }}
            onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.4)' }}
            onMouseLeave={e => { e.currentTarget.style.filter = '' }}
          >
            {btn.label}
          </button>
        )
      })}
    </div>
  )
}
