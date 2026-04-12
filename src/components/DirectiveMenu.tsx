import { useGameStore } from '../store/gameStore'
import { Directive } from '../units/types'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'

const DIRECTIVES: { value: Directive; label: string; description: string; color: string }[] = [
  { value: Directive.Advance, label: 'Наступ',      description: '+атака, readiness витрачається швидше', color: '#e74c3c' },
  { value: Directive.Hold,    label: 'Утримувати',  description: '+оборона, заборона руху',               color: '#3498db' },
  { value: Directive.Rest,    label: 'Відпочинок',  description: 'Відновлення readiness і morale',         color: '#2ecc71' },
]

export function DirectiveMenu() {
  const brigades          = useGameStore(s => s.brigades)
  const selectedHQId      = useGameStore(s => s.selectedHQId)
  const brigadeDirectives = useGameStore(s => s.brigadeDirectives)
  const selectHQ          = useGameStore(s => s.selectHQ)
  const setDirective      = useGameStore(s => s.setDirective)

  if (!selectedHQId) return null

  const brigade = brigades.get(selectedHQId)
  if (!brigade) return null

  const current = brigadeDirectives.get(selectedHQId)

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      right: 24,
      width: 280,
      backgroundColor: 'rgba(10, 14, 20, 0.92)',
      border: '1px solid rgba(255, 221, 0, 0.4)',
      borderRadius: 6,
      color: '#e8eaf0',
      fontFamily: 'monospace',
      overflow: 'hidden',
      userSelect: 'none',
    }}>

      {/* Заголовок */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderBottom: '1px solid rgba(255,221,0,0.2)',
        backgroundColor: 'rgba(255,221,0,0.07)',
      }}>
        {BRIGADE_IMAGES[brigade.id] && (
          <img src={BRIGADE_IMAGES[brigade.id]} style={{ width: 36, height: 36, objectFit: 'contain' }} />
        )}
        <div>
          <div style={{ fontWeight: 'bold', color: '#ffdd00', fontSize: 13 }}>
            {brigade.shortName}
          </div>
          <div style={{ fontSize: 11, color: '#8899aa' }}>Штаб бригади — Директива</div>
        </div>
      </div>

      {/* Директиви */}
      <div style={{ padding: '8px 10px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {DIRECTIVES.map(d => {
          const isActive = current === d.value
          return (
            <button
              key={d.value}
              onClick={() => setDirective(brigade.id, d.value)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 12px',
                backgroundColor: isActive ? `${d.color}22` : 'rgba(255,255,255,0.04)',
                border: `1px solid ${isActive ? d.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 4,
                color: isActive ? d.color : '#e8eaf0',
                cursor: 'pointer',
                textAlign: 'left',
                fontFamily: 'monospace',
              }}
            >
              <div style={{
                width: 8, height: 8, borderRadius: '50%',
                backgroundColor: d.color, flexShrink: 0,
              }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: isActive ? 'bold' : 'normal' }}>{d.label}</div>
                <div style={{ fontSize: 10, color: '#8899aa', marginTop: 2 }}>{d.description}</div>
              </div>
              {isActive && (
                <div style={{ marginLeft: 'auto', fontSize: 10, color: d.color }}>● активна</div>
              )}
            </button>
          )
        })}
      </div>

      {/* Скасувати */}
      <div
        onClick={() => selectHQ(null)}
        style={{
          padding: '8px 14px',
          borderTop: '1px solid rgba(255,221,0,0.15)',
          color: '#8899aa',
          cursor: 'pointer',
          textAlign: 'center',
          fontSize: 12,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#ffdd00')}
        onMouseLeave={e => (e.currentTarget.style.color = '#8899aa')}
      >
        Закрити
      </div>
    </div>
  )
}
