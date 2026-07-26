export const W = 1200;
export const H = 800;
export const HIT_RANGE = 20;
export const PICKUP_RANGE = 28;
export const MELEE_RANGE = 60;
export const MAX_WEAPONS = 2;

export type EnemyType = "normal" | "fast" | "tank" | "ranged" | "charger" | "exploder" | "healer" | "invisible";

export interface PowerConfig {
  id: string;
  name: string;
  desc: string;
  cooldown: number;
  maxLevel: number;
  baseDamage: number;
  baseDuration: number;
  cost: number;
}

export interface Power {
  id: string;
  name: string;
  desc: string;
  cooldown: number;
  level: number;
  maxLevel: number;
  baseDamage: number;
  baseDuration: number;
}

export const MAX_POWERS = 2;

export interface PlayerStats {
  speed: number;
  maxHp: number;
  hp: number;
  armor: number;
  materials: number;
  level: number;
  xp: number;
  xpToNext: number;
  critChance: number;
  dodge: number;
  hpRegen: boolean;
  pickupRangeBonus: number;
  xpMult?: number;
}

export interface Weapon {
  id: string;
  name: string;
  damage: number;
  fireRate: number;
  bulletCount: number;
  spread: number;
  bulletSpeed: number;
  range: number;
  cost: number;
  weaponType: "ranged" | "melee";
  splashRadius?: number;
  penetrate?: number;
  level: number;
  lastFired: number;
}

export type WeaponConfig = Omit<Weapon, "lastFired" | "level">;

export interface Character {
  id: string;
  name: string;
  hpMult: number;
  speedMult: number;
  startWeapons: string[];
  desc: string;
  passive: (stats: PlayerStats, weapons: Weapon[]) => void;
  abilityName: string;
  abilityDesc: string;
  abilityCooldown: number;
  abilityDuration: number;
}

export interface SpawnGroup {
  type: EnemyType;
  count: number;
  elite?: boolean;
  boss?: boolean;
  dropMult?: number;
}

export interface SpawnRule {
  type: EnemyType;
  batchSize: number;
  interval: number;
  timer: number;
  remaining: number;
  elite?: boolean;
  boss?: boolean;
  dropMult?: number;
}

export interface ShopItem {
  id: string;
  name: string;
  desc: string;
  cost: number;
  type: "stat" | "weapon" | "item" | "consumable" | "power";
  weapon?: Weapon;
  powerCfg?: PowerConfig;
  rarity?: Rarity;
  rarityColor?: string;
  apply?: (p: PlayerStats, weapons: Weapon[]) => void;
}

export interface Rarity {
  name: string;
  statMult: number;
  costMult: number;
  color: string;
}

export interface WaveConfig {
  enemies: { type: EnemyType; count: number }[];
  speedMult: number;
  hpMult: number;
  eliteChance?: number;
}

export interface BodyPartUpgrade {
  id: string;
  part: "head" | "chest" | "legs" | "weapon";
  name: string;
  desc: string;
  tier: number;
  apply: (stats: PlayerStats, weapons: Weapon[]) => void;
}

export interface DropItem {
  sprite: Phaser.GameObjects.Image;
  value: number;
}

export interface EvolutionRecipe {
  weaponId: string;
  itemId: string;
  resultName: string;
  result: WeaponConfig;
}
