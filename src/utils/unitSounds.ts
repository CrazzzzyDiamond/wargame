import { CompanyType } from '../units/types'
import { playSound } from './sound'

export type SoundEvent = 'select' | 'move' | 'attack'

// Vite імпортує всі mp3 файли з папок юнітів
const SSO_SELECT    = Object.values(import.meta.glob('../sound/sso/select/*.mp3',    { eager: true, import: 'default' })) as string[]
const SSO_MOVE      = Object.values(import.meta.glob('../sound/sso/move/*.mp3',      { eager: true, import: 'default' })) as string[]
const SSO_ATTACK    = Object.values(import.meta.glob('../sound/sso/attack/*.mp3',    { eager: true, import: 'default' })) as string[]

const ASSAULT_SELECT = Object.values(import.meta.glob('../sound/assault/select/*.mp3', { eager: true, import: 'default' })) as string[]
const ASSAULT_MOVE   = Object.values(import.meta.glob('../sound/assault/move/*.mp3',   { eager: true, import: 'default' })) as string[]
const ASSAULT_ATTACK = Object.values(import.meta.glob('../sound/assault/attack/*.mp3', { eager: true, import: 'default' })) as string[]

const LINE_SELECT = Object.values(import.meta.glob('../sound/line/select/*.mp3', { eager: true, import: 'default' })) as string[]
const LINE_MOVE   = Object.values(import.meta.glob('../sound/line/move/*.mp3',   { eager: true, import: 'default' })) as string[]
const LINE_ATTACK = Object.values(import.meta.glob('../sound/line/attack/*.mp3', { eager: true, import: 'default' })) as string[]

// Таблиця звуків по типу юніта і події
const SOUND_BANK: Partial<Record<CompanyType, Record<SoundEvent, string[]>>> = {
  [CompanyType.Special]: {
    select: SSO_SELECT,
    move:   SSO_MOVE,
    attack: SSO_ATTACK,
  },
  [CompanyType.Assault]: {
    select: ASSAULT_SELECT,
    move:   ASSAULT_MOVE,
    attack: ASSAULT_ATTACK,
  },
  [CompanyType.Line]: {
    select: LINE_SELECT,
    move:   LINE_MOVE,
    attack: LINE_ATTACK,
  },
}

// Рандомний елемент масиву
function pickRandom<T>(arr: T[]): T | null {
  if (!arr.length) return null
  return arr[Math.floor(Math.random() * arr.length)]
}

// Програє рандомну фразу для юніта
// Повертає true якщо звук був зіграний (є в банку), false — якщо нема
export function playUnitSound(type: CompanyType, event: SoundEvent): boolean {
  const sounds = SOUND_BANK[type]?.[event]
  if (!sounds?.length) return false
  const src = pickRandom(sounds)
  if (src) playSound(src)
  return true
}
