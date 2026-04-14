import { TerrainType } from '../units/types'
import { TERRAIN_COLORS, UI } from '../config/theme'

interface Props {
  selected: TerrainType
  onChange: (t: TerrainType) => void
}

const TERRAIN_OPTIONS: { type: TerrainType; label: string; color: string }[] = [
  { type: TerrainType.Open,   label: 'Поле',    color: TERRAIN_COLORS.open },
  { type: TerrainType.Forest, label: 'Ліс',     color: TERRAIN_COLORS.forest },
  { type: TerrainType.Urban,  label: 'Місто',   color: TERRAIN_COLORS.urban },
  { type: TerrainType.Water,  label: 'Вода',    color: TERRAIN_COLORS.water },
]

export function TerrainEditor({ selected, onChange }: Props) {
  return (
    <div style={{
      position: 'absolute',
      top: 108,
      right: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      zIndex: 100,
    }}>
      {TERRAIN_OPTIONS.map(({ type, label, color }) => (
        <button
          key={type}
          onClick={() => onChange(type)}
          style={{
            padding: '4px 10px',
            background: selected === type ? color : UI.black60,
            color: UI.white,
            border: `1px solid ${selected === type ? color : UI.borderMuted}`,
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'monospace',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{
            width: 8,
            height: 8,
            borderRadius: 2,
            background: color,
            display: 'inline-block',
            flexShrink: 0,
          }} />
          {label}
        </button>
      ))}
    </div>
  )
}
