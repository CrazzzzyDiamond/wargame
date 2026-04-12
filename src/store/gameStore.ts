import { create } from 'zustand'
import type { Company } from '../units/Company'
import type { Battalion } from '../units/Battalion'
import type { Brigade } from '../units/Brigade'
import type { HexPosition } from '../units/Company'
import { Directive, TerrainType } from '../units/types'
import { stepToward } from '../utils/hexUtils'

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
  speed: 'paused',
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
    // Встановлюємо ціль — рух відбуватиметься через tick
    company.targetHex = targetHex
    company.movementProgress = 0
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

    for (const company of companies.values()) {
      if (!company.targetHex || !company.position) continue

      company.movementProgress += hexProgress

      // Один крок за раз — при накопиченні повного прогресу
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
