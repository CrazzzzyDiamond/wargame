import { TerrainType, EntrenchState } from '../units/types'

// Базовий дамаг атакуючої роти за один тік (одиниці strength)
export const BASE_DAMAGE_PER_TICK = 10

// Захисний множник знижує вхідний дамаг
// Стакається мультиплікативно: ліс × окоп = 0.75 × 0.70
export function getDefenseMultiplier(terrain: TerrainType, entrenchState: EntrenchState): number {
  const terrainMult = TERRAIN_DEFENSE[terrain]
  const entrenchMult = entrenchState === EntrenchState.Entrenched ? ENTRENCH_DEFENSE : 1.0
  return terrainMult * entrenchMult
}

const TERRAIN_DEFENSE: Record<TerrainType, number> = {
  [TerrainType.Open]:   1.00,  // без бонусу
  [TerrainType.Forest]: 0.75,  // −25%
  [TerrainType.Urban]:  0.60,  // −40%
  [TerrainType.Water]:  1.00,  // непрохідна, але значення потрібне
}

const ENTRENCH_DEFENSE = 0.70  // −30%

// Множник дамагу залежно від кількості атакуючих рот на одну ціль
// Концентрація сил знижує ефективність кожного атакуючого
export function getConcentrationMultiplier(attackerCount: number): number {
  if (attackerCount >= 3) return 0.50
  if (attackerCount === 2) return 0.70
  return 1.00
}

// Розрахунок дамагу по цілі від одного атакуючого за тік
// attackerCount — скільки всього рот атакують цю саму ціль
export function calcDamage(
  terrain: TerrainType,
  entrenchState: EntrenchState,
  attackerCount: number,
): number {
  const defense      = getDefenseMultiplier(terrain, entrenchState)
  const concentration = getConcentrationMultiplier(attackerCount)
  return BASE_DAMAGE_PER_TICK * defense * concentration
}
