import { UnitStatus, TerrainType, Directive, CompanyType, EntrenchState } from '../units/types'
import type { Company } from '../units/Company'

// Радіус зони контролю (ZoC) для роти
// Лінійна в окопі — ZoC=4; інакше за типом
export function getZocRadius(company: Company): number {
  if (company.type === CompanyType.Line &&
      company.entrenchState === EntrenchState.Entrenched) return 4
  switch (company.type) {
    case CompanyType.Tank:      return 2
    case CompanyType.Line:      return 2
    case CompanyType.Artillery: return 0
    case CompanyType.UAV:       return 0
    default:                    return 1
  }
}

// Дальність атаки для типів що ведуть непрямий вогонь
// null — рота не має зони підсвітки дальності (ближній бій)
export interface AttackRange { min: number; max: number }

export function getAttackRange(type: CompanyType): AttackRange | null {
  switch (type) {
    case CompanyType.Artillery: return { min: 4, max: 9 }
    default:                    return null
  }
}

// Визначення поточного стану роти — чисто функціональне
export function getCompanyStatus(company: Company, directive: Directive | undefined): UnitStatus {
  if (company.targetHex) return UnitStatus.Marching
  if (directive === Directive.Hold) return UnitStatus.Holding
  return UnitStatus.Idle
}

// Мітки і кольори стану
export const STATUS_LABEL: Record<UnitStatus, string> = {
  [UnitStatus.Marching]: 'На марші',
  [UnitStatus.Holding]:  'Утримання',
  [UnitStatus.Idle]:     'Очікування',
  [UnitStatus.Combat]:   'Бій',
}

export const STATUS_COLOR: Record<UnitStatus, string> = {
  [UnitStatus.Marching]: '#ff9800',
  [UnitStatus.Holding]:  '#3498db',
  [UnitStatus.Idle]:     '#8899aa',
  [UnitStatus.Combat]:   '#e74c3c',
}

// Мітки і кольори ландшафту
export const TERRAIN_LABEL: Record<TerrainType, string> = {
  [TerrainType.Open]:   'Відкрите поле',
  [TerrainType.Forest]: 'Ліс',
  [TerrainType.Urban]:  'Місто / забудова',
  [TerrainType.Water]:  'Вода',
}

export const TERRAIN_COLOR: Record<TerrainType, string> = {
  [TerrainType.Open]:   '#a8b820',
  [TerrainType.Forest]: '#388e3c',
  [TerrainType.Urban]:  '#78909c',
  [TerrainType.Water]:  '#1976d2',
}

// Модифікатори що діють залежно від стану + ландшафту
export interface Modifier {
  label: string
  color: string
}

export function getActiveModifiers(status: UnitStatus, terrain: TerrainType, entrenchState: EntrenchState): Modifier[] {
  const mods: Modifier[] = []

  if (terrain === TerrainType.Water) {
    mods.push({ label: 'Непрохідно', color: '#e74c3c' })
    return mods
  }

  if (terrain === TerrainType.Forest) {
    mods.push({ label: '−1 видимість', color: '#ff9800' })
    mods.push({ label: '−25% дамаг', color: '#4caf50' })
    if (status === UnitStatus.Marching) {
      mods.push({ label: '×2 рух', color: '#ff9800' })
    }
  }

  if (terrain === TerrainType.Urban) {
    mods.push({ label: '−40% дамаг', color: '#4caf50' })
    if (status === UnitStatus.Marching) {
      mods.push({ label: '×1.5 рух', color: '#ff9800' })
    }
  }

  if (entrenchState === EntrenchState.Entrenched) {
    mods.push({ label: '−30% дамаг', color: '#4caf50' })
    mods.push({ label: 'ZoC ×4', color: '#ffc107' })
  }

  if (entrenchState === EntrenchState.Entrenched &&
      (terrain === TerrainType.Forest || terrain === TerrainType.Urban)) {
    const total = terrain === TerrainType.Forest ? 48 : 58
    mods.push({ label: `−${total}% стак`, color: '#81c784' })
  }

  return mods
}
