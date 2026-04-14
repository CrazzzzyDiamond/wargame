import type { Company, HexPosition } from '../units/Company'
import type { Brigade } from '../units/Brigade'
import { CompanyType, EntrenchState } from '../units/types'
import { stepToward, hexDistance, getHexesInRadius } from '../utils/hexUtils'

// Пріоритет типу роти: менше число → ближче до цілі
const TYPE_PRIORITY: Partial<Record<CompanyType, number>> = {
  [CompanyType.Assault]:   0,
  [CompanyType.Tank]:      1,
  [CompanyType.Recon]:     2,
  [CompanyType.Line]:      3,
  [CompanyType.Special]:   4,
  [CompanyType.UAV]:       5,
  [CompanyType.Artillery]: 6,  // завжди у тилу
}

export interface CompanyTarget {
  companyId: string
  targetHex: HexPosition
}

/**
 * Розраховує цільовий гекс для кожної роти бригади.
 * Повертає список { companyId, targetHex } — gameStore застосовує самостійно.
 */
export function planFormation(
  brigade: Brigade,
  companies: Map<string, Company>,
  targetHex: HexPosition,
): CompanyTarget[] {

  const brigadeCompanies = Array.from(companies.values())
    .filter(c => c.brigadeId === brigade.id && c.isDeployed())
    .filter(c => c.entrenchState !== EntrenchState.Entrenched &&
                 c.entrenchState !== EntrenchState.Entrenching)
    .sort((a, b) => (TYPE_PRIORITY[a.type] ?? 9) - (TYPE_PRIORITY[b.type] ?? 9))

  if (brigadeCompanies.length === 0) return []

  // Центр ваги бригади — визначає напрямок "позаду"
  const positions = brigadeCompanies.filter(c => c.position).map(c => c.position!)
  const centerCol = Math.round(positions.reduce((s, p) => s + p.col, 0) / positions.length)
  const centerRow = Math.round(positions.reduce((s, p) => s + p.row, 0) / positions.length)
  const brigadeCenter: HexPosition = { col: centerCol, row: centerRow }

  // Якщо бригада вже на цілі — беремо КП як орієнтир "позаду"
  const rearRef = hexDistance(targetHex, brigadeCenter) >= 2
    ? brigadeCenter
    : brigade.hqPosition

  // Тилові гекси для артилерії: 3–4 кроки від цілі назад
  let r = targetHex
  r = stepToward(r, rearRef)
  r = stepToward(r, rearRef)
  const rear2 = r
  r = stepToward(r, rearRef)
  const rear3 = r
  r = stepToward(r, rearRef)
  const rear4 = r
  const rearHexes: HexPosition[] = [rear3, rear4, rear2]

  // Фронтові гекси: кільце 0–1 навколо цілі
  const frontHexes = getHexesInRadius(targetHex, 1)
  const assigned = new Set<string>()

  // Обираємо найближчий до поточної позиції роти вільний гекс з пулу
  const takeNearest = (pool: HexPosition[], from: HexPosition): HexPosition | null => {
    let best: HexPosition | null = null
    let bestDist = Infinity
    for (const h of pool) {
      const key = `${h.col},${h.row}`
      if (assigned.has(key)) continue
      const d = hexDistance(from, h)
      if (d < bestDist) { bestDist = d; best = h }
    }
    if (best) assigned.add(`${best.col},${best.row}`)
    return best
  }

  const result: CompanyTarget[] = []

  for (const company of brigadeCompanies) {
    if (!company.position) continue
    const isArtillery = company.type === CompanyType.Artillery
    const hex = isArtillery
      ? (takeNearest(rearHexes, company.position) ?? takeNearest(frontHexes, company.position))
      : (takeNearest(frontHexes, company.position) ?? takeNearest(rearHexes, company.position))
    if (!hex) continue
    result.push({ companyId: company.id, targetHex: hex })
  }

  return result
}
