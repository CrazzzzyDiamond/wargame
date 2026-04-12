import { CompanyType, Readiness, Morale } from './types'

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

  position: HexPosition | null  // null = не розгорнута на карті
  readiness: Readiness
  morale: Morale

  constructor(params: {
    id: string
    name: string
    type: CompanyType
    battalionId: string
    brigadeId: string
    position?: HexPosition
  }) {
    this.id = params.id
    this.name = params.name
    this.type = params.type
    this.battalionId = params.battalionId
    this.brigadeId = params.brigadeId
    this.position = params.position ?? null
    this.readiness = Readiness.Ready
    this.morale = Morale.Steady
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
