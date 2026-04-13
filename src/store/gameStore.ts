import { create } from 'zustand'
import type { Company } from '../units/Company'
import type { Battalion } from '../units/Battalion'
import type { Brigade } from '../units/Brigade'
import type { HexPosition } from '../units/Company'
import { Directive, TerrainType, EntrenchState, CompanyType, Side, Readiness } from '../units/types'
import { stepToward, hexDistance } from '../utils/hexUtils'
import { getTerrain } from '../utils/terrainAnalysis'
import { getZocRadius } from '../utils/unitStatus'
import { calcDamage } from '../utils/combat'

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

  // Стан часу
  speed: GameSpeed
  elapsedSeconds: number  // ігровий час в секундах від початку операції

  // Дії — сутності
  addBrigade: (brigade: Brigade) => void
  addBattalion: (battalion: Battalion) => void
  addCompany: (company: Company) => void

  // Дії — переміщення
  moveCompany: (companyId: string, position: HexPosition) => void

  // Дії — окопування (тільки Line)
  startEntrench: (companyId: string) => void
  leaveEntrench: (companyId: string) => void

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

  setTerrainMap: (terrain) => set({ terrainMap: terrain }),

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
    const pendingDamage = new Map<string, number>()

    for (const [defenderId, attackerIds] of attackersOf) {
      if (attackerIds.length === 0) continue

      const defender = companies.get(defenderId)!

      // ССО не зупиняється ZoC, але все одно бере і дає дамаг
      const isSSODefender = defender.type === CompanyType.Special
      if (!isSSODefender) defender.inCombat = true

      // Відступ під вогнем: піхота у бою з наказом руху
      if (!isSSODefender && defender.targetHex && defender.side === Side.Ukraine) {
        defender.isRetreating = true
      }

      // Дамаг по захиснику від кожного атакуючого
      const defTerrain = getTerrain(state.terrainMap, defender.position!.col, defender.position!.row)
      for (const attackerId of attackerIds) {
        const attacker = companies.get(attackerId)!
        const dmg = calcDamage(defTerrain, defender.entrenchState, attackerIds.length, attacker.type, defender.type, defender.isRetreating)
        pendingDamage.set(defenderId, (pendingDamage.get(defenderId) ?? 0) + dmg)
      }

      // Відповідний вогонь: захисник б'є по кожному атакуючому
      for (const attackerId of attackerIds) {
        const attacker = companies.get(attackerId)!
        attacker.inCombat = true
        const atkTerrain = getTerrain(state.terrainMap, attacker.position!.col, attacker.position!.row)
        const counterCount = (attackersOf.get(attackerId) ?? []).length || 1
        const dmg = calcDamage(atkTerrain, attacker.entrenchState, counterCount, defender.type, attacker.type, attacker.isRetreating)
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

      // Авто-відступ: Exhausted → рухаємо до HQ бригади
      if (company.readiness === Readiness.Exhausted && company.side === Side.Ukraine) {
        const hq = brigades.get(company.brigadeId)?.hqPosition
        if (hq) {
          company.targetHex = hq
          company.inCombat = false
        }
      }
    }

    for (const id of toRemove) companies.delete(id)

    // ---- Рух ----
    for (const company of companies.values()) {
      // ССО рухається навіть у бою; решта — блокується
      const isSSO = company.type === CompanyType.Special
      if (!isSSO && company.inCombat) continue
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
