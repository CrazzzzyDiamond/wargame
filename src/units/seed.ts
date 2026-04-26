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

  // 25-та ОПДБр — північний фланг, прикриття
  addBrigadeWithUnits(store, new Brigade({
    id: '25-opdbr',
    name: '25-та окрема повітряно-десантна бригада',
    shortName: '25 ОПДБр',
    type: BrigadeType.DSV,
    bonus: { type: BonusType.AssaultSpeed, description: 'Швидке висування на позиції', value: 1.4 },
    hqPosition: { col: 8, row: 7 },
  }), [
    {
      battalion: new Battalion({ id: '25-1bat', name: '1-й десантно-штурмовий батальйон', type: BattalionType.Assault, brigadeId: '25-opdbr' }),
      companies: [
        new Company({ id: '25-1bat-1co', name: '1-а штурмова рота',     type: CompanyType.Assault,   battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 10, row: 6 } }),
        new Company({ id: '25-1bat-2co', name: '2-а штурмова рота',     type: CompanyType.Assault,   battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 11, row: 6 } }),
        new Company({ id: '25-1bat-rec', name: 'Розвідувальна рота',    type: CompanyType.Recon,     battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 10, row: 7 } }),
        new Company({ id: '25-1bat-uav', name: 'Рота БПЛА',             type: CompanyType.UAV,       battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 9,  row: 6 } }),
        new Company({ id: '25-1bat-tnk', name: 'Танкова рота',          type: CompanyType.Tank,      battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 9,  row: 7 } }),
        new Company({ id: '25-1bat-art', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 8,  row: 8 } }),
      ],
    },
  ])

  // 3-тя ОТБр — танковий кулак у центрі
  addBrigadeWithUnits(store, new Brigade({
    id: '3-otbr',
    name: '3-тя окрема танкова бригада',
    shortName: '3 ОТБр',
    type: BrigadeType.Ground,
    bonus: { type: BonusType.ArmorPenetration, description: 'Підвищена бронепробивність при прориві', value: 1.5 },
    hqPosition: { col: 13, row: 12 },
  }), [
    {
      battalion: new Battalion({ id: '3-1bat', name: '1-й танковий батальйон', type: BattalionType.Tank, brigadeId: '3-otbr' }),
      companies: [
        new Company({ id: '3-1bat-tnk1', name: '1-а танкова рота',      type: CompanyType.Tank,      battalionId: '3-1bat', brigadeId: '3-otbr', position: { col: 15, row: 11 } }),
        new Company({ id: '3-1bat-tnk2', name: '2-а танкова рота',      type: CompanyType.Tank,      battalionId: '3-1bat', brigadeId: '3-otbr', position: { col: 16, row: 11 } }),
        new Company({ id: '3-1bat-1co',  name: '1-а механізована рота', type: CompanyType.Assault,   battalionId: '3-1bat', brigadeId: '3-otbr', position: { col: 15, row: 12 } }),
        new Company({ id: '3-1bat-rec',  name: 'Розвідувальна рота',    type: CompanyType.Recon,     battalionId: '3-1bat', brigadeId: '3-otbr', position: { col: 14, row: 11 } }),
        new Company({ id: '3-1bat-art',  name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '3-1bat', brigadeId: '3-otbr', position: { col: 13, row: 13 } }),
      ],
    },
  ])

  // 14-та ОМБр — південно-східний напрямок, другий ешелон
  addBrigadeWithUnits(store, new Brigade({
    id: '14-ombr',
    name: '14-та окрема механізована бригада',
    shortName: '14 ОМБр',
    type: BrigadeType.Ground,
    bonus: { type: BonusType.UrbanCombat, description: 'Досвід міських боїв', value: 1.25 },
    hqPosition: { col: 19, row: 13 },
  }), [
    {
      battalion: new Battalion({ id: '14-1bat', name: '1-й механізований батальйон', type: BattalionType.Mechanized, brigadeId: '14-ombr' }),
      companies: [
        new Company({ id: '14-1bat-1co', name: '1-а механізована рота', type: CompanyType.Assault,   battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 21, row: 12 } }),
        new Company({ id: '14-1bat-2co', name: '2-а механізована рота', type: CompanyType.Line,      battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 22, row: 12 } }),
        new Company({ id: '14-1bat-tnk', name: 'Танкова рота',          type: CompanyType.Tank,      battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 21, row: 13 } }),
        new Company({ id: '14-1bat-rec', name: 'Розвідувальна рота',    type: CompanyType.Recon,     battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 20, row: 12 } }),
        new Company({ id: '14-1bat-uav', name: 'Рота БПЛА',             type: CompanyType.UAV,       battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 20, row: 13 } }),
        new Company({ id: '14-1bat-art', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 19, row: 14 } }),
      ],
    },
  ])

  // Крaken — добровольчий розвідувальний підрозділ, північний фланг
  addBrigadeWithUnits(store, new Brigade({
    id: 'kraken',
    name: 'Крaken — спеціальний підрозділ ГУР',
    shortName: 'Kraken',
    type: BrigadeType.Ground,
    bonus: { type: BonusType.AssaultSpeed, description: 'Прихований рух, подвійний радіус розвідки', value: 2.0 },
    hqPosition: { col: 16, row: 7 },
  }), [
    {
      battalion: new Battalion({ id: 'kraken-bat', name: 'Розвідувальний батальйон', type: BattalionType.Assault, brigadeId: 'kraken' }),
      companies: [
        new Company({ id: 'kraken-rec1', name: '1-а розвідрота', type: CompanyType.Recon, battalionId: 'kraken-bat', brigadeId: 'kraken', position: { col: 17, row: 7  } }),
        new Company({ id: 'kraken-rec2', name: '2-а розвідрота', type: CompanyType.Recon, battalionId: 'kraken-bat', brigadeId: 'kraken', position: { col: 18, row: 7  } }),
        new Company({ id: 'kraken-rec3', name: '3-а розвідрота', type: CompanyType.Recon, battalionId: 'kraken-bat', brigadeId: 'kraken', position: { col: 17, row: 8  } }),
        new Company({ id: 'kraken-uav',  name: 'Рота БПЛА',      type: CompanyType.UAV,   battalionId: 'kraken-bat', brigadeId: 'kraken', position: { col: 16, row: 8  } }),
      ],
    },
  ])

  // ССО — спецпідрозділ глибокого проникнення, діє попереду основних сил
  addBrigadeWithUnits(store, new Brigade({
    id: 'sso',
    name: 'Сили спеціальних операцій ЗСУ',
    shortName: 'ССО',
    type: BrigadeType.Ground,
    bonus: { type: BonusType.AssaultSpeed, description: 'Елітна підготовка: максимальна ефективність у засідках та штурмі', value: 2.0 },
    hqPosition: { col: 19, row: 9 },
  }), [
    {
      battalion: new Battalion({ id: 'sso-bat', name: 'Спеціальний батальйон', type: BattalionType.Assault, brigadeId: 'sso' }),
      companies: [
        new Company({ id: 'sso-sp1', name: '1-а група ССО', type: CompanyType.Special, battalionId: 'sso-bat', brigadeId: 'sso', position: { col: 20, row: 8  } }),
        new Company({ id: 'sso-sp2', name: '2-а група ССО', type: CompanyType.Special, battalionId: 'sso-bat', brigadeId: 'sso', position: { col: 21, row: 9  } }),
        new Company({ id: 'sso-rec', name: 'Розвідрота ССО', type: CompanyType.Recon,   battalionId: 'sso-bat', brigadeId: 'sso', position: { col: 20, row: 10 } }),
      ],
    },
  ])

  // РФ — передова лінія розвідки та прикриття (ближня дистанція)
  addBrigadeWithUnits(store, new Brigade({
    id: 'rf-screen',
    name: '11-й армійський корпус РФ — передова',
    shortName: 'РФ Прикриття',
    type: BrigadeType.Ground,
    side: Side.Russia,
    bonus: { type: BonusType.DefenseBonus, description: 'Передова розвідка', value: 1.0 },
    hqPosition: { col: 28, row: 11 },
  }), [
    {
      battalion: new Battalion({ id: 'rf-sc-bat', name: 'Передовий батальйон', type: BattalionType.Mechanized, brigadeId: 'rf-screen' }),
      companies: [
        new Company({ id: 'rf-sc-rec1', name: 'Розвідрота (пн)',   type: CompanyType.Recon, battalionId: 'rf-sc-bat', brigadeId: 'rf-screen', side: Side.Russia, position: { col: 27, row: 8  } }),
        new Company({ id: 'rf-sc-rec2', name: 'Розвідрота (цнт)',  type: CompanyType.Recon, battalionId: 'rf-sc-bat', brigadeId: 'rf-screen', side: Side.Russia, position: { col: 28, row: 11 } }),
        new Company({ id: 'rf-sc-rec3', name: 'Розвідрота (пд)',   type: CompanyType.Recon, battalionId: 'rf-sc-bat', brigadeId: 'rf-screen', side: Side.Russia, position: { col: 27, row: 14 } }),
        new Company({ id: 'rf-sc-ln1',  name: '1-а лінійна рота',  type: CompanyType.Line,  battalionId: 'rf-sc-bat', brigadeId: 'rf-screen', side: Side.Russia, position: { col: 28, row: 9  } }),
        new Company({ id: 'rf-sc-ln2',  name: '2-а лінійна рота',  type: CompanyType.Line,  battalionId: 'rf-sc-bat', brigadeId: 'rf-screen', side: Side.Russia, position: { col: 29, row: 12 } }),
        new Company({ id: 'rf-sc-ln3',  name: '3-а лінійна рота',  type: CompanyType.Line,  battalionId: 'rf-sc-bat', brigadeId: 'rf-screen', side: Side.Russia, position: { col: 29, row: 10 } }),
      ],
    },
  ])

  // РФ — основна лінія оборони (другий ешелон)
  addBrigadeWithUnits(store, new Brigade({
    id: 'rf-defense',
    name: '20-та загальновійськова армія РФ — оборона',
    shortName: '20 ЗВА РФ',
    type: BrigadeType.Ground,
    side: Side.Russia,
    bonus: { type: BonusType.DefenseBonus, description: 'Підготовлена оборона', value: 1.2 },
    hqPosition: { col: 34, row: 11 },
  }), [
    {
      battalion: new Battalion({ id: 'rf-df-bat1', name: '1-й оборонний батальйон', type: BattalionType.Mechanized, brigadeId: 'rf-defense' }),
      companies: [
        new Company({ id: 'rf-df-ln1',  name: '1-а лінійна рота',      type: CompanyType.Line,      battalionId: 'rf-df-bat1', brigadeId: 'rf-defense', side: Side.Russia, position: { col: 32, row: 8  } }),
        new Company({ id: 'rf-df-ln2',  name: '2-а лінійна рота',      type: CompanyType.Line,      battalionId: 'rf-df-bat1', brigadeId: 'rf-defense', side: Side.Russia, position: { col: 33, row: 10 } }),
        new Company({ id: 'rf-df-ln3',  name: '3-а лінійна рота',      type: CompanyType.Line,      battalionId: 'rf-df-bat1', brigadeId: 'rf-defense', side: Side.Russia, position: { col: 32, row: 12 } }),
        new Company({ id: 'rf-df-ln4',  name: '4-а лінійна рота',      type: CompanyType.Line,      battalionId: 'rf-df-bat1', brigadeId: 'rf-defense', side: Side.Russia, position: { col: 33, row: 14 } }),
        new Company({ id: 'rf-df-tnk1', name: '1-а танкова рота',      type: CompanyType.Tank,      battalionId: 'rf-df-bat1', brigadeId: 'rf-defense', side: Side.Russia, position: { col: 34, row: 9  } }),
        new Company({ id: 'rf-df-tnk2', name: '2-а танкова рота',      type: CompanyType.Tank,      battalionId: 'rf-df-bat1', brigadeId: 'rf-defense', side: Side.Russia, position: { col: 34, row: 12 } }),
        new Company({ id: 'rf-df-art1', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: 'rf-df-bat1', brigadeId: 'rf-defense', side: Side.Russia, position: { col: 36, row: 9  } }),
        new Company({ id: 'rf-df-art2', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: 'rf-df-bat1', brigadeId: 'rf-defense', side: Side.Russia, position: { col: 36, row: 12 } }),
      ],
    },
  ])
}
