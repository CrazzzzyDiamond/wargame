import { Brigade } from './Brigade'
import { Battalion } from './Battalion'
import { Company } from './Company'
import { BrigadeType, BonusType, BattalionType, CompanyType, Side } from './types'
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
    hqPosition: { col: 7, row: 11 },
  }), [
    {
      battalion: new Battalion({ id: '80-1bat', name: '1-й штурмовий батальйон', type: BattalionType.Assault, brigadeId: '80-odshbr' }),
      companies: [
        new Company({ id: '80-1bat-1co', name: '1-а штурмова рота',  type: CompanyType.Assault,   battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 9,  row: 11 } }),
        new Company({ id: '80-1bat-2co', name: '2-а штурмова рота',  type: CompanyType.Assault,   battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 10, row: 11 } }),
        new Company({ id: '80-1bat-rec', name: 'Розвідувальна рота', type: CompanyType.Recon,     battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 9,  row: 12 } }),
        new Company({ id: '80-1bat-uav', name: 'Рота БПЛА',          type: CompanyType.UAV,       battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 8,  row: 11 } }),
      ],
    },
    {
      battalion: new Battalion({ id: '80-2bat', name: '2-й танковий батальйон', type: BattalionType.Tank, brigadeId: '80-odshbr' }),
      companies: [
        new Company({ id: '80-2bat-tnk', name: 'Танкова рота',          type: CompanyType.Tank,      battalionId: '80-2bat', brigadeId: '80-odshbr', position: { col: 7,  row: 10 } }),
        new Company({ id: '80-2bat-art', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '80-2bat', brigadeId: '80-odshbr', position: { col: 6,  row: 11 } }),
      ],
    },
  ])

  // Юніти РФ — статична оборона
  const rfBrigade = new Brigade({
    id: 'rf-20-army',
    name: '20-та загальновійськова армія РФ',
    shortName: '20 ЗВА РФ',
    type: BrigadeType.Ground,
    side: Side.Russia,
    bonus: { type: BonusType.DefenseBonus, description: 'Підготовлена оборона', value: 1.2 },
    hqPosition: { col: 14, row: 11 },
  })
  const rfBat = new Battalion({ id: 'rf-1bat', name: '1-й батальйон', type: BattalionType.Mechanized, brigadeId: 'rf-20-army' })
  const rfCompanies = [
    new Company({ id: 'rf-1bat-1co', name: '1-а лінійна рота', type: CompanyType.Line, battalionId: 'rf-1bat', brigadeId: 'rf-20-army', side: Side.Russia, position: { col: 26, row: 8  } }),
    new Company({ id: 'rf-1bat-2co', name: '2-а лінійна рота', type: CompanyType.Line, battalionId: 'rf-1bat', brigadeId: 'rf-20-army', side: Side.Russia, position: { col: 28, row: 10 } }),
    new Company({ id: 'rf-1bat-tnk', name: 'Танкова рота',     type: CompanyType.Tank, battalionId: 'rf-1bat', brigadeId: 'rf-20-army', side: Side.Russia, position: { col: 27, row: 9  } }),
  ]
  rfCompanies.forEach(c => rfBat.addCompany(c.id))
  store.addBrigade(rfBrigade)
  store.addBattalion(rfBat)
  rfCompanies.forEach(c => store.addCompany(c))
}
