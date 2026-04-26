import { useGameStore } from '../store/gameStore'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { CompanyType, Readiness, Morale, TerrainType, EntrenchState } from '../units/types'
import { UNIT_IMAGES } from '../assets/unitImages'
import {
  getCompanyStatus,
  getActiveModifiers,
  STATUS_LABEL, STATUS_COLOR,
  TERRAIN_LABEL, TERRAIN_COLOR,
} from '../utils/unitStatus'
import { getTerrain } from '../utils/terrainAnalysis'
import { ACCENT, UI, READINESS_COLORS, MORALE_COLORS, ENTRENCH_COLORS } from '../config/theme'

const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  [CompanyType.Assault]:   'Штурмова',
  [CompanyType.Line]:      'Лінійна',
  [CompanyType.Recon]:     'Розвідувальна',
  [CompanyType.UAV]:       'БПЛА',
  [CompanyType.Special]:   'Спецпідрозділ',
  [CompanyType.Tank]:      'Танкова',
  [CompanyType.Artillery]: 'Артилерійська',
}

const READINESS_LABEL: Record<Readiness, string> = {
  [Readiness.Ready]:     'Боєздатна',
  [Readiness.Strained]:  'Виснажена',
  [Readiness.Exhausted]: 'Небоєздатна',
}

const READINESS_COLOR: Record<Readiness, string> = {
  [Readiness.Ready]:     READINESS_COLORS.ready,
  [Readiness.Strained]:  READINESS_COLORS.strained,
  [Readiness.Exhausted]: READINESS_COLORS.exhausted,
}

const MORALE_LABEL: Record<Morale, string> = {
  [Morale.High]:   'Бойовий',
  [Morale.Steady]: 'Стійкий',
  [Morale.Shaken]: 'Похитнувся',
  [Morale.Panic]:  'Паніка',
}

const MORALE_COLOR: Record<Morale, string> = {
  [Morale.High]:   MORALE_COLORS.high,
  [Morale.Steady]: MORALE_COLORS.steady,
  [Morale.Shaken]: MORALE_COLORS.shaken,
  [Morale.Panic]:  MORALE_COLORS.panic,
}

const TERRAIN_ICON: Record<TerrainType, string> = {
  [TerrainType.Open]:   '⬜',
  [TerrainType.Forest]: '🌲',
  [TerrainType.Urban]:  '🏘',
  [TerrainType.Water]:  '🌊',
}

export function UnitPanel() {
  const companies          = useGameStore(s => s.companies)
  const battalions         = useGameStore(s => s.battalions)
  const brigades           = useGameStore(s => s.brigades)
  const brigadeDirectives  = useGameStore(s => s.brigadeDirectives)
  const terrainMap         = useGameStore(s => s.terrainMap)
  const selectedId         = useGameStore(s => s.selectedCompanyId)
  const selectCompany      = useGameStore(s => s.selectCompany)
  const startEntrench      = useGameStore(s => s.startEntrench)
  const leaveEntrench      = useGameStore(s => s.leaveEntrench)

  if (!selectedId) return null

  const company  = companies.get(selectedId)
  if (!company) return null

  const battalion = battalions.get(company.battalionId)
  const brigade   = brigades.get(company.brigadeId)
  const directive = brigadeDirectives.get(company.brigadeId)

  const status  = getCompanyStatus(company, directive)
  const terrain = company.position
    ? getTerrain(terrainMap, company.position.col, company.position.row)
    : TerrainType.Open
  const modifiers = getActiveModifiers(status, terrain, company.entrenchState)

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 24,
      zIndex: 110,
      width: 268,
      backgroundColor: UI.bg,
      border: `1px solid ${ACCENT.blueDim}`,
      borderRadius: 6,
      color: UI.text,
      fontFamily: 'monospace',
      fontSize: 13,
      overflow: 'hidden',
      userSelect: 'none',
    }}>

      {/* Заголовок — бригада */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderBottom: `1px solid ${ACCENT.blueSubtle}`,
        backgroundColor: ACCENT.blueFaint,
      }}>
        {BRIGADE_IMAGES[company.brigadeId] && (
          <img src={BRIGADE_IMAGES[company.brigadeId]} style={{ width: 36, height: 36, objectFit: 'contain' }} />
        )}
        <div>
          <div style={{ fontWeight: 'bold', color: ACCENT.blue }}>
            {brigade?.shortName ?? company.brigadeId}
          </div>
          <div style={{ fontSize: 11, color: UI.textMuted }}>
            {battalion?.name ?? company.battalionId}
          </div>
        </div>
      </div>

      {/* Іконка типу роти — на всю ширину */}
      <div style={{
        borderBottom: `1px solid ${ACCENT.blueSubtle}`,
        backgroundColor: 'rgba(0,0,0,0.2)',
        lineHeight: 0,
      }}>
        <img
          src={UNIT_IMAGES[company.type]}
          style={{ width: '100%', height: 'auto', objectFit: 'contain', display: 'block' }}
        />
      </div>

      {/* Тіло */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold' }}>{company.name}</div>
        <div style={{ color: UI.textMuted, fontSize: 12 }}>{COMPANY_TYPE_LABELS[company.type]}</div>

        <div style={{ height: 1, backgroundColor: UI.divider, margin: '2px 0' }} />

        {/* Стан */}
        <Row label="Стан">
          <span style={{ color: STATUS_COLOR[status], fontWeight: 'bold' }}>
            ● {STATUS_LABEL[status]}
          </span>
        </Row>

        {/* Ландшафт */}
        <Row label="Місцевість">
          <span style={{ color: TERRAIN_COLOR[terrain] }}>
            {TERRAIN_ICON[terrain]} {TERRAIN_LABEL[terrain]}
          </span>
        </Row>

        {/* Модифікатори ландшафту + стану */}
        {modifiers.length > 0 && (
          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 1 }}>
            {modifiers.map((m, i) => (
              <span key={i} style={{
                fontSize: 10,
                color: m.color,
                border: `1px solid ${m.color}55`,
                borderRadius: 3,
                padding: '1px 5px',
                backgroundColor: `${m.color}11`,
              }}>
                {m.label}
              </span>
            ))}
          </div>
        )}

        <div style={{ height: 1, backgroundColor: UI.divider, margin: '2px 0' }} />

        {/* Бойові параметри */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: UI.textMuted }}>Чисельність</span>
            <span style={{ color: UI.text }}>{company.strength}%</span>
          </div>
          <div style={{ width: '100%', height: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 3, overflow: 'hidden' }}>
            <div style={{
              width: `${company.strength}%`,
              height: '100%',
              borderRadius: 3,
              backgroundColor: READINESS_COLORS.ready,
            }} />
          </div>
        </div>
        <Row label="Боєздатність">
          <span style={{ color: READINESS_COLOR[company.readiness] }}>
            ● {READINESS_LABEL[company.readiness]}
          </span>
        </Row>
        <Row label="Бойовий дух">
          <span style={{ color: MORALE_COLOR[company.morale] }}>
            ● {MORALE_LABEL[company.morale]}
          </span>
        </Row>
        <Row label="Видимість">
          {company.visionRadius} {company.visionRadius === 1 ? 'гекс' : 'гекси'}
        </Row>

        {/* Окопування — тільки для лінійної піхоти */}
        {company.type === CompanyType.Line && (
          <>
            <div style={{ height: 1, backgroundColor: UI.divider, margin: '2px 0' }} />
            {company.entrenchState === EntrenchState.None && (
              <button
                onClick={() => startEntrench(company.id)}
                style={{
                  width: '100%', padding: '5px 0', marginTop: 2,
                  backgroundColor: ENTRENCH_COLORS.amberBg,
                  border: `1px solid ${ENTRENCH_COLORS.amberBorder}`,
                  borderRadius: 4, color: ENTRENCH_COLORS.amber,
                  fontSize: 12, cursor: 'pointer', transition: 'filter 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.3)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = '' }}
              >
                ⛏ Окопатись
              </button>
            )}
            {company.entrenchState === EntrenchState.Entrenching && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: ENTRENCH_COLORS.amber, fontSize: 12 }}>⛏ Копає окоп...</span>
                  <span style={{ color: UI.textMuted, fontSize: 12 }}>
                    {Math.ceil(company.entrenchMinutesLeft / 60)} год
                  </span>
                </div>
                <div style={{ width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${((240 - company.entrenchMinutesLeft) / 240) * 100}%`,
                    height: '100%', borderRadius: 2, backgroundColor: ENTRENCH_COLORS.amber,
                  }} />
                </div>
              </div>
            )}
            {company.entrenchState === EntrenchState.Entrenched && (
              <button
                onClick={() => leaveEntrench(company.id)}
                style={{
                  width: '100%', padding: '5px 0', marginTop: 2,
                  backgroundColor: ENTRENCH_COLORS.leaveBg,
                  border: `1px solid ${ENTRENCH_COLORS.leaveBorder}`,
                  borderRadius: 4, color: READINESS_COLORS.ready,
                  fontSize: 12, cursor: 'pointer', transition: 'filter 0.1s',
                }}
                onMouseEnter={e => { e.currentTarget.style.filter = 'brightness(1.3)' }}
                onMouseLeave={e => { e.currentTarget.style.filter = '' }}
              >
                🪖 В окопі — покинути
              </button>
            )}
            {company.entrenchState === EntrenchState.Leaving && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: UI.textMuted, fontSize: 12 }}>Виходить з окопу...</span>
                  <span style={{ color: UI.textMuted, fontSize: 12 }}>
                    {Math.ceil(company.entrenchMinutesLeft / 60)} год
                  </span>
                </div>
                <div style={{ width: '100%', height: 4, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{
                    width: `${((60 - company.entrenchMinutesLeft) / 60) * 100}%`,
                    height: '100%', borderRadius: 2, backgroundColor: UI.textMuted,
                  }} />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Футер */}
      <div
        onClick={() => selectCompany(null)}
        style={{
          padding: '8px 14px',
          borderTop: `1px solid ${ACCENT.blueSubtle}`,
          color: UI.textMuted,
          cursor: 'pointer',
          textAlign: 'center',
          fontSize: 12,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = ACCENT.blue)}
        onMouseLeave={e => (e.currentTarget.style.color = UI.textMuted)}
      >
        Скасувати вибір
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ color: UI.textMuted }}>{label}</span>
      <span>{children}</span>
    </div>
  )
}
