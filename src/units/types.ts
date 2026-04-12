export enum BrigadeType {
  DSV     = 'dsv',
  Ground  = 'ground',
  Special = 'special',
  TRO     = 'tro',
}

export enum BonusType {
  AssaultSpeed      = 'assault_speed',      // +швидкість прориву
  UrbanCombat       = 'urban_combat',       // +бонус у міській забудові
  ArmorPenetration  = 'armor_penetration',  // +бронепробивність
  ReconRange        = 'recon_range',        // +радіус розвідки
  Stealth           = 'stealth',            // невидимість у тумані
  DefenseBonus      = 'defense_bonus',      // +оборонний бонус
}

export interface BrigadeBonus {
  type: BonusType
  description: string
  value: number  // множник або фіксоване значення залежно від типу
}

export interface BrigadeWeakness {
  description: string
}

export enum BattalionType {
  Assault       = 'assault',        // штурмовий (ДШВ)
  Airborne      = 'airborne',       // повітрянодесантний
  Mechanized    = 'mechanized',     // мотопіхотний (БМП/БТР)
  Tank          = 'tank',           // танковий
  Recon         = 'recon',          // розвідувальний
  Special       = 'special',        // спеціального призначення
  TRO           = 'tro',            // територіальна оборона
}

export enum CompanyType {
  Assault   = 'assault',     // штурмова — прорив укріплень, висока ударна сила
  Recon     = 'recon',       // розвідувальна — знімає туман війни, наземна
  Line      = 'line',        // лінійна — утримання позицій, менш ефективна в атаці
  UAV       = 'uav',         // БПЛА — широкий радіус розвідки, не веде бій
  Special   = 'special',     // спецпідрозділ — невидимий, диверсії, розвідка
  Tank      = 'tank',        // танкова — висока бронепробивність, вразлива в місті
  Artillery = 'artillery',   // артилерійська — вогнева підтримка з відстані
}

export enum Readiness {
  Ready     = 'ready',       // повна боєздатність
  Strained  = 'strained',    // знижена ефективність
  Exhausted = 'exhausted',   // критичний стан, потребує відводу
}

export enum Directive {
  Advance  = 'advance',   // наступ — +атака, readiness витрачається швидше
  Hold     = 'hold',      // утримувати — +оборона, заборона руху
  Rest     = 'rest',      // відпочинок — відновлення readiness і morale
}

export enum Morale {
  High    = 'high',    // бойовий — бонус до атаки
  Steady  = 'steady',  // стійкий — без змін
  Shaken  = 'shaken',  // похитнувся — штраф до атаки і оборони
  Panic   = 'panic',   // паніка — відступає без наказу
}
