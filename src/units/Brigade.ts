import { BrigadeType, BonusType } from './types'
import type { BrigadeBonus, BrigadeWeakness } from './types'

export class Brigade {
  readonly id: string
  readonly name: string
  readonly shortName: string
  readonly type: BrigadeType
  readonly bonus: BrigadeBonus
  readonly weakness?: BrigadeWeakness

  constructor(params: {
    id: string
    name: string
    shortName: string
    type: BrigadeType
    bonus: BrigadeBonus
    weakness?: BrigadeWeakness
  }) {
    this.id = params.id
    this.name = params.name
    this.shortName = params.shortName
    this.type = params.type
    this.bonus = params.bonus
    this.weakness = params.weakness
  }
}

// Бригади ЗСУ — Харківський контрнаступ, вересень 2022
export const UA_BRIGADES: Brigade[] = [
  // ДШВ
  new Brigade({
    id: '80-odshbr',
    name: '80-та окрема десантно-штурмова бригада',
    shortName: '80 ОДШБр',
    type: BrigadeType.DSV,
    bonus: {
      type: BonusType.AssaultSpeed,
      description: 'Прорив без штрафу до швидкості при штурмі укріплених позицій',
      value: 1.5,
    },
  }),
  new Brigade({
    id: '25-opdbr',
    name: '25-та окрема повітрянодесантна бригада',
    shortName: '25 ОПДБр',
    type: BrigadeType.DSV,
    bonus: {
      type: BonusType.AssaultSpeed,
      description: 'Підвищена мобільність при охопленні флангів',
      value: 1.3,
    },
  }),
  new Brigade({
    id: '95-odshbr',
    name: '95-та окрема десантно-штурмова бригада',
    shortName: '95 ОДШБр',
    type: BrigadeType.DSV,
    bonus: {
      type: BonusType.AssaultSpeed,
      description: 'Прискорене переміщення по пересіченій місцевості',
      value: 1.3,
    },
  }),

  // Сухопутні
  new Brigade({
    id: '92-ombr',
    name: '92-га окрема механізована бригада',
    shortName: '92 ОМБр',
    type: BrigadeType.Ground,
    bonus: {
      type: BonusType.UrbanCombat,
      description: 'Бонус до бойової ефективності у міській забудові',
      value: 1.4,
    },
  }),
  new Brigade({
    id: '14-ombr',
    name: '14-та окрема механізована бригада',
    shortName: '14 ОМБр',
    type: BrigadeType.Ground,
    bonus: {
      type: BonusType.DefenseBonus,
      description: 'Посилене утримання позицій під контратакою',
      value: 1.3,
    },
  }),
  new Brigade({
    id: '3-otbr',
    name: '3-тя окрема танкова бригада',
    shortName: '3 ОТБр',
    type: BrigadeType.Ground,
    bonus: {
      type: BonusType.ArmorPenetration,
      description: 'Перевага проти бронетехніки і укріплень на відкритій місцевості',
      value: 1.5,
    },
  }),

  // Спецура
  new Brigade({
    id: '0-kraken',
    name: 'Полк Кракен (ГУР)',
    shortName: 'Кракен',
    type: BrigadeType.Special,
    bonus: {
      type: BonusType.ReconRange,
      description: 'Подвоєний радіус розвідки, знімає туман війни на більшій відстані',
      value: 2.0,
    },
  }),
  new Brigade({
    id: '0-sso',
    name: 'Сили спеціальних операцій',
    shortName: 'ССО',
    type: BrigadeType.Special,
    bonus: {
      type: BonusType.Stealth,
      description: 'Підрозділи невидимі для противника поза зоною прямого контакту',
      value: 1.0,
    },
  }),

  // ТРО
  new Brigade({
    id: '113-tro',
    name: '113-та бригада територіальної оборони',
    shortName: '113 ТрО',
    type: BrigadeType.TRO,
    bonus: {
      type: BonusType.DefenseBonus,
      description: 'Підвищена стійкість в обороні — ворогу важче вибити з утримуваного гексу',
      value: 1.4,
    },
    weakness: {
      description: 'Низька швидкість переміщення і слабка ударна сила в наступі',
    },
  }),
  new Brigade({
    id: '127-tro',
    name: '127-ма бригада територіальної оборони',
    shortName: '127 ТрО',
    type: BrigadeType.TRO,
    bonus: {
      type: BonusType.DefenseBonus,
      description: 'Підвищена стійкість в обороні — ворогу важче вибити з утримуваного гексу',
      value: 1.4,
    },
    weakness: {
      description: 'Низька швидкість переміщення і слабка ударна сила в наступі',
    },
  }),
]
