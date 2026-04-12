import { create } from 'zustand'
import type { Company } from '../units/Company'
import type { Battalion } from '../units/Battalion'
import type { Brigade } from '../units/Brigade'
import type { HexPosition } from '../units/Company'

export type GameSpeed = 'paused' | 'normal' | 'fast'

export interface GameState {
  // Ігрові сутності
  brigades: Map<string, Brigade>
  battalions: Map<string, Battalion>
  companies: Map<string, Company>

  // Вибраний юніт
  selectedCompanyId: string | null

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

  // Дії — час
  setSpeed: (speed: GameSpeed) => void
  tick: (deltaSeconds: number) => void
}

export const useGameStore = create<GameState>((set) => ({
  brigades: new Map(),
  battalions: new Map(),
  companies: new Map(),

  selectedCompanyId: null,
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

  moveCompany: (companyId, position) => set((state) => {
    const companies = new Map(state.companies)
    const company = companies.get(companyId)
    if (!company) return {}
    company.position = position
    return { companies }
  }),

  selectCompany: (companyId) => set({ selectedCompanyId: companyId }),

  setSpeed: (speed) => set({ speed }),

  tick: (deltaSeconds) => set((state) => {
    if (state.speed === 'paused') return {}
    return { elapsedSeconds: state.elapsedSeconds + deltaSeconds }
  }),
}))
