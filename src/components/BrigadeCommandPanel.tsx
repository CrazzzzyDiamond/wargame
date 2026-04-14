import { useGameStore } from '../store/gameStore'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { ACCENT, UI } from '../config/theme'

interface Props {
  brigadeId: string
  planningMode: boolean
  onOccupy: () => void
  onClose: () => void
}

export function BrigadeCommandPanel({ brigadeId, planningMode, onOccupy, onClose }: Props) {
  const brigade = useGameStore(s => s.brigades.get(brigadeId))
  if (!brigade) return null

  const img = BRIGADE_IMAGES[brigadeId]

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: 96,
      transform: 'translateY(-50%)',
      width: 200,
      background: UI.bg,
      border: `1px solid ${ACCENT.blueDim}`,
      borderRadius: 8,
      padding: '12px 14px',
      zIndex: 101,
      display: 'flex',
      flexDirection: 'column',
      gap: 10,
    }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {img && <img src={img} style={{ height: 32, width: 'auto' }} />}
        <span style={{
          color: UI.text,
          fontFamily: 'monospace',
          fontSize: 11,
          fontWeight: 'bold',
          lineHeight: 1.3,
        }}>
          {brigade.shortName}
        </span>
        <div
          onClick={onClose}
          style={{
            marginLeft: 'auto',
            color: UI.textMuted,
            cursor: 'pointer',
            fontSize: 14,
            lineHeight: 1,
          }}
        >×</div>
      </div>

      <div style={{ height: 1, background: UI.border }} />

      {/* Кнопка зайняти позицію */}
      <button
        onClick={onOccupy}
        style={{
          padding: '6px 10px',
          background: planningMode ? ACCENT.yellow : 'rgba(255,221,0,0.1)',
          color: planningMode ? '#000' : ACCENT.yellow,
          border: `1px solid ${ACCENT.yellow}`,
          borderRadius: 4,
          fontSize: 11,
          fontFamily: 'monospace',
          cursor: 'pointer',
          letterSpacing: '0.04em',
          textAlign: 'left',
        }}
      >
        {planningMode ? '⌖ Оберіть гекс на карті...' : '⌖ Зайняти позицію'}
      </button>
    </div>
  )
}
