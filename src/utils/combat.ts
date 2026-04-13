import { TerrainType, EntrenchState, CompanyType, Morale } from '../units/types'

// Базовий дамаг атакуючої роти за один тік (одиниці strength)
export const BASE_DAMAGE_PER_TICK = 10

// Штраф до атаки при Panic (дезорганізована оборона)
const PANIC_ATTACK_PENALTY = 0.4    // −60% атаки
const PANIC_DEFENSE_PENALTY = 1.4  // +40% вхідного дамагу

// Захисний множник знижує вхідний дамаг
// Стакається мультиплікативно: ліс × окоп = 0.75 × 0.70
export function getDefenseMultiplier(
  terrain: TerrainType,
  entrenchState: EntrenchState,
  isRetreating = false,
  morale = Morale.Steady,
  attackerType?: CompanyType,
  defenderType?: CompanyType,
): number {
  const terrainMult  = TERRAIN_DEFENSE[terrain]
  let   entrenchMult = entrenchState === EntrenchState.Entrenched ? ENTRENCH_DEFENSE : 1.0
  const retreatMult  = isRetreating ? 1.50 : 1.0
  const panicMult    = morale === Morale.Panic ? PANIC_DEFENSE_PENALTY : 1.0

  // Окопана лінійна піхота: особливий захист від артилерії і танків
  if (defenderType === CompanyType.Line && entrenchState === EntrenchState.Entrenched) {
    if (attackerType === CompanyType.Artillery) entrenchMult = 0.30  // −70%
    if (attackerType === CompanyType.Tank)      entrenchMult = 0.50  // −50%
  }

  return terrainMult * entrenchMult * retreatMult * panicMult
}

const TERRAIN_DEFENSE: Record<TerrainType, number> = {
  [TerrainType.Open]:   1.00,
  [TerrainType.Forest]: 0.75,  // −25%
  [TerrainType.Urban]:  0.60,  // −40%
  [TerrainType.Water]:  1.00,
}

const ENTRENCH_DEFENSE = 0.70  // −30%

// Штраф morale по окопаній піхоті від артилерії (за тік)
export const ARTILLERY_MORALE_DAMAGE = 0.3  // знижує morale незалежно від укриття

// Множник атаки ССО залежно від кількості цілей які атакують одночасно
// ССО ефективний 1х1, вразливий до концентрації вогню
function getSSOAttackMultiplier(targetCount: number): number {
  if (targetCount >= 3) return 0.75
  if (targetCount === 2) return 1.50
  return 3.00  // ×3 проти одиночної цілі
}

// Множник ССО по артилерії — швидке знищення
const SSO_VS_ARTILLERY_MULT = 5.0

// Множник атаки танка залежно від ландшафту захисника
function getTankAttackMult(defTerrain: TerrainType): number {
  if (defTerrain === TerrainType.Open)   return 1.5   // перевага на відкритому полі
  if (defTerrain === TerrainType.Urban)  return 0.5   // штраф у місті
  if (defTerrain === TerrainType.Forest) return 0.5   // штраф у лісі
  return 1.0
}

// Вхідний дамаг по танку від артилерії — танки вразливі
const ARTILLERY_VS_TANK_MULT = 1.5

// Розрахунок дамагу від атакуючого по цілі за один тік
export function calcDamage(
  defTerrain: TerrainType,
  defEntrenchState: EntrenchState,
  attackerCount: number,
  attackerType?: CompanyType,
  defenderType?: CompanyType,
  defIsRetreating = false,
  atkTerrain?: TerrainType,
  atkMorale = Morale.Steady,
  defMorale = Morale.Steady,
): number {
  const defense = getDefenseMultiplier(defTerrain, defEntrenchState, defIsRetreating, defMorale, attackerType, defenderType)

  // Вразливість танка до артилерії (якщо не окопана лінійна — вже враховано у defense)
  let extraDefMult = 1.0
  if (attackerType === CompanyType.Artillery && defenderType === CompanyType.Tank) {
    extraDefMult = ARTILLERY_VS_TANK_MULT
  }

  // Множник атаки
  let attackMult = 1.0

  if (attackerType === CompanyType.Special) {
    attackMult = defenderType === CompanyType.Artillery
      ? SSO_VS_ARTILLERY_MULT
      : getSSOAttackMultiplier(attackerCount)
  } else if (attackerType === CompanyType.Tank && atkTerrain !== undefined) {
    attackMult = getTankAttackMult(defTerrain)
  } else if (attackerType === CompanyType.Assault) {
    attackMult = 1.3
  }

  // Panic у атакуючого — б'є слабше
  const panicAtkMult = atkMorale === Morale.Panic ? PANIC_ATTACK_PENALTY : 1.0

  return BASE_DAMAGE_PER_TICK * defense * extraDefMult * attackMult * panicAtkMult
}
