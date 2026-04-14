import { UnitStatus, TerrainType, Directive, CompanyType, EntrenchState } from '../units/types'
import type { Company } from '../units/Company'
import {
  STATUS_COLORS,
  TERRAIN_COLORS,
  READINESS_COLORS,
  ENTRENCH_COLORS,
} from '../config/theme'

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
  if (company.inCombat)  return UnitStatus.Combat
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
  [UnitStatus.Marching]: STATUS_COLORS.marching,
  [UnitStatus.Holding]:  STATUS_COLORS.holding,
  [UnitStatus.Idle]:     STATUS_COLORS.idle,
  [UnitStatus.Combat]:   STATUS_COLORS.combat,
}

// Мітки і кольори ландшафту
export const TERRAIN_LABEL: Record<TerrainType, string> = {
  [TerrainType.Open]:   'Відкрите поле',
  [TerrainType.Forest]: 'Ліс',
  [TerrainType.Urban]:  'Місто / забудова',
  [TerrainType.Water]:  'Вода',
}

export const TERRAIN_COLOR: Record<TerrainType, string> = {
  [TerrainType.Open]:   TERRAIN_COLORS.openStatus,
  [TerrainType.Forest]: TERRAIN_COLORS.forestStatus,
  [TerrainType.Urban]:  TERRAIN_COLORS.urbanStatus,
  [TerrainType.Water]:  TERRAIN_COLORS.waterStatus,
}

// Модифікатори що діють залежно від стану + ландшафту
export interface Modifier {
  label: string
  color: string
}

export function getActiveModifiers(status: UnitStatus, terrain: TerrainType, entrenchState: EntrenchState): Modifier[] {
  const mods: Modifier[] = []

  if (terrain === TerrainType.Water) {
    mods.push({ label: 'Непрохідно', color: STATUS_COLORS.combat })
    return mods
  }

  if (terrain === TerrainType.Forest) {
    mods.push({ label: '−1 видимість', color: STATUS_COLORS.marching })
    mods.push({ label: '−25% дамаг', color: READINESS_COLORS.ready })
    if (status === UnitStatus.Marching) {
      mods.push({ label: '×2 рух', color: STATUS_COLORS.marching })
    }
  }

  if (terrain === TerrainType.Urban) {
    mods.push({ label: '−40% дамаг', color: READINESS_COLORS.ready })
    if (status === UnitStatus.Marching) {
      mods.push({ label: '×1.5 рух', color: STATUS_COLORS.marching })
    }
  }

  if (entrenchState === EntrenchState.Entrenched) {
    mods.push({ label: '−30% дамаг', color: READINESS_COLORS.ready })
    mods.push({ label: 'ZoC ×4', color: ENTRENCH_COLORS.amber })
  }

  if (entrenchState === EntrenchState.Entrenched &&
      (terrain === TerrainType.Forest || terrain === TerrainType.Urban)) {
    const total = terrain === TerrainType.Forest ? 48 : 58
    mods.push({ label: `−${total}% стак`, color: READINESS_COLORS.ready })
  }

  return mods
}
