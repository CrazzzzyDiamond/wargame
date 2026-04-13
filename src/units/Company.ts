import { CompanyType, Readiness, Morale, EntrenchState, Side } from './types'

// Позиція роти на гексовій сітці
export interface HexPosition {
  col: number
  row: number
}

export class Company {
  readonly id: string
  readonly name: string
  readonly type: CompanyType
  readonly battalionId: string
  readonly brigadeId: string

  readonly side: Side           // сторона конфлікту
  position: HexPosition | null  // null = не розгорнута на карті
  targetHex: HexPosition | null // кінцева точка наказаного маршруту
  movementProgress: number      // прогрес руху до наступного гексу (0–1)
  readiness: Readiness
  morale: Morale
  strength: number              // чисельність роти 0–100, витрачається в бою
  entrenchState: EntrenchState  // стан окопування (тільки для Line)
  entrenchMinutesLeft: number   // залишок ігрових хвилин до зміни стану

  constructor(params: {
    id: string
    name: string
    type: CompanyType
    battalionId: string
    brigadeId: string
    position?: HexPosition
    strength?: number
    side?: Side
  }) {
    this.id = params.id
    this.name = params.name
    this.type = params.type
    this.battalionId = params.battalionId
    this.brigadeId = params.brigadeId
    this.side = params.side ?? Side.Ukraine
    this.position = params.position ?? null
    this.targetHex = null
    this.movementProgress = 0
    this.readiness = Readiness.Ready
    this.morale = Morale.Steady
    this.strength = params.strength ?? 100
    this.entrenchState = EntrenchState.None
    this.entrenchMinutesLeft = 0
  }

  // Чи знаходиться рота на карті
  isDeployed(): boolean {
    return this.position !== null
  }

  // Видимість роти — радіус гексів в якому знімається туман війни
  get visionRadius(): number {
    switch (this.type) {
      case CompanyType.UAV:       return 6  // найширший радіус
      case CompanyType.Recon:     return 4  // наземна розвідка
      case CompanyType.Special:   return 3  // бачить, але сам невидимий
      case CompanyType.Artillery: return 3  // спостерігач для коригування
      default:                    return 2  // штурмова, лінійна, танкова
    }
  }

  // Чи видима рота для противника
  get isVisible(): boolean {
    return this.type !== CompanyType.Special
  }
}
