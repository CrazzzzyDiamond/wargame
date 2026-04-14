import { create } from 'zustand'
import type { Company } from '../units/Company'
import type { Battalion } from '../units/Battalion'
import type { Brigade } from '../units/Brigade'
import type { HexPosition } from '../units/Company'
import { Directive, TerrainType, EntrenchState, CompanyType, Side, Readiness, Morale } from '../units/types'
import { stepToward, hexDistance } from '../utils/hexUtils'
import { getTerrain } from '../utils/terrainAnalysis'
import { getZocRadius } from '../utils/unitStatus'
import { calcDamage, ARTILLERY_MORALE_DAMAGE } from '../utils/combat'

// Ігрових хвилин на 1 реальну секунду для кожної швидкості
const SPEED_MULTIPLIERS: Record<GameSpeed, number> = {
  paused: 0,
  normal: 5,   // 5 хв / сек → 1 гекс за ~4 реальні секунди
  fast:   20,  // 20 хв / сек → 1 гекс за ~1 реальну секунду
}

// Скільки ігрових хвилин займає прохід 1 гексу (піхота ~4 км/год, гекс ~1.3 км)
const MINUTES_PER_HEX = 20

export type GameSpeed = 'paused' | 'normal' | 'fast'

export interface GameState {
  // Ігрові сутності
  brigades: Map<string, Brigade>
  battalions: Map<string, Battalion>
  companies: Map<string, Company>

  // Вибраний юніт
  selectedCompanyId: string | null

  // Вибраний штаб і директиви бригад
  selectedHQId: string | null
  brigadeDirectives: Map<string, Directive>

  // Ландшафт гексів
  terrainMap: Map<string, TerrainType>
  setTerrainMap: (terrain: Map<string, TerrainType>) => void
  setHexTerrain: (col: number, row: number, terrain: TerrainType) => void

  // Стан часу
  speed: GameSpeed
  elapsedSeconds: number  // ігровий час в секундах від початку операції

  // Дії — сутності
  addBrigade: (brigade: Brigade) => void
  addBattalion: (battalion: Battalion) => void
  addCompany: (company: Company) => void
  removeCompany: (companyId: string) => void

  // Дії — переміщення
  moveCompany: (companyId: string, position: HexPosition) => void

  // Дії — окопування (тільки Line)
  startEntrench: (companyId: string) => void
  leaveEntrench: (companyId: string) => void

  // Дії — артилерійський вогонь
  setAttackTarget: (companyId: string, hex: HexPosition | null) => void

  // Дії — вибір
  selectCompany: (companyId: string | null) => void
  selectHQ: (brigadeId: string | null) => void
  setDirective: (brigadeId: string, directive: Directive) => void

  // Дії — час
  setSpeed: (speed: GameSpeed) => void
  tick: (deltaSeconds: number) => void

  // Поточний zoom карти
  zoom: number
  setZoom: (zoom: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  brigades: new Map(),
  battalions: new Map(),
  companies: new Map(),

  selectedCompanyId: null,
  selectedHQId: null,
  brigadeDirectives: new Map(),
  terrainMap: new Map(),
  speed: 'normal',
  elapsedSeconds: 0,

  addBrigade: (brigade) => set((state) => {
    const brigades = new Map(state.brigades)
    brigades.set(brigade.id, brigade)
    return { brigades }
  }),

  addBattalion: (battalion) => set((state) => {
    const battalions = new Map(state.battalions)
    battalions.set(battalion.id, battalion)
    return { battalions }
  }),

  addCompany: (company) => set((state) => {
    const companies = new Map(state.companies)
    companies.set(company.id, company)
    return { companies }
  }),

  removeCompany: (companyId) => set((state) => {
    const companies = new Map(state.companies)
    companies.delete(companyId)
    return { companies }
  }),

  moveCompany: (companyId, targetHex) => set((state) => {
    const companies = new Map(state.companies)
    const company = companies.get(companyId)
    if (!company) return {}
    // Заблокувати рух якщо окопана або копає
    if (company.entrenchState === EntrenchState.Entrenched ||
        company.entrenchState === EntrenchState.Entrenching) return {}
    company.targetHex = targetHex
    company.movementProgress = 0
    return { companies }
  }),

  startEntrench: (companyId) => set((state) => {
    const companies = new Map(state.companies)
    const company = companies.get(companyId)
    if (!company || company.type !== CompanyType.Line) return {}
    if (company.entrenchState !== EntrenchState.None) return {}
    company.entrenchState = EntrenchState.Entrenching
    company.entrenchMinutesLeft = 240  // 4 ігрові години
    company.targetHex = null           // скасовуємо рух
    return { companies }
  }),

  leaveEntrench: (companyId) => set((state) => {
    const companies = new Map(state.companies)
    const company = companies.get(companyId)
    if (!company) return {}
    if (company.entrenchState !== EntrenchState.Entrenched) return {}
    company.entrenchState = EntrenchState.Leaving
    company.entrenchMinutesLeft = 60   // 1 ігрова година
    return { companies }
  }),

  setAttackTarget: (companyId, hex) => set((state) => {
    const companies = new Map(state.companies)
    const company = companies.get(companyId)
    if (!company || company.type !== CompanyType.Artillery) return {}
    company.attackTargetHex = hex
    return { companies }
  }),

  setTerrainMap: (terrain) => set({ terrainMap: terrain }),

  setHexTerrain: (col, row, terrain) => set((state) => {
    const terrainMap = new Map(state.terrainMap)
    terrainMap.set(`${col},${row}`, terrain)
    return { terrainMap }
  }),

  selectCompany: (companyId) => set({ selectedCompanyId: companyId }),

  selectHQ: (brigadeId) => set({ selectedHQId: brigadeId }),

  setDirective: (brigadeId, directive) => set((state) => {
    const brigadeDirectives = new Map(state.brigadeDirectives)
    brigadeDirectives.set(brigadeId, directive)
    return { brigadeDirectives }
  }),

  zoom: 9,
  setZoom: (zoom) => set({ zoom }),

  setSpeed: (speed) => set({ speed }),

  tick: (deltaSeconds) => set((state) => {
    if (state.speed === 'paused') return {}

    const gameMinutes = deltaSeconds * SPEED_MULTIPLIERS[state.speed]
    const hexProgress = gameMinutes / MINUTES_PER_HEX

    const companies = new Map(state.companies)
    const brigades  = state.brigades

    // ---- Окопування ----
    for (const company of companies.values()) {
      if (company.entrenchState === EntrenchState.Entrenching ||
          company.entrenchState === EntrenchState.Leaving) {
        company.entrenchMinutesLeft -= gameMinutes
        if (company.entrenchMinutesLeft <= 0) {
          company.entrenchMinutesLeft = 0
          company.entrenchState = company.entrenchState === EntrenchState.Entrenching
            ? EntrenchState.Entrenched
            : EntrenchState.None
        }
      }
    }

    // ---- Бойовий контакт ----
    // Для кожного юніта збираємо список ворожих атакуючих (хто покриває його гекс своїм ZoC)
    // ССО ігнорується як ціль ZoC перевірки (не зупиняється)
    const attackersOf = new Map<string, string[]>()  // companyId → [attackerId, ...]

    const allDeployed = Array.from(companies.values()).filter(c => c.position)

    for (const defender of allDeployed) {
      const enemies = allDeployed.filter(c => c.side !== defender.side && c.position)
      const attackers = enemies.filter(enemy => {
        const zoc = getZocRadius(enemy)
        return zoc > 0 && hexDistance(defender.position!, enemy.position!) <= zoc
      })
      attackersOf.set(defender.id, attackers.map(a => a.id))
    }

    // Скидаємо інCombat і isRetreating, потім виставляємо заново
    for (const company of companies.values()) {
      company.inCombat = false
      if (!company.targetHex) company.isRetreating = false
    }

    // Накопичуємо дамаг окремо, щоб застосувати після всіх розрахунків
    const pendingDamage      = new Map<string, number>()
    const pendingMoraleDamage = new Map<string, number>()

    for (const [defenderId, attackerIds] of attackersOf) {
      if (attackerIds.length === 0) continue

      const defender = companies.get(defenderId)!

      // ССО і танки не зупиняються ZoC — рухаються навіть у бою
      const isMobile = defender.type === CompanyType.Special || defender.type === CompanyType.Tank
      if (!isMobile) defender.inCombat = true

      // Відступ під вогнем: не-мобільна піхота у бою з наказом руху
      if (!isMobile && defender.targetHex && defender.side === Side.Ukraine) {
        defender.isRetreating = true
      }

      // Дамаг по захиснику від кожного атакуючого
      const defTerrain = getTerrain(state.terrainMap, defender.position!.col, defender.position!.row)
      for (const attackerId of attackerIds) {
        const attacker = companies.get(attackerId)!
        const atkTerrain = getTerrain(state.terrainMap, attacker.position!.col, attacker.position!.row)
        const dmg = calcDamage(defTerrain, defender.entrenchState, attackerIds.length, attacker.type, defender.type, defender.isRetreating, atkTerrain, attacker.morale, defender.morale)
        pendingDamage.set(defenderId, (pendingDamage.get(defenderId) ?? 0) + dmg)

        // Артилерія б'є по morale окопаної піхоти незалежно від укриття
        if (attacker.type === CompanyType.Artillery &&
            defender.type === CompanyType.Line &&
            defender.entrenchState === EntrenchState.Entrenched) {
          pendingMoraleDamage.set(defenderId, (pendingMoraleDamage.get(defenderId) ?? 0) + ARTILLERY_MORALE_DAMAGE)
        }
      }

      // Відповідний вогонь: захисник б'є по кожному атакуючому
      for (const attackerId of attackerIds) {
        const attacker = companies.get(attackerId)!
        attacker.inCombat = true
        const atkTerrain = getTerrain(state.terrainMap, attacker.position!.col, attacker.position!.row)
        const counterCount = (attackersOf.get(attackerId) ?? []).length || 1
        const dmg = calcDamage(atkTerrain, attacker.entrenchState, counterCount, defender.type, attacker.type, attacker.isRetreating, defTerrain, defender.morale, attacker.morale)
        pendingDamage.set(attackerId, (pendingDamage.get(attackerId) ?? 0) + dmg)
      }
    }

    // Застосовуємо дамаг і оновлюємо readiness
    const toRemove: string[] = []

    for (const [id, dmg] of pendingDamage) {
      const company = companies.get(id)!
      company.strength = Math.max(0, company.strength - dmg)

      // Readiness залежить від strength
      if (company.strength <= 0) {
        toRemove.push(id)
        continue
      }
      if (company.strength < 30) {
        company.readiness = Readiness.Exhausted
      } else if (company.strength < 60) {
        company.readiness = Readiness.Strained
      }

      // Авто-відступ: Exhausted → рухаємо до HQ, але НЕ якщо окопана лінійна
      const isEntrenched = company.type === CompanyType.Line &&
                           company.entrenchState === EntrenchState.Entrenched
      if (company.readiness === Readiness.Exhausted && company.side === Side.Ukraine && !isEntrenched) {
        const hq = brigades.get(company.brigadeId)?.hqPosition
        if (hq) {
          company.targetHex = hq
          company.inCombat = false
        }
      }
    }

    // Застосовуємо дамаг по morale (артилерія по окопаній піхоті)
    const MORALE_STAGES = [Morale.High, Morale.Steady, Morale.Shaken, Morale.Panic]
    for (const [id, dmg] of pendingMoraleDamage) {
      const company = companies.get(id)
      if (!company) continue
      const currentIdx = MORALE_STAGES.indexOf(company.morale)
      // Накопичуємо дробовий дамаг: кожен 1.0 = один крок вниз по morale
      const steps = Math.floor(dmg)
      const newIdx = Math.min(MORALE_STAGES.length - 1, currentIdx + steps)
      company.morale = MORALE_STAGES[newIdx]
    }

    for (const id of toRemove) companies.delete(id)

    // ---- Артилерійський вогонь ----
    const ARTILLERY_COOLDOWN_MINUTES = 30  // cooldown між пострілами
    const artToRemove: string[] = []

    for (const artillery of companies.values()) {
      if (artillery.type !== CompanyType.Artillery) continue
      if (!artillery.position) continue

      // Знижуємо cooldown
      if (artillery.attackCooldownMinutes > 0) {
        artillery.attackCooldownMinutes = Math.max(0, artillery.attackCooldownMinutes - gameMinutes)
        continue
      }

      // Визначаємо ціль: ручна або авто (найближчий ворог у зоні ураження)
      const range = { min: 4, max: 9 }
      let targetHex = artillery.attackTargetHex

      if (!targetHex) {
        // Авто-режим: шукаємо найближчого ворога в зоні ураження
        let bestDist = Infinity
        for (const enemy of companies.values()) {
          if (enemy.side === artillery.side || !enemy.position) continue
          const dist = hexDistance(artillery.position, enemy.position)
          if (dist >= range.min && dist <= range.max && dist < bestDist) {
            bestDist = dist
            targetHex = enemy.position
          }
        }
      }

      if (!targetHex) continue

      // Перевіряємо що ціль в зоні ураження
      const dist = hexDistance(artillery.position, targetHex)
      if (dist < range.min || dist > range.max) {
        artillery.attackTargetHex = null
        continue
      }

      // Б'ємо по всіх ворогах на цільовому гексі
      for (const target of companies.values()) {
        if (target.side === artillery.side || !target.position) continue
        if (target.position.col !== targetHex.col || target.position.row !== targetHex.row) continue

        const targetTerrain = getTerrain(state.terrainMap, target.position.col, target.position.row)
        const dmg = calcDamage(targetTerrain, target.entrenchState, 1, CompanyType.Artillery, target.type)
        target.strength = Math.max(0, target.strength - dmg)
        if (target.strength <= 0) artToRemove.push(target.id)
        else if (target.strength < 30) target.readiness = Readiness.Exhausted
        else if (target.strength < 60) target.readiness = Readiness.Strained
      }

      artillery.attackCooldownMinutes = ARTILLERY_COOLDOWN_MINUTES
    }

    for (const id of artToRemove) companies.delete(id)

    // ---- Рух ----
    for (const company of companies.values()) {
      // ССО і танки рухаються навіть у бою; решта — блокується
      const isMobileUnit = company.type === CompanyType.Special || company.type === CompanyType.Tank
      if (!isMobileUnit && company.inCombat) continue
      // Окопана лінійна піхота не рухається навіть при Panic
      if (company.type === CompanyType.Line &&
          company.entrenchState === EntrenchState.Entrenched &&
          company.morale === Morale.Panic) { company.targetHex = null; continue }
      if (company.entrenchState === EntrenchState.Entrenched ||
          company.entrenchState === EntrenchState.Entrenching) continue
      if (!company.targetHex || !company.position) continue

      // Recon +50% швидкість; відступ під вогнем −50%
      let speedMult = 1.0
      if (company.type === CompanyType.Recon)  speedMult *= 1.5
      if (company.isRetreating)                speedMult *= 0.5

      company.movementProgress += hexProgress * speedMult

      while (company.movementProgress >= 1.0 && company.targetHex) {
        company.movementProgress -= 1.0
        const next = stepToward(company.position, company.targetHex)
        company.position = next

        if (next.col === company.targetHex.col && next.row === company.targetHex.row) {
          company.targetHex = null
          company.movementProgress = 0
          break
        }
      }
    }

    return {
      companies,
      elapsedSeconds: state.elapsedSeconds + deltaSeconds,
    }
  }),
}))
