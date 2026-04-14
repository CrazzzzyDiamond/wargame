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
    hqPosition: { col: 7, row: 11 },  // КП позаду рот
  }), [
    {
      battalion: new Battalion({ id: '80-1bat', name: '1-й штурмовий батальйон', type: BattalionType.Assault, brigadeId: '80-odshbr' }),
      companies: [
        new Company({ id: '80-1bat-1co', name: '1-а штурмова рота',  type: CompanyType.Assault, battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 9,  row: 11 } }),
        new Company({ id: '80-1bat-2co', name: '2-а штурмова рота',  type: CompanyType.Assault, battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 10, row: 11 } }),
        new Company({ id: '80-1bat-rec', name: 'Розвідувальна рота', type: CompanyType.Recon,   battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 9,  row: 12 } }),
        new Company({ id: '80-1bat-uav', name: 'Рота БПЛА',          type: CompanyType.UAV,     battalionId: '80-1bat', brigadeId: '80-odshbr', position: { col: 8,  row: 11 } }),
      ],
    },
    {
      battalion: new Battalion({ id: '80-2bat', name: '2-й танковий батальйон', type: BattalionType.Tank, brigadeId: '80-odshbr' }),
      companies: [
        new Company({ id: '80-2bat-tnk', name: 'Танкова рота',        type: CompanyType.Tank,      battalionId: '80-2bat', brigadeId: '80-odshbr', position: { col: 7,  row: 10 } }),
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
    hqPosition: { col: 10, row: 13 },
  }), [
    {
      battalion: new Battalion({ id: '95-1bat', name: '1-й штурмовий батальйон', type: BattalionType.Assault, brigadeId: '95-odshbr' }),
      companies: [
        new Company({ id: '95-1bat-1co',  name: '1-а штурмова рота', type: CompanyType.Assault, battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 12, row: 13 } }),
        new Company({ id: '95-1bat-2co',  name: '2-а штурмова рота', type: CompanyType.Assault, battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 13, row: 13 } }),
        new Company({ id: '95-1bat-spec', name: 'Спецпідрозділ',     type: CompanyType.Special,  battalionId: '95-1bat', brigadeId: '95-odshbr', position: { col: 12, row: 14 } }),
      ],
    },
    {
      battalion: new Battalion({ id: '95-2bat', name: '2-й танковий батальйон', type: BattalionType.Tank, brigadeId: '95-odshbr' }),
      companies: [
        new Company({ id: '95-2bat-tnk', name: 'Танкова рота',         type: CompanyType.Tank,      battalionId: '95-2bat', brigadeId: '95-odshbr', position: { col: 11, row: 13 } }),
        new Company({ id: '95-2bat-art', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '95-2bat', brigadeId: '95-odshbr', position: { col: 11, row: 14 } }),
      ],
    },
  ])

  // 25-та ОПДБр — східний напрямок, Куп'янськ
  addBrigadeWithUnits(store, new Brigade({
    id: '25-opdbr',
    name: '25-та окрема повітрянодесантна бригада',
    shortName: '25 ОПДБр',
    type: BrigadeType.DSV,
    bonus: { type: BonusType.AssaultSpeed, description: 'Підвищена мобільність при охопленні флангів', value: 1.3 },
    hqPosition: { col: 16, row: 15 },
  }), [
    {
      battalion: new Battalion({ id: '25-1bat', name: '1-й десантний батальйон', type: BattalionType.Airborne, brigadeId: '25-opdbr' }),
      companies: [
        new Company({ id: '25-1bat-1co', name: '1-а десантна рота',  type: CompanyType.Assault, battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 18, row: 15 } }),
        new Company({ id: '25-1bat-2co', name: '2-а десантна рота',  type: CompanyType.Line,    battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 19, row: 15 } }),
        new Company({ id: '25-1bat-rec', name: 'Розвідувальна рота', type: CompanyType.Recon,   battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 18, row: 16 } }),
        new Company({ id: '25-1bat-uav', name: 'Рота БПЛА',          type: CompanyType.UAV,     battalionId: '25-1bat', brigadeId: '25-opdbr', position: { col: 17, row: 15 } }),
      ],
    },
    {
      battalion: new Battalion({ id: '25-2bat', name: '2-й механізований батальйон', type: BattalionType.Mechanized, brigadeId: '25-opdbr' }),
      companies: [
        new Company({ id: '25-2bat-tnk', name: 'Танкова рота',         type: CompanyType.Tank,      battalionId: '25-2bat', brigadeId: '25-opdbr', position: { col: 17, row: 16 } }),
        new Company({ id: '25-2bat-art', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '25-2bat', brigadeId: '25-opdbr', position: { col: 16, row: 16 } }),
      ],
    },
  ])

  // 92-га ОМБр — звільнення Куп'янська, 10 вересня
  addBrigadeWithUnits(store, new Brigade({
    id: '92-ombr',
    name: '92-га окрема механізована бригада',
    shortName: '92 ОМБр',
    type: BrigadeType.Ground,
    bonus: { type: BonusType.UrbanCombat, description: 'Бонус у міській забудові', value: 1.3 },
    hqPosition: { col: 20, row: 11 },
  }), [
    {
      battalion: new Battalion({ id: '92-1bat', name: '1-й механізований батальйон', type: BattalionType.Mechanized, brigadeId: '92-ombr' }),
      companies: [
        new Company({ id: '92-1bat-1co', name: '1-а механізована рота', type: CompanyType.Assault, battalionId: '92-1bat', brigadeId: '92-ombr', position: { col: 22, row: 11 } }),
        new Company({ id: '92-1bat-2co', name: '2-а механізована рота', type: CompanyType.Line,    battalionId: '92-1bat', brigadeId: '92-ombr', position: { col: 23, row: 11 } }),
        new Company({ id: '92-1bat-tnk', name: 'Танкова рота',          type: CompanyType.Tank,    battalionId: '92-1bat', brigadeId: '92-ombr', position: { col: 21, row: 11 } }),
      ],
    },
  ])

  // 14-та ОМБр — центральний напрямок
  addBrigadeWithUnits(store, new Brigade({
    id: '14-ombr',
    name: '14-та окрема механізована бригада',
    shortName: '14 ОМБр',
    type: BrigadeType.Ground,
    bonus: { type: BonusType.ArmorPenetration, description: 'Підвищена бронепробивність', value: 1.2 },
    hqPosition: { col: 14, row: 12 },
  }), [
    {
      battalion: new Battalion({ id: '14-1bat', name: '1-й механізований батальйон', type: BattalionType.Mechanized, brigadeId: '14-ombr' }),
      companies: [
        new Company({ id: '14-1bat-1co', name: '1-а механізована рота', type: CompanyType.Assault, battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 16, row: 12 } }),
        new Company({ id: '14-1bat-2co', name: '2-а механізована рота', type: CompanyType.Line,    battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 17, row: 12 } }),
        new Company({ id: '14-1bat-art', name: 'Артилерійська батарея', type: CompanyType.Artillery, battalionId: '14-1bat', brigadeId: '14-ombr', position: { col: 14, row: 13 } }),
      ],
    },
  ])

  // 3-тя ОТБр — танковий кулак
  addBrigadeWithUnits(store, new Brigade({
    id: '3-otbr',
    name: '3-тя окрема танкова бригада',
    shortName: '3 ОТБр',
    type: BrigadeType.Ground,
    bonus: { type: BonusType.ArmorPenetration, description: 'Важка броня — прорив укріплень', value: 1.4 },
    hqPosition: { col: 13, row: 10 },
  }), [
    {
      battalion: new Battalion({ id: '3-1bat', name: '1-й танковий батальйон', type: BattalionType.Tank, brigadeId: '3-otbr' }),
      companies: [
        new Company({ id: '3-1bat-tnk1', name: '1-а танкова рота', type: CompanyType.Tank,    battalionId: '3-1bat', brigadeId: '3-otbr', position: { col: 15, row: 10 } }),
        new Company({ id: '3-1bat-tnk2', name: '2-а танкова рота', type: CompanyType.Tank,    battalionId: '3-1bat', brigadeId: '3-otbr', position: { col: 16, row: 10 } }),
        new Company({ id: '3-1bat-mech', name: 'Мотопіхотна рота', type: CompanyType.Assault, battalionId: '3-1bat', brigadeId: '3-otbr', position: { col: 15, row: 11 } }),
      ],
    },
  ])

  // Кракен — ГУР, спецоперації в Харкові і передмісті
  addBrigadeWithUnits(store, new Brigade({
    id: 'kraken',
    name: 'Кракен (підрозділ ГУР МО України)',
    shortName: 'Кракен',
    type: BrigadeType.Special,
    bonus: { type: BonusType.Stealth, description: 'Невидимість — рейди в тилу противника', value: 1.0 },
    hqPosition: { col: 7, row: 7 },
  }), [
    {
      battalion: new Battalion({ id: 'kraken-1bat', name: 'Штурмовий загін', type: BattalionType.Special, brigadeId: 'kraken' }),
      companies: [
        new Company({ id: 'kraken-spec1', name: 'Група "Кракен" А', type: CompanyType.Special, battalionId: 'kraken-1bat', brigadeId: 'kraken', position: { col: 8, row: 7 } }),
        new Company({ id: 'kraken-spec2', name: 'Група "Кракен" Б', type: CompanyType.Recon,   battalionId: 'kraken-1bat', brigadeId: 'kraken', position: { col: 9, row: 8 } }),
      ],
    },
  ])

  // ССО — Сили спеціальних операцій
  addBrigadeWithUnits(store, new Brigade({
    id: 'sso',
    name: 'Сили спеціальних операцій ЗСУ',
    shortName: 'ССО',
    type: BrigadeType.Special,
    bonus: { type: BonusType.ReconRange, description: 'Розширений радіус розвідки і наведення', value: 1.5 },
    hqPosition: { col: 8, row: 14 },
  }), [
    {
      battalion: new Battalion({ id: 'sso-1bat', name: '1-й загін ССО', type: BattalionType.Special, brigadeId: 'sso' }),
      companies: [
        new Company({ id: 'sso-spec1', name: 'Загін ССО "Альфа"', type: CompanyType.Special, battalionId: 'sso-1bat', brigadeId: 'sso', position: { col: 9,  row: 14 } }),
        new Company({ id: 'sso-uav',   name: 'Рота БПЛА ССО',     type: CompanyType.UAV,     battalionId: 'sso-1bat', brigadeId: 'sso', position: { col: 10, row: 14 } }),
      ],
    },
  ])

  // 113-та бригада ТРО — утримання флангів і тилових рубежів
  addBrigadeWithUnits(store, new Brigade({
    id: '113-tro',
    name: '113-та бригада територіальної оборони',
    shortName: '113 ТРО',
    type: BrigadeType.TRO,
    bonus: { type: BonusType.DefenseBonus, description: 'Стійка оборона на укріплених позиціях', value: 1.2 },
    hqPosition: { col: 9, row: 16 },
  }), [
    {
      battalion: new Battalion({ id: '113-1bat', name: '1-й батальйон ТРО', type: BattalionType.TRO, brigadeId: '113-tro' }),
      companies: [
        new Company({ id: '113-1bat-1co', name: '1-а рота ТРО', type: CompanyType.Line, battalionId: '113-1bat', brigadeId: '113-tro', position: { col: 10, row: 16 } }),
        new Company({ id: '113-1bat-2co', name: '2-а рота ТРО', type: CompanyType.Line, battalionId: '113-1bat', brigadeId: '113-tro', position: { col: 11, row: 16 } }),
      ],
    },
  ])

  // 127-ма бригада ТРО — південний фланг
  addBrigadeWithUnits(store, new Brigade({
    id: '127-tro',
    name: '127-ма бригада територіальної оборони',
    shortName: '127 ТРО',
    type: BrigadeType.TRO,
    bonus: { type: BonusType.DefenseBonus, description: 'Стійка оборона і утримання позицій', value: 1.1 },
    hqPosition: { col: 13, row: 18 },
  }), [
    {
      battalion: new Battalion({ id: '127-1bat', name: '1-й батальйон ТРО', type: BattalionType.TRO, brigadeId: '127-tro' }),
      companies: [
        new Company({ id: '127-1bat-1co', name: '1-а рота ТРО', type: CompanyType.Line, battalionId: '127-1bat', brigadeId: '127-tro', position: { col: 14, row: 18 } }),
        new Company({ id: '127-1bat-2co', name: '2-а рота ТРО', type: CompanyType.Line, battalionId: '127-1bat', brigadeId: '127-tro', position: { col: 15, row: 18 } }),
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
    new Company({ id: 'rf-1bat-1co', name: '1-а лінійна рота',  type: CompanyType.Line, battalionId: 'rf-1bat', brigadeId: 'rf-20-army', side: Side.Russia, position: { col: 26, row: 8  } }),
    new Company({ id: 'rf-1bat-2co', name: '2-а лінійна рота',  type: CompanyType.Line, battalionId: 'rf-1bat', brigadeId: 'rf-20-army', side: Side.Russia, position: { col: 28, row: 10 } }),
    new Company({ id: 'rf-1bat-tnk', name: 'Танкова рота',      type: CompanyType.Tank, battalionId: 'rf-1bat', brigadeId: 'rf-20-army', side: Side.Russia, position: { col: 27, row: 9  } }),
  ]
  rfCompanies.forEach(c => rfBat.addCompany(c.id))
  store.addBrigade(rfBrigade)
  store.addBattalion(rfBat)
  rfCompanies.forEach(c => store.addCompany(c))
}
