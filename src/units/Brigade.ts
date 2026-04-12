import { BrigadeType } from './types'
import type { BrigadeBonus, BrigadeWeakness } from './types'
import type { HexPosition } from './Company'

export class Brigade {
  readonly id: string
  readonly name: string
  readonly shortName: string
  readonly type: BrigadeType
  readonly bonus: BrigadeBonus
  readonly weakness?: BrigadeWeakness
  readonly hqPosition: HexPosition  // статична позиція штабу на карті

  constructor(params: {
    id: string
    name: string
    shortName: string
    type: BrigadeType
    bonus: BrigadeBonus
    weakness?: BrigadeWeakness
    hqPosition: HexPosition
  }) {
    this.id = params.id
    this.name = params.name
    this.shortName = params.shortName
    this.type = params.type
    this.bonus = params.bonus
    this.weakness = params.weakness
    this.hqPosition = params.hqPosition
  }
}
