import { TerrainType, EntrenchState, CompanyType } from '../units/types'

// Базовий дамаг атакуючої роти за один тік (одиниці strength)
export const BASE_DAMAGE_PER_TICK = 10

// Захисний множник знижує вхідний дамаг
// Стакається мультиплікативно: ліс × окоп = 0.75 × 0.70
export function getDefenseMultiplier(
  terrain: TerrainType,
  entrenchState: EntrenchState,
  isRetreating = false,
): number {
  const terrainMult   = TERRAIN_DEFENSE[terrain]
  const entrenchMult  = entrenchState === EntrenchState.Entrenched ? ENTRENCH_DEFENSE : 1.0
  const retreatMult   = isRetreating ? 1.50 : 1.0  // +50% вхідного дамагу при відступі
  return terrainMult * entrenchMult * retreatMult
}

const TERRAIN_DEFENSE: Record<TerrainType, number> = {
  [TerrainType.Open]:   1.00,
  [TerrainType.Forest]: 0.75,  // −25%
  [TerrainType.Urban]:  0.60,  // −40%
  [TerrainType.Water]:  1.00,
}

const ENTRENCH_DEFENSE = 0.70  // −30%

// Множник атаки ССО залежно від кількості цілей які атакують одночасно
// ССО ефективний 1х1, вразливий до концентрації вогню
function getSSOAttackMultiplier(targetCount: number): number {
  if (targetCount >= 3) return 0.75
  if (targetCount === 2) return 1.50
  return 3.00  // ×3 проти одиночної цілі
}

// Множник ССО по артилерії — швидке знищення
const SSO_VS_ARTILLERY_MULT = 5.0

// Розрахунок дамагу від атакуючого по цілі за один тік
export function calcDamage(
  defTerrain: TerrainType,
  defEntrenchState: EntrenchState,
  attackerCount: number,           // скільки рот б'ють по цій самій цілі
  attackerType?: CompanyType,      // тип атакуючого (для спецмножників)
  defenderType?: CompanyType,      // тип захисника (для спецмножників)
  defIsRetreating = false,
): number {
  const defense = getDefenseMultiplier(defTerrain, defEntrenchState, defIsRetreating)

  // Множник атаки ССО
  let attackMult = 1.0
  if (attackerType === CompanyType.Special) {
    attackMult = defenderType === CompanyType.Artillery
      ? SSO_VS_ARTILLERY_MULT
      : getSSOAttackMultiplier(attackerCount)
  }

  return BASE_DAMAGE_PER_TICK * defense * attackMult
}
