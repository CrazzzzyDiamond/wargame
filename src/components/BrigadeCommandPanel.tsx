import { useGameStore } from '../store/gameStore'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { CompanyType, Directive, EntrenchState } from '../units/types'
import { ACCENT, UI, STATUS_COLORS, READINESS_COLORS, DIRECTIVE_COLORS } from '../config/theme'
import { UnitIcon } from './UnitIcon'
import type { Company } from '../units/Company'

const DIRECTIVES: { value: Directive; label: string; color: string }[] = [
  { value: Directive.Cautious, label: 'Обережно',       color: DIRECTIVE_COLORS.cautious },
  { value: Directive.Advance,  label: 'Наступ',          color: DIRECTIVE_COLORS.advance  },
  { value: Directive.AllOut,   label: 'Будь-якою ціною', color: DIRECTIVE_COLORS.allout   },
]

interface Props {
  brigadeId: string
  planningMode: boolean
  onOccupy: () => void
  onClose: () => void
}

// Пріоритет для сортування у списку
const TYPE_ORDER: Partial<Record<CompanyType, number>> = {
  [CompanyType.Assault]:   0,
  [CompanyType.Tank]:      1,
  [CompanyType.Recon]:     2,
  [CompanyType.Line]:      3,
  [CompanyType.Special]:   4,
  [CompanyType.UAV]:       5,
  [CompanyType.Artillery]: 6,
}

function statusIcon(c: Company): string {
  if (c.inCombat)    return '⚔'
  if (c.isSuppressed) return '!'
  if (c.entrenchState === EntrenchState.Entrenched)  return '▣'
  if (c.entrenchState === EntrenchState.Entrenching) return '⛏'
  if (c.targetHex)   return '▶'
  return ''
}

function statusColor(c: Company): string {
  if (c.inCombat)     return STATUS_COLORS.combat
  if (c.isSuppressed) return STATUS_COLORS.marching
  if (c.targetHex)    return STATUS_COLORS.marching
  return UI.textMuted
}

function strengthColor(s: number): string {
  if (s >= 60) return READINESS_COLORS.ready
  if (s >= 30) return READINESS_COLORS.strained
  return READINESS_COLORS.exhausted
}

export function BrigadeCommandPanel({ brigadeId, planningMode, onOccupy, onClose }: Props) {
  const brigade          = useGameStore(s => s.brigades.get(brigadeId))
  const companies        = useGameStore(s => s.companies)
  const brigadeDirectives = useGameStore(s => s.brigadeDirectives)
  const setDirective     = useGameStore(s => s.setDirective)

  const currentDirective = brigadeDirectives.get(brigadeId)

  if (!brigade) return null

  const img = BRIGADE_IMAGES[brigadeId]

  const units = Array.from(companies.values())
    .filter(c => c.brigadeId === brigadeId && c.isDeployed())
    .sort((a, b) => (TYPE_ORDER[a.type] ?? 9) - (TYPE_ORDER[b.type] ?? 9))

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: 96,
      transform: 'translateY(-50%)',
      width: 220,
      background: UI.bg,
      border: `1px solid ${ACCENT.blueDim}`,
      borderRadius: 8,
      zIndex: 101,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: 'monospace',
    }}>
      {/* Заголовок */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderBottom: `1px solid ${UI.border}` }}>
        {img && <img src={img} style={{ height: 32, width: 'auto' }} />}
        <span style={{ color: UI.text, fontSize: 11, fontWeight: 'bold', lineHeight: 1.3 }}>
          {brigade.shortName}
        </span>
        <div
          onClick={onClose}
          style={{ marginLeft: 'auto', color: UI.textMuted, cursor: 'pointer', fontSize: 14, lineHeight: 1 }}
        >×</div>
      </div>

      {/* Список рот */}
      <div style={{ padding: '6px 0', maxHeight: 280, overflowY: 'auto' }}>
        {units.map(c => (
          <div key={c.id} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '4px 12px',
          }}>
            {/* Іконка типу */}
            <div style={{ width: 48, height: 36, flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UnitIcon type={c.type} size={36} />
            </div>

            {/* Назва + strength bar */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 10, color: UI.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {c.name}
              </div>
              <div style={{ height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 2 }}>
                <div style={{
                  width: `${c.strength}%`,
                  height: '100%',
                  background: strengthColor(c.strength),
                  borderRadius: 2,
                  transition: 'width 0.3s',
                }} />
              </div>
            </div>

            {/* Статус */}
            <span style={{ fontSize: 10, color: statusColor(c), flexShrink: 0, width: 12, textAlign: 'center' }}>
              {statusIcon(c)}
            </span>
          </div>
        ))}
      </div>

      <div style={{ height: 1, background: UI.border }} />

      {/* Директиви */}
      <div style={{ padding: '6px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
        {DIRECTIVES.map(d => {
          const isActive = currentDirective === d.value
          return (
            <button
              key={d.value}
              onClick={() => setDirective(brigadeId, d.value)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '5px 8px',
                background: isActive ? `${d.color}22` : 'transparent',
                border: `1px solid ${isActive ? d.color : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 4,
                color: isActive ? d.color : UI.textMuted,
                cursor: 'pointer',
                fontFamily: 'monospace',
                fontSize: 11,
                textAlign: 'left',
              }}
            >
              <div style={{ width: 7, height: 7, borderRadius: '50%', backgroundColor: d.color, flexShrink: 0 }} />
              {d.label}
              {isActive && <span style={{ marginLeft: 'auto', fontSize: 9 }}>● активна</span>}
            </button>
          )
        })}
      </div>

      <div style={{ height: 1, background: UI.border }} />

      {/* Кнопка зайняти позицію */}
      <div style={{ padding: '8px 10px' }}>
        <button
          onClick={onOccupy}
          style={{
            width: '100%',
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
    </div>
  )
}
