import { UnitStatus, TerrainType, Directive } from '../units/types'
import type { Company } from '../units/Company'

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

export function getActiveModifiers(status: UnitStatus, terrain: TerrainType): Modifier[] {
  const mods: Modifier[] = []

  if (terrain === TerrainType.Water) {
    mods.push({ label: 'Непрохідно', color: '#e74c3c' })
    return mods
  }

  if (terrain === TerrainType.Forest) {
    mods.push({ label: '−1 видимість', color: '#ff9800' })
    if (status === UnitStatus.Holding) {
      mods.push({ label: '+оборона', color: '#4caf50' })
    }
    if (status === UnitStatus.Marching) {
      mods.push({ label: '×2 рух', color: '#ff9800' })
    }
  }

  if (terrain === TerrainType.Urban) {
    if (status === UnitStatus.Holding) {
      mods.push({ label: '+2 оборона', color: '#4caf50' })
    }
    if (status === UnitStatus.Marching) {
      mods.push({ label: '×1.5 рух', color: '#ff9800' })
    }
  }

  if (status === UnitStatus.Holding && terrain === TerrainType.Open) {
    mods.push({ label: '+оборона', color: '#4caf50' })
  }

  return mods
}
