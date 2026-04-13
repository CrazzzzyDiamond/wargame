import type { Company } from '../units/Company'
import { Side } from '../units/types'
import { getHexesInRadius } from './hexUtils'

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
export function isEnemyVisible(company: Company, visibleHexes: Set<string>): boolean {
  if (company.side !== Side.Russia) return true
  if (!company.position) return false
  return visibleHexes.has(`${company.position.col},${company.position.row}`)
}
