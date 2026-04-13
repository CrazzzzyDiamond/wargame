import type { Company } from '../units/Company'
import { Side, CompanyType } from '../units/types'
import { getHexesInRadius, hexDistance } from './hexUtils'

// Будує set видимих гексів на основі позицій рот ЗСУ
export function buildVisibleHexSet(companies: Map<string, Company>): Set<string> {
  const visible = new Set<string>()

  for (const company of companies.values()) {
    if (company.side !== Side.Ukraine) continue
    if (!company.position) continue

    const hexes = getHexesInRadius(company.position, company.visionRadius)
    for (const hex of hexes) {
      visible.add(`${hex.col},${hex.row}`)
    }
  }

  return visible
}

// Чи видимий ворожий юніт у поточний момент
// ССО невидимі завжди, крім: у бою або впритул (відстань ≤ 1) до дружнього юніта
export function isEnemyVisible(company: Company, visibleHexes: Set<string>, allCompanies: Map<string, Company>): boolean {
  if (company.side !== Side.Russia) return true
  if (!company.position) return false

  // ССО — особлива перевірка
  if (company.type === CompanyType.Special) {
    if (company.inCombat) return true
    // Видимий якщо впритул (≤1 гекс) до будь-якого юніта ЗСУ
    for (const friendly of allCompanies.values()) {
      if (friendly.side !== Side.Ukraine || !friendly.position) continue
      if (hexDistance(company.position, friendly.position) <= 1) return true
    }
    return false
  }

  return visibleHexes.has(`${company.position.col},${company.position.row}`)
}
