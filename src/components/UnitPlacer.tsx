import { useState } from 'react'
import { CompanyType, Side } from '../units/types'
import type { Brigade } from '../units/Brigade'
import { DEV, UI } from '../config/theme'

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
              background: side === s ? (s === Side.Ukraine ? DEV.ukraine : DEV.russia) : UI.black60,
              color: UI.white,
              border: `1px solid ${side === s ? (s === Side.Ukraine ? DEV.ukraine : DEV.russia) : UI.borderMuted}`,
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
          background: UI.black80,
          color: '#ccc',
          border: `1px solid ${UI.borderMuted}`,
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
            background: type === t ? UI.overlay : UI.black60,
            color: type === t ? UI.white : '#aaa',
            border: `1px solid ${type === t ? '#888' : UI.borderSubtle}`,
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
