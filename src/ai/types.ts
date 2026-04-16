import type { HexPosition } from '../units/Company'

// Зона операцій бригади — зараз один гекс, пізніше може бути полігон/сектор
export interface ZoneOfOperation {
  targetHex: HexPosition
  // Майбутнє: polygon?, radius?, attackDirection?
}

// Дії які АІ-контролер повертає для кожної роти
export type CompanyAction =
  | { type: 'move';    companyId: string; targetHex: HexPosition }
  | { type: 'assault'; companyId: string; targetId:  string      }
  | { type: 'hold';    companyId: string                         }
  | { type: 'attack';  companyId: string; targetHex: HexPosition }  // арта
