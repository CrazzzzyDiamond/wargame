import { Brigade } from './Brigade'
import { Battalion } from './Battalion'
import { Company } from './Company'
import { BrigadeType, BonusType, BattalionType, CompanyType } from './types'
import type { GameState } from '../store/gameStore'

type Store = Pick<GameState, 'addBrigade' | 'addBattalion' | 'addCompany'>

function addBrigadeWithUnits(
  store: Store,
  brigade: Brigade,
  battalions: { battalion: Battalion; companies: Company[] }[]
) {
  store.addBrigade(brigade)
  for (const { battalion, companies } of battalions) {
    companies.forEach(c => battalion.addCompany(c.id))
    store.addBattalion(battalion)
    companies.forEach(c => store.addCompany(c))
  }
}

// Початкові дані для сценарію — 6 вересня 2022
export function seedScenario(store: Store) {

  // 80-та ОДШБр — захід від Балаклії, ударний кулак
  addBrigadeWithUnits(store, new Brigade({
    id: '80-odshbr',
    name: '80-та окрема десантно-штурмова бригада',
    shortName: '80 ОДШБр',
    type: BrigadeType.DSV,
    bonus: { type: BonusType.AssaultSpeed, description: 'Прорив без штрафу до швидкості при штурмі', value: 1.5 },
  }), [{
    battalion: new Battalion({ id: '80-1bat', name: '1-й штурмовий батальйон', type: BattalionType.Assault, brigadeId: '80-odshbr' }),
    companies: [
      new Company({ id: '80-1bat-1co', name: '1-а штурмова рота',   type: CompanyType.Assault, battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 9,  row: 11 } }),
      new Company({ id: '80-1bat-2co', name: '2-а штурмова рота',   type: CompanyType.Assault, battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 10, row: 11 } }),
      new Company({ id: '80-1bat-rec', name: 'Розвідувальна рота',  type: CompanyType.Recon,   battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 9,  row: 12 } }),
      new Company({ id: '80-1bat-uav', name: 'Рота БПЛА',           type: CompanyType.UAV,     battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 8,  row: 11 } }),
    ],
  }])

  // 95-та ОДШБр — північніше, фланговий маневр
  addBrigadeWithUnits(store, new Brigade({
    id: '95-odshbr',
    name: '95-та окрема десантно-штурмова бригада',
    shortName: '95 ОДШБр',
    type: BrigadeType.DSV,
    bonus: { type: BonusType.AssaultSpeed, description: 'Прискорене переміщення по пересіченій місцевості', value: 1.3 },
  }), [{
    battalion: new Battalion({ id: '95-1bat', name: '1-й штурмовий батальйон', type: BattalionType.Assault, brigadeId: '95-odshbr' }),
    companies: [
      new Company({ id: '95-1bat-1co',  name: '1-а штурмова рота',  type: CompanyType.Assault, battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 12, row: 13 } }),
      new Company({ id: '95-1bat-2co',  name: '2-а штурмова рота',  type: CompanyType.Assault, battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 13, row: 13 } }),
      new Company({ id: '95-1bat-spec', name: 'Спецпідрозділ',      type: CompanyType.Special,  battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 12, row: 14 } }),
    ],
  }])

  // 25-та ОПДБр — східний напрямок, Куп'янськ
  addBrigadeWithUnits(store, new Brigade({
    id: '25-opdbr',
    name: '25-та окрема повітрянодесантна бригада',
    shortName: '25 ОПДБр',
    type: BrigadeType.DSV,
    bonus: { type: BonusType.AssaultSpeed, description: 'Підвищена мобільність при охопленні флангів', value: 1.3 },
  }), [{
    battalion: new Battalion({ id: '25-1bat', name: '1-й десантний батальйон', type: BattalionType.Airborne, brigadeId: '25-opdbr' }),
    companies: [
      new Company({ id: '25-1bat-1co',  name: '1-а десантна рота',  type: CompanyType.Assault, battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 18, row: 15 } }),
      new Company({ id: '25-1bat-2co',  name: '2-а десантна рота',  type: CompanyType.Line,    battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 19, row: 15 } }),
      new Company({ id: '25-1bat-rec',  name: 'Розвідувальна рота', type: CompanyType.Recon,   battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 18, row: 16 } }),
      new Company({ id: '25-1bat-uav',  name: 'Рота БПЛА',          type: CompanyType.UAV,     battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 17, row: 15 } }),
    ],
  }])
}
