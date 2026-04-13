export enum Side {
  Ukraine = 'ukraine',
  Russia  = 'russia',
}

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

export enum TerrainType {
  Open   = 'open',    // відкрите поле — базова швидкість
  Forest = 'forest',  // ліс — повільніше, оборонний бонус, менша видимість
  Urban  = 'urban',   // місто — повільніше, великий оборонний бонус
  Water  = 'water',   // вода — непрохідна
}

export enum EntrenchState {
  None        = 'none',        // не в окопі
  Entrenching = 'entrenching', // копає окоп (4 год)
  Entrenched  = 'entrenched',  // в окопі — ZoC=4, нерухома
  Leaving     = 'leaving',     // виходить з окопу (1 год)
}

export enum UnitStatus {
  Marching = 'marching', // на марші — є targetHex
  Holding  = 'holding',  // утримання позицій — директива Hold, нерухомий
  Idle     = 'idle',     // очікування — стоїть без конкретного наказу
  Combat   = 'combat',   // бій — контакт з противником (майбутня механіка)
}
