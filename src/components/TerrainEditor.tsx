import { TerrainType } from '../units/types'

interface Props {
  selected: TerrainType
  onChange: (t: TerrainType) => void
}

const TERRAIN_OPTIONS: { type: TerrainType; label: string; color: string }[] = [
  { type: TerrainType.Open,   label: 'Поле',    color: '#8bc34a' },
  { type: TerrainType.Forest, label: 'Ліс',     color: '#2e7d32' },
  { type: TerrainType.Urban,  label: 'Місто',   color: '#90a4ae' },
  { type: TerrainType.Water,  label: 'Вода',    color: '#1e88e5' },
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
            background: selected === type ? color : 'rgba(0,0,0,0.6)',
            color: '#fff',
            border: `1px solid ${selected === type ? color : '#555'}`,
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
