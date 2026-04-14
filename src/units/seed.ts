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

  // 95-та ОДШБр — північніше, фланговий маневр
  addBrigadeWithUnits(store, new Brigade({
    id: '95-odshbr',
    name: '95-та окрема десантно-штурмова бригада',
    shortName: '95 ОДШБр',
    type: BrigadeType.DSV,
    bonus: { type: BonusType.AssaultSpeed, description: 'Прискорене переміщення по пересіченій місцевості', value: 1.3 },
    hqPosition: { col: 10, row: 8 },
  }), [
    {
      battalion: new Battalion({ id: '95-1bat', name: '1-й штурмовий батальйон', type: BattalionType.Assault, brigadeId: '95-odshbr' }),
      companies: [
        new Company({ id: '95-1bat-1co',  name: '1-а штурмова рота', type: CompanyType.Assault,   battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 12, row: 8  } }),
        new Company({ id: '95-1bat-2co',  name: '2-а штурмова рота', type: CompanyType.Assault,   battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 13, row: 8  } }),
        new Company({ id: '95-1bat-rec',  name: 'Розвідувальна рота', type: CompanyType.Recon,    battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 12, row: 9  } }),
        new Company({ id: '95-1bat-uav',  name: 'Рота БПЛА',          type: CompanyType.UAV,      battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 11, row: 8  } }),
        new Company({ id: '95-1bat-tnk',  name: 'Танкова рота',       type: CompanyType.Tank,     battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 11, row: 9  } }),
        new Company({ id: '95-1bat-art',  name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 10, row: 9  } }),
      ],
    },
  ])

  // 92-га ОМБр — звільнення Куп'янська
  addBrigadeWithUnits(store, new Brigade({
    id: '92-ombr',
    name: '92-га окрема механізована бригада',
    shortName: '92 ОМБр',
    type: BrigadeType.Ground,
    bonus: { type: BonusType.UrbanCombat, description: 'Бонус у міській забудові', value: 1.3 },
    hqPosition: { col: 14, row: 14 },
  }), [
    {
      battalion: new Battalion({ id: '92-1bat', name: '1-й механізований батальйон', type: BattalionType.Mechanized, brigadeId: '92-ombr' }),
      companies: [
        new Company({ id: '92-1bat-1co', name: '1-а механізована рота', type: CompanyType.Assault,   battalionId: '92-1bat', brigadeId: '92-ombr', position: { col: 16, row: 14 } }),
        new Company({ id: '92-1bat-2co', name: '2-а механізована рота', type: CompanyType.Line,      battalionId: '92-1bat', brigadeId: '92-ombr', position: { col: 17, row: 14 } }),
        new Company({ id: '92-1bat-tnk', name: 'Танкова рота',          type: CompanyType.Tank,      battalionId: '92-1bat', brigadeId: '92-ombr', position: { col: 16, row: 15 } }),
        new Company({ id: '92-1bat-rec', name: 'Розвідувальна рота',    type: CompanyType.Recon,     battalionId: '92-1bat', brigadeId: '92-ombr', position: { col: 17, row: 15 } }),
        new Company({ id: '92-1bat-art', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '92-1bat', brigadeId: '92-ombr', position: { col: 14, row: 15 } }),
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
