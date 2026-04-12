import { useGameStore } from '../store/gameStore'
import { BRIGADE_IMAGES } from '../assets/brigadeImages'
import { CompanyType, Readiness, Morale, TerrainType } from '../units/types'
import {
  getCompanyStatus,
  getActiveModifiers,
  STATUS_LABEL, STATUS_COLOR,
  TERRAIN_LABEL, TERRAIN_COLOR,
} from '../utils/unitStatus'
import { getTerrain } from '../utils/terrainAnalysis'

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
  [Readiness.Ready]:     '#4caf50',
  [Readiness.Strained]:  '#ff9800',
  [Readiness.Exhausted]: '#f44336',
}

const MORALE_LABEL: Record<Morale, string> = {
  [Morale.High]:   'Бойовий',
  [Morale.Steady]: 'Стійкий',
  [Morale.Shaken]: 'Похитнувся',
  [Morale.Panic]:  'Паніка',
}

const MORALE_COLOR: Record<Morale, string> = {
  [Morale.High]:   '#4caf50',
  [Morale.Steady]: '#e8eaf0',
  [Morale.Shaken]: '#ff9800',
  [Morale.Panic]:  '#f44336',
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
  const modifiers = getActiveModifiers(status, terrain)

  return (
    <div style={{
      position: 'absolute',
      bottom: 24,
      left: 24,
      width: 268,
      backgroundColor: 'rgba(10, 14, 20, 0.92)',
      border: '1px solid rgba(0, 207, 255, 0.3)',
      borderRadius: 6,
      color: '#e8eaf0',
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
        borderBottom: '1px solid rgba(0, 207, 255, 0.2)',
        backgroundColor: 'rgba(0, 207, 255, 0.07)',
      }}>
        {BRIGADE_IMAGES[company.brigadeId] && (
          <img src={BRIGADE_IMAGES[company.brigadeId]} style={{ width: 36, height: 36, objectFit: 'contain' }} />
        )}
        <div>
          <div style={{ fontWeight: 'bold', color: '#00cfff' }}>
            {brigade?.shortName ?? company.brigadeId}
          </div>
          <div style={{ fontSize: 11, color: '#8899aa' }}>
            {battalion?.name ?? company.battalionId}
          </div>
        </div>
      </div>

      {/* Тіло */}
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div style={{ fontSize: 14, fontWeight: 'bold' }}>{company.name}</div>
        <div style={{ color: '#8899aa', fontSize: 12 }}>{COMPANY_TYPE_LABELS[company.type]}</div>

        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

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

        <div style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.06)', margin: '2px 0' }} />

        {/* Бойові параметри */}
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
      </div>

      {/* Футер */}
      <div
        onClick={() => selectCompany(null)}
        style={{
          padding: '8px 14px',
          borderTop: '1px solid rgba(0, 207, 255, 0.2)',
          color: '#8899aa',
          cursor: 'pointer',
          textAlign: 'center',
          fontSize: 12,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = '#00cfff')}
        onMouseLeave={e => (e.currentTarget.style.color = '#8899aa')}
      >
        Скасувати вибір
      </div>
    </div>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
      <span style={{ color: '#8899aa' }}>{label}</span>
      <span>{children}</span>
    </div>
  )
}
