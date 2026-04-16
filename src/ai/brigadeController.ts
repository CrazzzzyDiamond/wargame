import type { Company, HexPosition } from '../units/Company'
import type { Brigade } from '../units/Brigade'
import { CompanyType, Directive, EntrenchState } from '../units/types'
import { hexDistance, stepToward, stepAwayFrom } from '../utils/hexUtils'
import { getZocRadius } from '../utils/unitStatus'
import { planFormation } from './formationPlanner'
import type { ZoneOfOperation, CompanyAction } from './types'

// Запас дистанції від ZoC ворога для розвідки
const RECON_SAFE_MARGIN = 1

// Відстань від бригади до ворога при якій вмикається тактична логіка
const CONTACT_RADIUS = 9

// Зона ефективного вогню артилерії
const ART_RANGE_MIN = 4
const ART_RANGE_MAX = 8

// ─── Головна функція ────────────────────────────────────────────────────────

/**
 * Повертає список дій для рот бригади на поточний тік.
 * Чиста функція — не змінює стан, тільки читає і повертає рекомендації.
 * Store застосовує їх самостійно.
 */
export function tickBrigade(
  brigade:    Brigade,
  companies:  Map<string, Company>,
  zone:       ZoneOfOperation,
  directive:  Directive,
): CompanyAction[] {

  // Роти бригади що розгорнуті, не окопуються і не виконують ручний наказ гравця
  const brigadeUnits = Array.from(companies.values()).filter(c =>
    c.brigadeId === brigade.id &&
    c.isDeployed() &&
    c.position !== null &&
    c.entrenchState === EntrenchState.None &&
    !c.manualOrder
  )

  if (brigadeUnits.length === 0) return []

  // Вороги з відомими позиціями
  const enemies = Array.from(companies.values()).filter(c =>
    c.side !== brigade.side && c.position
  )

  // Є вороги в радіусі контакту від будь-якої роти бригади?
  const nearEnemies = enemies.filter(e =>
    brigadeUnits.some(c => hexDistance(c.position!, e.position!) <= CONTACT_RADIUS)
  )

  if (nearEnemies.length === 0) {
    // Контакту немає — марш у формацію
    return marchInFormation(brigade, companies, zone)
  }

  // Є контакт — тактична відповідь
  return tacticalResponse(brigadeUnits, nearEnemies, zone, directive)
}

// ─── Марш у формацію ────────────────────────────────────────────────────────

function marchInFormation(
  brigade:   Brigade,
  companies: Map<string, Company>,
  zone:      ZoneOfOperation,
): CompanyAction[] {
  const targets = planFormation(brigade, companies, zone.targetHex)
  return targets.map(t => {
    const company = companies.get(t.companyId)
    const pos = company?.position
    // Рота вже на призначеному гексі — стоїмо, не мигаємо
    if (pos && pos.col === t.targetHex.col && pos.row === t.targetHex.row) {
      return { type: 'hold', companyId: t.companyId }
    }
    return { type: 'move', companyId: t.companyId, targetHex: t.targetHex }
  })
}

// ─── Тактична відповідь при контакті ────────────────────────────────────────

function tacticalResponse(
  brigadeUnits: Company[],
  enemies:      Company[],
  zone:         ZoneOfOperation,
  directive:    Directive,
): CompanyAction[] {

  // Основна ціль — найближчий ворог до цільового гексу
  const primaryTarget = enemies.reduce((closest, e) =>
    hexDistance(zone.targetHex, e.position!) < hexDistance(zone.targetHex, closest.position!)
      ? e : closest
  )

  // Поточний стан своїх — визначає чергу атаки
  const artFired    = brigadeUnits.some(c => c.type === CompanyType.Artillery   && c.attackCooldownMinutes > 0)
  const tanksHit    = brigadeUnits.some(c => c.type === CompanyType.Tank        && (c.inCombat || c.isSuppressed))
  const assaultHit  = brigadeUnits.some(c => c.type === CompanyType.Assault     && (c.inCombat || c.isSuppressed))

  const actions: CompanyAction[] = []

  for (const company of brigadeUnits) {
    if (company.inCombat) continue  // не перебиваємо активний бій

    const action = resolveAction(
      company, primaryTarget, enemies,
      directive, artFired, tanksHit, assaultHit,
    )
    if (action) actions.push(action)
  }

  return actions
}

// ─── Логіка кожного типу роти ───────────────────────────────────────────────

function resolveAction(
  company:      Company,
  target:       Company,
  allEnemies:   Company[],
  directive:    Directive,
  artFired:     boolean,
  tanksHit:     boolean,
  assaultHit:   boolean,
): CompanyAction | null {

  const pos       = company.position!
  const targetPos = target.position!
  const distToTarget = hexDistance(pos, targetPos)

  switch (company.type) {

    case CompanyType.Recon: {
      // Підходить до межі ZoC ворога, але не входить у неї
      const safeDistance = getZocRadius(target) + RECON_SAFE_MARGIN
      if (distToTarget <= safeDistance) {
        return { type: 'hold', companyId: company.id }
      }
      // Ціль — гекс на безпечній відстані між нами і ворогом
      const safeHex = stepFromToward(targetPos, pos, safeDistance)
      return { type: 'move', companyId: company.id, targetHex: safeHex }
    }

    case CompanyType.UAV: {
      // Тримається у тилу: 3+ гексів від ворога
      const uavSafe = getZocRadius(target) + 3
      if (distToTarget <= uavSafe) {
        const pullBack = stepAwayFrom(pos, targetPos)
        return { type: 'move', companyId: company.id, targetHex: pullBack }
      }
      return { type: 'hold', companyId: company.id }
    }

    case CompanyType.Artillery: {
      if (directive === Directive.Cautious) {
        return { type: 'hold', companyId: company.id }
      }
      // Шукаємо вогневу позицію в зоні ураження
      if (distToTarget >= ART_RANGE_MIN && distToTarget <= ART_RANGE_MAX) {
        return { type: 'attack', companyId: company.id, targetHex: targetPos }
      }
      const firePos = findFirePosition(pos, targetPos)
      if (firePos) return { type: 'move', companyId: company.id, targetHex: firePos }
      return { type: 'hold', companyId: company.id }
    }

    case CompanyType.Tank: {
      if (directive === Directive.AllOut) {
        return { type: 'assault', companyId: company.id, targetId: target.id }
      }
      if (directive === Directive.Advance && artFired) {
        return { type: 'assault', companyId: company.id, targetId: target.id }
      }
      return { type: 'hold', companyId: company.id }
    }

    case CompanyType.Assault: {
      if (directive === Directive.AllOut) {
        return { type: 'assault', companyId: company.id, targetId: target.id }
      }
      if (directive === Directive.Advance) {
        if (tanksHit) {
          return { type: 'assault', companyId: company.id, targetId: target.id }
        }
        // Підтягується до "готової позиції" одразу за ZoC — щоб кинутись одразу як танки зав'яжуть
        const readyDist = getZocRadius(target) + 1
        if (distToTarget > readyDist) {
          return { type: 'move', companyId: company.id, targetHex: stepFromToward(targetPos, pos, readyDist) }
        }
        return { type: 'hold', companyId: company.id }
      }
      return { type: 'hold', companyId: company.id }
    }

    case CompanyType.Line: {
      if (directive === Directive.AllOut) {
        return { type: 'assault', companyId: company.id, targetId: target.id }
      }
      if (directive === Directive.Advance) {
        if (assaultHit) {
          return { type: 'assault', companyId: company.id, targetId: target.id }
        }
        // Підтягується на крок далі ніж штурмовики — готова хвиля підтримки
        const readyDist = getZocRadius(target) + 2
        if (distToTarget > readyDist) {
          return { type: 'move', companyId: company.id, targetHex: stepFromToward(targetPos, pos, readyDist) }
        }
        return { type: 'hold', companyId: company.id }
      }
      return { type: 'hold', companyId: company.id }
    }

    case CompanyType.Special: {
      // ССО діє незалежно від черги, але не при Cautious
      if (directive !== Directive.Cautious) {
        return { type: 'assault', companyId: company.id, targetId: target.id }
      }
      return { type: 'hold', companyId: company.id }
    }
  }
}

// ─── Допоміжні функції ───────────────────────────────────────────────────────

// Гекс на відстані `steps` від `from` у напрямку `toward`
function stepFromToward(from: HexPosition, toward: HexPosition, steps: number): HexPosition {
  let cur = from
  for (let i = 0; i < steps; i++) cur = stepToward(cur, toward)
  return cur
}

// Знаходить гекс у зоні ураження артилерії (між min та max від цілі)
function findFirePosition(from: HexPosition, target: HexPosition): HexPosition | null {
  let cur = from
  for (let i = 0; i < 20; i++) {
    const dist = hexDistance(cur, target)
    if (dist >= ART_RANGE_MIN && dist <= ART_RANGE_MAX) return cur
    cur = dist > ART_RANGE_MAX
      ? stepToward(cur, target)        // підходимо ближче
      : stepAwayFrom(cur, target)      // відходимо далі
    if (cur.col === from.col && cur.row === from.row) break  // застрягли
  }
  return null
}
