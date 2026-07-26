import { PlayerStats, Weapon, WeaponConfig, Rarity, ShopItem, BodyPartUpgrade, WaveConfig, EnemyType, PowerConfig, Character } from "./types";

export const PART_NAMES: Record<string, string> = { head: "头部", chest: "胸部", legs: "腿部", weapon: "武器" };
export const PART_COLORS: Record<string, string> = { head: "#f80", chest: "#f44", legs: "#4f8", weapon: "#8cf" };

export const RARITIES: Rarity[] = [
  { name: "普通", statMult: 1, costMult: 1, color: "#aaaaaa" },
  { name: "稀有", statMult: 1.12, costMult: 1.5, color: "#4488ff" },
  { name: "史诗", statMult: 1.25, costMult: 2, color: "#aa44ff" },
  { name: "传说", statMult: 1.4, costMult: 3, color: "#ffaa00" },
];

export const WEAPON_CONFIGS: WeaponConfig[] = [
  { id: "pistol", name: "手枪", damage: 10, fireRate: 400, bulletCount: 1, spread: 0, bulletSpeed: 400, range: 400, weaponType: "ranged", cost: 0 },
  { id: "smg", name: "冲锋枪", damage: 6, fireRate: 150, bulletCount: 1, spread: 8, bulletSpeed: 380, range: 350, weaponType: "ranged", cost: 30 },
  { id: "shotgun", name: "霰弹枪", damage: 12, fireRate: 700, bulletCount: 3, spread: 15, bulletSpeed: 350, range: 300, weaponType: "ranged", cost: 30 },
  { id: "sniper", name: "狙击枪", damage: 50, fireRate: 1000, bulletCount: 1, spread: 0, bulletSpeed: 700, range: 500, weaponType: "ranged", cost: 30 },
  { id: "rifle", name: "步枪", damage: 18, fireRate: 500, bulletCount: 1, spread: 3, bulletSpeed: 450, range: 600, weaponType: "ranged", cost: 20 },
  { id: "rocket", name: "火箭筒", damage: 80, fireRate: 1500, bulletCount: 1, spread: 0, bulletSpeed: 350, range: 400, weaponType: "ranged", cost: 35, splashRadius: 80 },
  { id: "fireaxe", name: "消防斧", damage: 25, fireRate: 900, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 120, weaponType: "melee", cost: 15 },
  { id: "crowbar", name: "撬棍", damage: 16, fireRate: 600, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 60, weaponType: "melee", cost: 12 },
  { id: "machete", name: "砍刀", damage: 12, fireRate: 400, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 55, weaponType: "melee", cost: 10 },
  { id: "laser", name: "激光枪", damage: 3, fireRate: 50, bulletCount: 1, spread: 0, bulletSpeed: 600, range: 350, weaponType: "ranged", cost: 35, penetrate: 3 },
  { id: "freeze", name: "冰冻枪", damage: 8, fireRate: 400, bulletCount: 1, spread: 4, bulletSpeed: 350, range: 250, weaponType: "ranged", cost: 30 },
];

export const ITEMS: ShopItem[] = [
  { id: "coffee", name: "咖啡", desc: "射速+10%  攻击+5%", cost: 15, type: "item", apply: (s, w) => { w.forEach(we => we.fireRate = Math.round(we.fireRate * 0.9)); s.attackBonus += 0.05; } },
  { id: "medkit", name: "医疗包", desc: "回复40HP  最大HP-10", cost: 12, type: "item", apply: (s) => { s.maxHp = Math.max(20, s.maxHp - 10); s.hp = Math.min(s.maxHp, s.hp + 40); } },
  { id: "shoes", name: "跑鞋", desc: "移速+20  护甲-1", cost: 10, type: "item", apply: (s) => { s.speed += 20; s.armor = Math.max(0, s.armor - 1); } },
  { id: "shield", name: "铁盾", desc: "护甲+2  移速-10", cost: 18, type: "item", apply: (s) => { s.armor += 2; s.speed = Math.max(20, s.speed - 10); } },
  { id: "clover", name: "幸运草", desc: "经验+15%  攻击+5%", cost: 14, type: "item", apply: (s, w) => { s.xpMult = 1.15; s.attackBonus += 0.05; } },
  { id: "foldingStock", name: "折叠枪托", desc: "移速+15  射速-5%", cost: 10, type: "item", apply: (s, w) => { s.speed += 15; w.forEach(we => we.fireRate = Math.round(we.fireRate * 1.05)); } },
  { id: "coolant", name: "冷却液", desc: "冰冻射速+20%", cost: 14, type: "item", apply: (s, w) => { w.forEach(we => { if (we.id === "freeze" || we.id === "evolved_freeze") we.fireRate = Math.round(we.fireRate * 0.8); }); } },
];

export interface DifficultyTier {
  id: number;
  name: string;
  hpMult: number;
  speedMult: number;
  dmgMult: number;
}

export const DIFFICULTY_TIERS: DifficultyTier[] = [
  { id: 0, name: "危险0", hpMult: 0.8, speedMult: 0.8, dmgMult: 0.8 },
  { id: 1, name: "危险1", hpMult: 1.0, speedMult: 1.0, dmgMult: 1.0 },
  { id: 2, name: "危险2", hpMult: 1.2, speedMult: 1.15, dmgMult: 1.15 },
  { id: 3, name: "危险3", hpMult: 1.5, speedMult: 1.3, dmgMult: 1.3 },
  { id: 4, name: "危险4", hpMult: 1.8, speedMult: 1.5, dmgMult: 1.5 },
  { id: 5, name: "危险5", hpMult: 2.2, speedMult: 1.7, dmgMult: 1.7 },
];

export const CONSUMABLES: ShopItem[] = [
  { id: "hpSmall", name: "医疗包(小)", desc: "回复 30HP", cost: 10, type: "consumable", apply: (s) => { s.hp = Math.min(s.maxHp, s.hp + 30); } },
  { id: "adrenaline", name: "肾上腺素", desc: "15s 内移速+20% 射速+20%", cost: 15, type: "consumable" },
  { id: "grenade", name: "手雷", desc: "获得 3 枚手雷", cost: 8, type: "consumable" },
];

export const POWER_CONFIGS: PowerConfig[] = [
  { id: "telekineticWave", name: "念力波", desc: "推开周围敌人并造成伤害", cooldown: 10000, maxLevel: 5, baseDamage: 30, baseDuration: 0, cost: 20 },
  { id: "zombieControl", name: "丧尸控制", desc: "转化一个敌人为你作战", cooldown: 15000, maxLevel: 3, baseDamage: 0, baseDuration: 10000, cost: 25 },
  { id: "psychicStorm", name: "精神风暴", desc: "周身持续伤害", cooldown: 12000, maxLevel: 5, baseDamage: 15, baseDuration: 5000, cost: 20 },
  { id: "precognition", name: "预知", desc: "闪避所有攻击", cooldown: 14000, maxLevel: 3, baseDamage: 0, baseDuration: 3000, cost: 18 },
  { id: "gravityField", name: "重力场", desc: "拉拽敌人并造成伤害", cooldown: 10000, maxLevel: 5, baseDamage: 50, baseDuration: 0, cost: 22 },
  { id: "lifeDrain", name: "生命汲取", desc: "吸取敌人生命并回复", cooldown: 12000, maxLevel: 5, baseDamage: 10, baseDuration: 5000, cost: 22 },
];



export const BASE_STATS: PlayerStats = {
  speed: 200, maxHp: 100, hp: 100, armor: 0, materials: 0, level: 1, xp: 0, xpToNext: 15,
  critChance: 0, dodge: 0, hpRegen: false, pickupRangeBonus: 0, attackBonus: 0,
  damageReduction: 0, criticalDamageBonus: 0, healPerWave: 0, berserkDamageBonus: 0,
};

export const XP_PER_KILL: Record<EnemyType, number> = {
  normal: 1, fast: 1, tank: 3, ranged: 2, charger: 1, exploder: 2, healer: 1, invisible: 1,
};

export const BODY_UPGRADES: BodyPartUpgrade[] = [
  { id: "spreadDec", part: "head", name: "精准射击", desc: "散射 -10%", tier: 1, apply: (s, w) => w.forEach(we => we.spread = Math.round(we.spread * 0.9)) },
  { id: "bulletSpeedInc", part: "head", name: "快速瞄准", desc: "弹速 +8%", tier: 1, apply: (s, w) => w.forEach(we => we.bulletSpeed = Math.round(we.bulletSpeed * 1.08)) },
  { id: "rangeInc", part: "head", name: "鹰眼", desc: "射程 +20", tier: 2, apply: (s, w) => w.forEach(we => we.range += 20) },
  { id: "critChance", part: "head", name: "致命一击", desc: "暴击率 +5%", tier: 3, apply: (s) => { s.critChance += 0.05; } },
  { id: "hpSmall", part: "chest", name: "生命强化", desc: "HP +25", tier: 1, apply: (s) => { s.maxHp += 25; s.hp += 25; } },
  { id: "armorSmall", part: "chest", name: "铁壁", desc: "护甲 +1", tier: 1, apply: (s) => { s.armor += 1; } },
  { id: "hpLarge", part: "chest", name: "坚韧", desc: "HP +50", tier: 2, apply: (s) => { s.maxHp += 50; s.hp += 50; } },
  { id: "hpRegen", part: "chest", name: "再生", desc: "每秒回复 3HP", tier: 3, apply: (s) => { s.hpRegen = true; } },
  { id: "speedInc", part: "legs", name: "疾跑", desc: "移速 +10", tier: 1, apply: (s) => { s.speed += 10; } },
  { id: "pickupRange", part: "legs", name: "长臂", desc: "拾取范围 +15", tier: 1, apply: (s) => { s.pickupRangeBonus += 15; } },
  { id: "dodgeSmall", part: "legs", name: "灵巧", desc: "闪避 +3%", tier: 2, apply: (s) => { s.dodge += 0.03; } },
  { id: "dodgeLarge", part: "legs", name: "残影", desc: "闪避 +5%", tier: 3, apply: (s) => { s.dodge += 0.05; } },
  { id: "dmgSmall", part: "weapon", name: "利刃", desc: "攻击 +8%", tier: 1, apply: (s) => { s.attackBonus += 0.08; } },
  { id: "fireRateSmall", part: "weapon", name: "连射", desc: "射速 +40ms", tier: 1, apply: (s, w) => w.forEach(we => we.fireRate = Math.max(50, we.fireRate - 40)) },
];

export const ENEMY_CONFIG = {
  normal: { tint: 0xff4444, scale: 0.8, dropMult: 1 },
  fast: { tint: 0xffff44, scale: 0.6, dropMult: 1 },
  tank: { tint: 0xaa44ff, scale: 1.2, dropMult: 3 },
  ranged: { tint: 0x44ff44, scale: 0.7, dropMult: 2 },
  charger: { tint: 0xff6644, scale: 1, dropMult: 1 },
  exploder: { tint: 0xff8800, scale: 1.2, dropMult: 2 },
  healer: { tint: 0x44ffaa, scale: 1, dropMult: 1 },
  invisible: { tint: 0x888888, scale: 0.9, dropMult: 1 },
};

export function calcEnemyStats(type: EnemyType, wave: number) {
  const waveScale = 1 + (wave - 1) * 0.12;
  const maxSpeed = 250;
  switch (type) {
    case "normal":
      return {
        hp: Math.round(20 * waveScale),
        speed: Math.min(120, Math.round(40 + wave * 1.2), maxSpeed),
        contactDamage: Math.round(6 + wave * 0.8),
        xp: 1,
      };
    case "fast":
      return {
        hp: Math.round(10 * waveScale),
        speed: Math.min(180, Math.round(80 + wave * 1.5), maxSpeed),
        contactDamage: Math.round(4 + wave * 0.5),
        xp: 1,
      };
    case "tank":
      return {
        hp: Math.round(60 * waveScale * 1.5),
        speed: Math.min(60, Math.round(20 + wave * 0.5), maxSpeed),
        contactDamage: Math.round(10 + wave * 1.2),
        xp: 3,
      };
    case "ranged":
      return {
        hp: Math.round(15 * waveScale),
        speed: Math.min(50, Math.round(20 + wave * 0.5), maxSpeed),
        contactDamage: Math.round(8 + wave * 0.6),
        xp: 2,
      };
    case "charger":
      return {
        hp: Math.round(15 * waveScale),
        speed: Math.min(180, Math.round(80 + wave * 1.5), maxSpeed),
        contactDamage: Math.round(8 + wave * 1.0),
        xp: 1,
      };
    case "exploder":
      return {
        hp: Math.round(40 * waveScale),
        speed: Math.min(120, Math.round(40 + wave * 1.2), maxSpeed),
        contactDamage: Math.round(16 + wave * 1.0),
        xp: 2,
      };
    case "healer":
      return {
        hp: Math.round(24 * waveScale),
        speed: Math.min(60, Math.round(20 + wave * 0.6), maxSpeed),
        contactDamage: Math.round(6 + wave * 0.8),
        xp: 1,
      };
    case "invisible":
      return {
        hp: Math.round(8 * waveScale),
        speed: Math.min(210, Math.round(110 + wave * 1.5), maxSpeed),
        contactDamage: Math.round(4 + wave * 0.5),
        xp: 1,
      };
  }
}

function generateWaveConfig(wave: number): WaveConfig {
  const hpMult = 0.8 + wave * 0.06;
  const speedMult = 0.9 + wave * 0.04;
  const eliteChance = Math.min(0.25, wave * 0.012);
  const baseCount = Math.round(12 + wave * 2.5);

  const enemies: { type: EnemyType; count: number }[] = [];
  enemies.push({ type: "normal", count: Math.round(baseCount * 0.4) });

  if (wave >= 2) enemies.push({ type: "fast", count: Math.round(baseCount * 0.3) });
  if (wave >= 4) enemies.push({ type: "ranged", count: Math.round(baseCount * 0.2) });
  if (wave >= 5) enemies.push({ type: "tank", count: Math.round(baseCount * 0.15) });
  if (wave >= 8) enemies.push({ type: "charger", count: Math.round(baseCount * 0.12) });
  if (wave >= 10) enemies.push({ type: "exploder", count: Math.round(baseCount * 0.1) });
  if (wave >= 12) enemies.push({ type: "healer", count: Math.round(baseCount * 0.06) });
  if (wave >= 14) enemies.push({ type: "invisible", count: Math.round(baseCount * 0.08) });

  return { enemies, speedMult, hpMult, eliteChance };
}

export const WAVE_CONFIGS: WaveConfig[] = Array.from({ length: 20 }, (_, i) => generateWaveConfig(i + 1));

export function calcRerollCost(wave: number, rerollCount: number): number {
  const base = 3 + Math.floor(wave / 3);
  return Math.max(1, base + rerollCount * 2);
}

export function getWaveDuration(wave: number): number {
  return 35000 + Math.min(wave, 25) * 500;
}

export function pickRandomRarity(): Rarity {
  const weights = [50, 30, 15, 5];
  const total = weights.reduce((a, b) => a + b);
  const roll = Math.random() * total;
  let cumulative = 0;
  for (let i = 0; i < weights.length; i++) {
    cumulative += weights[i];
    if (roll < cumulative) return RARITIES[i];
  }
  return RARITIES[0];
}

export function applyRarityToWeapon(wc: WeaponConfig, rarity: Rarity): Weapon {
  return {
    id: wc.id,
    name: wc.name,
    damage: Math.round(wc.damage * rarity.statMult),
    fireRate: Math.round(wc.fireRate / rarity.statMult),
    bulletCount: wc.bulletCount,
    spread: wc.spread,
    bulletSpeed: Math.round(wc.bulletSpeed * rarity.statMult),
    range: Math.round(wc.range * rarity.statMult),
    cost: Math.round(wc.cost * rarity.costMult),
    weaponType: wc.weaponType,
    level: 1,
    lastFired: 0,
    upgradeCount: 0,
  };
}

export interface BossStats {
  name: string;
  hpMult: number;
  speed: number;
  scale: number;
  tint: number;
  dropMult: number;
}

export const BOSS_DATA: Record<number, BossStats> = {
  10: { name: "钢铁巨兽", hpMult: 20, speed: 40, scale: 3.5, tint: 0xcc0000, dropMult: 15 },
  20: { name: "毁灭巨兽", hpMult: 40, speed: 45, scale: 4, tint: 0xff4400, dropMult: 30 },
};



export interface BiomeDef {
  name: string;
  bgColor: number;
  groundColor: number;
}
export const BIOMES: { fromWave: number; def: BiomeDef }[] = [
  { fromWave: 1, def: { name: "绿色草地", bgColor: 0x2d5a1e, groundColor: 0x4a7a3a } },
  { fromWave: 6, def: { name: "黑暗森林", bgColor: 0x1a3a1e, groundColor: 0x2a4a2a } },
  { fromWave: 11, def: { name: "废弃工厂", bgColor: 0x3a3a3a, groundColor: 0x4a4a4a } },
  { fromWave: 16, def: { name: "暗黑洞穴", bgColor: 0x1a1a2e, groundColor: 0x2a2a3e } },
  { fromWave: 21, def: { name: "地狱火", bgColor: 0x3a1a1a, groundColor: 0x4a2a2a } },
  { fromWave: 26, def: { name: "虚空", bgColor: 0x0a0a1a, groundColor: 0x1a0a1a } },
];

export function getBiome(wave: number): BiomeDef {
  let biome = BIOMES[0].def;
  for (const b of BIOMES) {
    if (wave >= b.fromWave) biome = b.def;
  }
  return biome;
}

export function randomEdgePos(): { x: number; y: number } {
  const W = 1200, H = 800;
  const side = Phaser.Math.Between(0, 3);
  switch (side) {
    case 0: return { x: Phaser.Math.Between(0, W), y: -30 };
    case 1: return { x: W + 30, y: Phaser.Math.Between(0, H) };
    case 2: return { x: Phaser.Math.Between(0, W), y: H + 30 };
    default: return { x: -30, y: Phaser.Math.Between(0, H) };
  }
}

export const CHARACTERS: Character[] = [
  {
    id: "merc", name: "雇佣兵", hpMult: 1, speedMult: 1,
    startWeapons: ["rifle"],
    desc: "均衡型角色，适合新手",
    passive: (s) => { s.attackBonus += 0.1; },
    abilityName: "精准射击", abilityDesc: "6秒内100%暴击",
    abilityCooldown: 15000, abilityDuration: 6000,
  },
  {
    id: "spec", name: "特种兵", hpMult: 0.9, speedMult: 1.1,
    startWeapons: ["smg"],
    desc: "高机动性，冲锋枪专精",
    passive: (s, w) => { for (const we of w) we.fireRate = Math.round(we.fireRate * 0.9); },
    abilityName: "速射", abilityDesc: "4秒内射速翻倍",
    abilityCooldown: 18000, abilityDuration: 4000,
  },
  {
    id: "sniper", name: "狙击手", hpMult: 0.8, speedMult: 0.9,
    startWeapons: ["sniper"],
    desc: "远程高伤害，射程优势",
    passive: (s, w) => { for (const we of w) we.range += 50; },
    abilityName: "锁定", abilityDesc: "5秒内伤害+50%",
    abilityCooldown: 20000, abilityDuration: 5000,
  },
  {
    id: "fireman", name: "消防员", hpMult: 1.2, speedMult: 0.95,
    startWeapons: ["fireaxe"],
    desc: "近战火力，高防御",
    passive: (s) => { s.armor += 2; },
    abilityName: "火焰盾", abilityDesc: "3秒无敌",
    abilityCooldown: 25000, abilityDuration: 3000,
  },
  {
    id: "lucky", name: "幸运儿", hpMult: 1.0, speedMult: 1.0,
    startWeapons: ["pistol"],
    desc: "运气爆棚，选择多样",
    passive: () => {},
    abilityName: "聚宝", abilityDesc: "5秒内掉落翻倍",
    abilityCooldown: 20000, abilityDuration: 5000,
  },
  {
    id: "tank", name: "重装兵", hpMult: 1.5, speedMult: 0.8,
    startWeapons: ["shotgun"],
    desc: "肉盾型角色，高血量高护甲",
    passive: (s) => { s.armor += 1; },
    abilityName: "铁壁", abilityDesc: "5秒内护甲+10",
    abilityCooldown: 22000, abilityDuration: 5000,
  },
  {
    id: "berserker", name: "疯子", hpMult: 0.85, speedMult: 1.3,
    startWeapons: ["crowbar"],
    desc: "狂战士，击杀回血",
    passive: (s) => { s.speed = Math.round(s.speed * 1.15); },
    abilityName: "狂暴", abilityDesc: "4秒内射速大幅提升",
    abilityCooldown: 16000, abilityDuration: 4000,
  },
];
