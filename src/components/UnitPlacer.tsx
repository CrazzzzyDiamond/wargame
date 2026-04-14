import { useState } from 'react'
import { CompanyType, Side } from '../units/types'
import type { Brigade } from '../units/Brigade'

interface Props {
  brigades: Map<string, Brigade>
  side: Side
  type: CompanyType
  brigadeId: string
  onSideChange: (s: Side) => void
  onTypeChange: (t: CompanyType) => void
  onBrigadeChange: (id: string) => void
}

const COMPANY_TYPES: { type: CompanyType; label: string }[] = [
  { type: CompanyType.Line,      label: 'Лінійна' },
  { type: CompanyType.Assault,   label: 'Штурмова' },
  { type: CompanyType.Tank,      label: 'Танкова' },
  { type: CompanyType.Artillery, label: 'Артилерія' },
  { type: CompanyType.Recon,     label: 'Розвідка' },
  { type: CompanyType.Special,   label: 'ССО' },
  { type: CompanyType.UAV,       label: 'БПЛА' },
]

export function UnitPlacer({ brigades, side, type, brigadeId, onSideChange, onTypeChange, onBrigadeChange }: Props) {
  const brigadeList = Array.from(brigades.values())

  return (
    <div style={{
      position: 'absolute',
      top: 108,
      right: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      zIndex: 100,
      minWidth: 130,
    }}>
      {/* Сторона */}
      <div style={{ display: 'flex', gap: 4 }}>
        {[Side.Ukraine, Side.Russia].map(s => (
          <button
            key={s}
            onClick={() => onSideChange(s)}
            style={{
              flex: 1,
              padding: '3px 6px',
              background: side === s ? (s === Side.Ukraine ? '#1565c0' : '#b71c1c') : 'rgba(0,0,0,0.6)',
              color: '#fff',
              border: `1px solid ${side === s ? (s === Side.Ukraine ? '#1565c0' : '#b71c1c') : '#555'}`,
              borderRadius: 4,
              fontSize: 11,
              cursor: 'pointer',
              fontFamily: 'monospace',
            }}
          >
            {s === Side.Ukraine ? 'УКР' : 'РФ'}
          </button>
        ))}
      </div>

      {/* Бригада */}
      <select
        value={brigadeId}
        onChange={e => onBrigadeChange(e.target.value)}
        style={{
          padding: '3px 6px',
          background: 'rgba(0,0,0,0.8)',
          color: '#ccc',
          border: '1px solid #555',
          borderRadius: 4,
          fontSize: 11,
          fontFamily: 'monospace',
          cursor: 'pointer',
        }}
      >
        {brigadeList.map(b => (
          <option key={b.id} value={b.id}>{b.shortName}</option>
        ))}
      </select>

      {/* Тип роти */}
      {COMPANY_TYPES.map(({ type: t, label }) => (
        <button
          key={t}
          onClick={() => onTypeChange(t)}
          style={{
            padding: '3px 8px',
            background: type === t ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.6)',
            color: type === t ? '#fff' : '#aaa',
            border: `1px solid ${type === t ? '#888' : '#444'}`,
            borderRadius: 4,
            fontSize: 11,
            cursor: 'pointer',
            fontFamily: 'monospace',
            textAlign: 'left',
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
