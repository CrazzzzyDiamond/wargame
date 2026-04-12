import { BattalionType, Readiness } from './types'

// Батальйон — логічний контейнер без позиції на карті.
// Групує роти, відповідає за когезію і readiness всередині групи.
export class Battalion {
  readonly id: string
  readonly name: string
  readonly type: BattalionType
  readonly brigadeId: string

  // Максимальна відстань між ротами в гексах до штрафу когезії
  readonly cohesionRadius: number

  // ID рот що входять до батальйону
  private companyIds: string[]

  constructor(params: {
    id: string
    name: string
    type: BattalionType
    brigadeId: string
    cohesionRadius?: number
  }) {
    this.id = params.id
    this.name = params.name
    this.type = params.type
    this.brigadeId = params.brigadeId
    this.cohesionRadius = params.cohesionRadius ?? 3
    this.companyIds = []
  }

  addCompany(companyId: string): void {
    this.companyIds.push(companyId)
  }

  getCompanyIds(): readonly string[] {
    return this.companyIds
  }

  // Readiness батальйону = найгірший стан серед його рот
  // companyReadiness — мапа { companyId → Readiness }, передаєтьсяззовні
  calcReadiness(companyReadiness: Map<string, Readiness>): Readiness {
    let worst = Readiness.Ready

    for (const id of this.companyIds) {
      const r = companyReadiness.get(id)
      if (r === Readiness.Exhausted) return Readiness.Exhausted
      if (r === Readiness.Strained) worst = Readiness.Strained
    }

    return worst
  }
}
