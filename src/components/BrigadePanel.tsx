import { useGameStore } from '../store/gameStore'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { Side } from '../units/types'
import { ACCENT, UI } from '../config/theme'

interface Props {
  selectedBrigadeId: string | null
  onSelect: (brigadeId: string | null) => void
  dimmed?: boolean
}

export function BrigadePanel({ selectedBrigadeId, onSelect, dimmed = false }: Props) {
  const brigades = useGameStore(s => s.brigades)

  const playerBrigades = Array.from(brigades.values())
    .filter(b => b.side === Side.Ukraine)

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: 12,
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      zIndex: 100,
      opacity: dimmed ? 0.35 : 1,
      transition: 'opacity 0.2s',
      pointerEvents: dimmed ? 'none' : 'auto',
    }}>
      {playerBrigades.map(brigade => {
        const isSelected = selectedBrigadeId === brigade.id
        const img = BRIGADE_IMAGES[brigade.id]

        return (
          <div
            key={brigade.id}
            onClick={() => onSelect(isSelected ? null : brigade.id)}
            title={brigade.name}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
              padding: '6px 8px',
              background: isSelected ? 'rgba(255,221,0,0.15)' : UI.black60,
              border: `1px solid ${isSelected ? ACCENT.yellow : UI.borderMuted}`,
              borderRadius: 6,
              cursor: 'pointer',
              width: 72,
              transition: 'border-color 0.15s, background 0.15s',
            }}
          >
            {img && (
              <img
                src={img}
                style={{ width: 'auto', height: 36, display: 'block' }}
              />
            )}
            <span style={{
              fontSize: 9,
              color: isSelected ? ACCENT.yellow : UI.textMuted,
              fontFamily: 'monospace',
              textAlign: 'center',
              lineHeight: 1.2,
              letterSpacing: '0.03em',
            }}>
              {brigade.shortName}
            </span>
          </div>
        )
      })}
    </div>
  )
}
