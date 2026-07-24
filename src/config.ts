import { PlayerStats, Weapon, WeaponConfig, Mod, Rarity, ShopItem, BodyPartUpgrade, WaveConfig, EnemyType, EvolutionRecipe, PowerConfig } from "./types";

export const PART_NAMES: Record<string, string> = { head: "头部", chest: "胸部", legs: "腿部", weapon: "武器" };
export const PART_COLORS: Record<string, string> = { head: "#f80", chest: "#f44", legs: "#4f8", weapon: "#8cf" };

export const RARITIES: Rarity[] = [
  { name: "普通", statMult: 1, costMult: 1, color: "#aaaaaa" },
  { name: "稀有", statMult: 1.12, costMult: 1.5, color: "#4488ff" },
  { name: "史诗", statMult: 1.25, costMult: 2, color: "#aa44ff" },
  { name: "传说", statMult: 1.4, costMult: 3, color: "#ffaa00" },
];

export const WEAPON_CONFIGS: WeaponConfig[] = [
  { id: "pistol", name: "手枪", damage: 12, fireRate: 350, bulletCount: 1, spread: 0, bulletSpeed: 400, range: 300, ammoMax: 15, reloadTime: 1000, weaponType: "ranged", cost: 0 },
  { id: "smg", name: "冲锋枪", damage: 4, fireRate: 120, bulletCount: 2, spread: 12, bulletSpeed: 350, range: 250, ammoMax: 25, reloadTime: 1800, weaponType: "ranged", cost: 30 },
  { id: "shotgun", name: "霰弹枪", damage: 8, fireRate: 700, bulletCount: 5, spread: 15, bulletSpeed: 350, range: 120, ammoMax: 6, reloadTime: 2200, weaponType: "ranged", cost: 30 },
  { id: "sniper", name: "狙击枪", damage: 50, fireRate: 1000, bulletCount: 1, spread: 0, bulletSpeed: 700, range: 500, ammoMax: 6, reloadTime: 2200, penetrate: 1, weaponType: "ranged", cost: 30 },
  { id: "rifle", name: "步枪", damage: 15, fireRate: 300, bulletCount: 1, spread: 3, bulletSpeed: 450, range: 350, ammoMax: 20, reloadTime: 1800, weaponType: "ranged", cost: 20 },
  { id: "rocket", name: "火箭筒", damage: 80, fireRate: 1500, bulletCount: 1, spread: 0, bulletSpeed: 350, range: 400, ammoMax: 2, reloadTime: 3000, splashRadius: 80, weaponType: "ranged", cost: 35 },
  { id: "fireaxe", name: "消防斧", damage: 22, fireRate: 900, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 65, ammoMax: 0, reloadTime: 0, weaponType: "melee", cost: 15 },
  { id: "crowbar", name: "撬棍", damage: 16, fireRate: 600, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 60, ammoMax: 0, reloadTime: 0, weaponType: "melee", cost: 12 },
  { id: "machete", name: "砍刀", damage: 12, fireRate: 400, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 55, ammoMax: 0, reloadTime: 0, weaponType: "melee", cost: 10 },
  { id: "laser", name: "激光枪", damage: 3, fireRate: 50, bulletCount: 1, spread: 0, bulletSpeed: 600, range: 350, ammoMax: 60, reloadTime: 2000, penetrate: 3, weaponType: "ranged", cost: 35 },
  { id: "freeze", name: "冰冻枪", damage: 8, fireRate: 400, bulletCount: 1, spread: 4, bulletSpeed: 350, range: 250, ammoMax: 12, reloadTime: 1800, weaponType: "ranged", cost: 30 },
];

export const ITEMS: ShopItem[] = [
  { id: "coffee", name: "咖啡", desc: "所有武器射速 +10%", cost: 15, type: "item", apply: (s, w) => { w.forEach(we => we.fireRate = Math.round(we.fireRate * 0.9)); } },
  { id: "medkit", name: "医疗包", desc: "每波回复 20HP", cost: 12, type: "item", apply: (s) => { s.hp = Math.min(s.maxHp, s.hp + 20); } },
  { id: "shoes", name: "跑鞋", desc: "移动速度 +20", cost: 10, type: "item", apply: (s) => { s.speed += 20; } },
  { id: "shield", name: "铁盾", desc: "护甲 +2", cost: 18, type: "item", apply: (s) => { s.armor += 2; } },
  { id: "clover", name: "幸运草", desc: "经验获取 +15%", cost: 14, type: "item", apply: (s) => { s.xpMult = 1.15; } },
  { id: "foldingStock", name: "折叠枪托", desc: "移速 +15", cost: 10, type: "item", apply: (s) => { s.speed += 15; } },
  { id: "energyCell", name: "能量电池", desc: "激光枪弹容量 +50%", cost: 16, type: "item", apply: (s, w) => { w.forEach(we => { if (we.id === "laser" || we.id === "evolved_laser") we.ammoMax = Math.round(we.ammoMax * 1.5); }); } },
  { id: "coolant", name: "冷却液", desc: "冰冻枪射速 +20%", cost: 14, type: "item", apply: (s, w) => { w.forEach(we => { if (we.id === "freeze" || we.id === "evolved_freeze") we.fireRate = Math.round(we.fireRate * 0.8); }); } },
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

export const MOD_CONFIGS: Mod[] = [
  { id: "silencer", name: "消音器", desc: "伤害 +15%", cost: 12,
    apply: (w) => { w.damage = Math.round(w.damage * 1.15); },
    remove: (w) => { w.damage = Math.round(w.damage / 1.15); } },
  { id: "extendedMag", name: "扩容弹匣", desc: "弹容量 +50%", cost: 10,
    apply: (w) => { w.ammoMax = Math.round(w.ammoMax * 1.5); },
    remove: (w) => { w.ammoMax = Math.round(w.ammoMax / 1.5); w.ammo = Math.min(w.ammo, w.ammoMax); } },
  { id: "redDot", name: "红点瞄准", desc: "射程 +15%, 散射 -30%", cost: 14,
    apply: (w) => { w.range = Math.round(w.range * 1.15); w.spread = Math.round(w.spread * 0.7); },
    remove: (w) => { w.range = Math.round(w.range / 1.15); w.spread = Math.round(w.spread / 0.7); } },
  { id: "stock", name: "稳定枪托", desc: "射速 +10%", cost: 15,
    apply: (w) => { w.fireRate = Math.round(w.fireRate * 0.9); },
    remove: (w) => { w.fireRate = Math.round(w.fireRate / 0.9); } },
  { id: "apAmmo", name: "穿甲弹", desc: "伤害 +10%, 无视护甲", cost: 16,
    apply: (w) => { w.damage = Math.round(w.damage * 1.1); },
    remove: (w) => { w.damage = Math.round(w.damage / 1.1); } },
  { id: "quickReload", name: "快速换弹", desc: "换弹时间 -25%", cost: 11,
    apply: (w) => { w.reloadTime = Math.round(w.reloadTime * 0.75); },
    remove: (w) => { w.reloadTime = Math.round(w.reloadTime / 0.75); } },
  { id: "compensator", name: "补偿器", desc: "散射 -40%", cost: 12,
    apply: (w) => { w.spread = Math.round(w.spread * 0.6); },
    remove: (w) => { w.spread = Math.round(w.spread / 0.6); } },
  { id: "hpScope", name: "高倍镜", desc: "射程 +30%, 射速 -10%", cost: 18,
    apply: (w) => { w.range = Math.round(w.range * 1.3); w.fireRate = Math.round(w.fireRate * 1.1); },
    remove: (w) => { w.range = Math.round(w.range / 1.3); w.fireRate = Math.round(w.fireRate / 1.1); } },
  { id: "hollowPoint", name: "空尖弹", desc: "伤害 +20%, 射程 -10%", cost: 14,
    apply: (w) => { w.damage = Math.round(w.damage * 1.2); w.range = Math.round(w.range * 0.9); },
    remove: (w) => { w.damage = Math.round(w.damage / 1.2); w.range = Math.round(w.range / 0.9); } },
];

export const BASE_STATS: PlayerStats = {
  speed: 200, maxHp: 100, hp: 100, armor: 0, materials: 0, level: 1, xp: 0, xpToNext: 30,
  critChance: 0, dodge: 0, hpRegen: false, pickupRangeBonus: 0,
};

export const XP_PER_KILL: Record<EnemyType, number> = {
  normal: 5, fast: 3, tank: 10, ranged: 8, charger: 6, exploder: 12, healer: 6, invisible: 4,
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
  { id: "dmgSmall", part: "weapon", name: "利刃", desc: "伤害 +3", tier: 1, apply: (s, w) => w.forEach(we => we.damage += 3) },
  { id: "fireRateSmall", part: "weapon", name: "连射", desc: "射速 +40ms", tier: 1, apply: (s, w) => w.forEach(we => we.fireRate = Math.max(50, we.fireRate - 40)) },
  { id: "ammoInc", part: "weapon", name: "扩容", desc: "弹匣 +15%", tier: 2, apply: (s, w) => w.forEach(we => { we.ammoMax = Math.round(we.ammoMax * 1.15); we.ammo = Math.min(we.ammo, we.ammoMax); }) },
  { id: "reloadSpeed", part: "weapon", name: "快速换弹", desc: "换弹 -15%", tier: 2, apply: (s, w) => w.forEach(we => we.reloadTime = Math.round(we.reloadTime * 0.85)) },
];

export const ENEMY_CONFIG = {
  normal: { hp: 45, speed: 100, tint: 0xff4444, scale: 1, dropMult: 1 },
  fast: { hp: 15, speed: 140, tint: 0xffff44, scale: 0.7, dropMult: 1 },
  tank: { hp: 80, speed: 50, tint: 0xaa44ff, scale: 1.5, dropMult: 2 },
  ranged: { hp: 20, speed: 60, tint: 0x44ff44, scale: 0.8, dropMult: 2 },
  charger: { hp: 25, speed: 160, tint: 0xff6644, scale: 1, dropMult: 1 },
  exploder: { hp: 60, speed: 40, tint: 0xff8800, scale: 1.2, dropMult: 3 },
  healer: { hp: 35, speed: 80, tint: 0x44ffaa, scale: 1, dropMult: 2 },
  invisible: { hp: 20, speed: 120, tint: 0x888888, scale: 0.9, dropMult: 1 },
};

export const WAVE_CONFIGS: WaveConfig[] = [
  { enemies: [{ type: "normal", count: 20 }], speedMult: 1, hpMult: 1 },
  { enemies: [{ type: "normal", count: 25 }, { type: "fast", count: 10 }], speedMult: 1, hpMult: 1 },
  { enemies: [{ type: "normal", count: 30 }, { type: "fast", count: 15 }, { type: "tank", count: 5 }], speedMult: 1.1, hpMult: 1, eliteChance: 0.05 },
  { enemies: [{ type: "normal", count: 35 }, { type: "ranged", count: 15 }, { type: "tank", count: 10 }], speedMult: 1.1, hpMult: 1.1, eliteChance: 0.05 },
  { enemies: [{ type: "normal", count: 30 }, { type: "fast", count: 20 }, { type: "ranged", count: 10 }, { type: "tank", count: 10 }], speedMult: 1.1, hpMult: 1.1, eliteChance: 0.08 },
  { enemies: [{ type: "normal", count: 35 }, { type: "fast", count: 25 }, { type: "ranged", count: 15 }, { type: "tank", count: 15 }], speedMult: 1.2, hpMult: 1.2, eliteChance: 0.08 },
  { enemies: [{ type: "normal", count: 40 }, { type: "fast", count: 30 }, { type: "ranged", count: 20 }, { type: "tank", count: 18 }], speedMult: 1.2, hpMult: 1.2, eliteChance: 0.08 },
  { enemies: [{ type: "normal", count: 35 }, { type: "fast", count: 30 }, { type: "ranged", count: 20 }, { type: "tank", count: 20 }, { type: "charger", count: 5 }], speedMult: 1.3, hpMult: 1.3, eliteChance: 0.1 },
  { enemies: [{ type: "normal", count: 35 }, { type: "fast", count: 25 }, { type: "ranged", count: 25 }, { type: "tank", count: 20 }, { type: "charger", count: 10 }], speedMult: 1.3, hpMult: 1.3, eliteChance: 0.1 },
  { enemies: [{ type: "normal", count: 40 }, { type: "fast", count: 30 }, { type: "ranged", count: 25 }, { type: "tank", count: 22 }, { type: "charger", count: 12 }], speedMult: 1.4, hpMult: 1.4, eliteChance: 0.12 },
  { enemies: [{ type: "normal", count: 35 }, { type: "fast", count: 25 }, { type: "ranged", count: 20 }, { type: "tank", count: 18 }, { type: "charger", count: 10 }, { type: "exploder", count: 5 }], speedMult: 1.45, hpMult: 1.45, eliteChance: 0.12 },
  { enemies: [{ type: "fast", count: 35 }, { type: "ranged", count: 25 }, { type: "charger", count: 15 }, { type: "exploder", count: 8 }], speedMult: 1.5, hpMult: 1.5, eliteChance: 0.12 },
  { enemies: [{ type: "normal", count: 30 }, { type: "fast", count: 25 }, { type: "ranged", count: 20 }, { type: "healer", count: 5 }, { type: "exploder", count: 8 }], speedMult: 1.55, hpMult: 1.55, eliteChance: 0.12 },
  { enemies: [{ type: "normal", count: 35 }, { type: "tank", count: 20 }, { type: "charger", count: 18 }, { type: "exploder", count: 12 }, { type: "invisible", count: 8 }], speedMult: 1.6, hpMult: 1.6, eliteChance: 0.15 },
  { enemies: [{ type: "fast", count: 40 }, { type: "ranged", count: 30 }, { type: "charger", count: 20 }, { type: "exploder", count: 15 }, { type: "invisible", count: 10 }], speedMult: 1.65, hpMult: 1.65, eliteChance: 0.15 },
  { enemies: [{ type: "normal", count: 40 }, { type: "fast", count: 35 }, { type: "tank", count: 25 }, { type: "charger", count: 20 }, { type: "exploder", count: 15 }, { type: "healer", count: 5 }], speedMult: 1.7, hpMult: 1.7, eliteChance: 0.15 },
  { enemies: [{ type: "fast", count: 40 }, { type: "ranged", count: 30 }, { type: "tank", count: 25 }, { type: "charger", count: 22 }, { type: "exploder", count: 18 }, { type: "healer", count: 8 }], speedMult: 1.75, hpMult: 1.75, eliteChance: 0.18 },
  { enemies: [{ type: "normal", count: 45 }, { type: "fast", count: 35 }, { type: "charger", count: 25 }, { type: "exploder", count: 20 }, { type: "ranged", count: 25 }], speedMult: 1.8, hpMult: 1.8, eliteChance: 0.18 },
  { enemies: [{ type: "fast", count: 40 }, { type: "charger", count: 28 }, { type: "exploder", count: 22 }, { type: "tank", count: 25 }, { type: "ranged", count: 30 }], speedMult: 1.85, hpMult: 1.85, eliteChance: 0.2 },
  { enemies: [{ type: "normal", count: 50 }, { type: "fast", count: 40 }, { type: "charger", count: 30 }, { type: "exploder", count: 25 }, { type: "tank", count: 25 }], speedMult: 1.9, hpMult: 1.9, eliteChance: 0.2 },
  { enemies: [{ type: "fast", count: 45 }, { type: "charger", count: 35 }, { type: "exploder", count: 28 }, { type: "ranged", count: 30 }], speedMult: 1.95, hpMult: 1.95, eliteChance: 0.15 },
  { enemies: [{ type: "normal", count: 50 }, { type: "charger", count: 35 }, { type: "exploder", count: 25 }, { type: "ranged", count: 30 }], speedMult: 2.0, hpMult: 2.0, eliteChance: 0.18 },
  { enemies: [{ type: "fast", count: 50 }, { type: "charger", count: 35 }, { type: "exploder", count: 28 }, { type: "tank", count: 25 }], speedMult: 2.05, hpMult: 2.05, eliteChance: 0.18 },
  { enemies: [{ type: "normal", count: 55 }, { type: "fast", count: 40 }, { type: "charger", count: 35 }, { type: "exploder", count: 30 }], speedMult: 2.1, hpMult: 2.1, eliteChance: 0.18 },
  { enemies: [{ type: "fast", count: 45 }, { type: "charger", count: 35 }, { type: "exploder", count: 30 }, { type: "tank", count: 30 }, { type: "ranged", count: 25 }], speedMult: 2.15, hpMult: 2.15, eliteChance: 0.2 },
  { enemies: [{ type: "normal", count: 55 }, { type: "fast", count: 45 }, { type: "charger", count: 35 }, { type: "exploder", count: 30 }, { type: "ranged", count: 25 }, { type: "tank", count: 25 }], speedMult: 2.0, hpMult: 2.0, eliteChance: 0.18 },
  { enemies: [{ type: "fast", count: 50 }, { type: "charger", count: 40 }, { type: "exploder", count: 30 }, { type: "tank", count: 30 }, { type: "ranged", count: 30 }], speedMult: 2.1, hpMult: 2.1, eliteChance: 0.18 },
  { enemies: [{ type: "normal", count: 60 }, { type: "fast", count: 50 }, { type: "charger", count: 40 }, { type: "exploder", count: 30 }, { type: "tank", count: 25 }], speedMult: 2.2, hpMult: 2.2, eliteChance: 0.2 },
  { enemies: [{ type: "fast", count: 55 }, { type: "charger", count: 40 }, { type: "exploder", count: 35 }, { type: "tank", count: 30 }, { type: "ranged", count: 30 }], speedMult: 2.3, hpMult: 2.3, eliteChance: 0.2 },
  { enemies: [{ type: "normal", count: 65 }, { type: "fast", count: 55 }, { type: "charger", count: 45 }, { type: "exploder", count: 35 }, { type: "tank", count: 30 }, { type: "ranged", count: 30 }], speedMult: 2.4, hpMult: 2.4, eliteChance: 0.2 },
];

export function calcRerollCost(level: number, rerollCount: number): number {
  const wave = Math.max(1, level);
  return Math.max(1, Math.round(wave * 0.75) + rerollCount * Math.max(1, Math.round(wave * 0.4)));
}

export function getWaveDuration(wave: number): number {
  if (wave === 1) return 30000;
  if (wave === 2) return 35000;
  if (wave === 3) return 40000;
  if (wave === 4) return 45000;
  if (wave <= 10) return 50000;
  if (wave <= 15) return 55000;
  if (wave <= 20) return 60000;
  if (wave <= 25) return 65000;
  return 70000;
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
    ammoMax: wc.ammoMax,
    reloadTime: wc.reloadTime,
    weaponType: wc.weaponType,
    level: 1,
    lastFired: 0,
    ammo: wc.ammoMax,
    reloading: false,
    reloadTimer: 0,
    mods: [],
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
  5: { name: "毒蝎", hpMult: 8, speed: 45, scale: 2.5, tint: 0xaa00ff, dropMult: 6 },
  10: { name: "钢铁巨兽", hpMult: 30, speed: 40, scale: 3.5, tint: 0xcc0000, dropMult: 15 },
  15: { name: "毒蝎·王", hpMult: 24, speed: 50, scale: 2.8, tint: 0xff00ff, dropMult: 10 },
  20: { name: "毁灭巨兽", hpMult: 50, speed: 45, scale: 4, tint: 0xff4400, dropMult: 25 },
  25: { name: "暗影领主", hpMult: 60, speed: 50, scale: 4, tint: 0x4444ff, dropMult: 30 },
  30: { name: "死亡之翼", hpMult: 100, speed: 55, scale: 5, tint: 0xff0044, dropMult: 50 },
};

export const EVOLUTIONS: EvolutionRecipe[] = [
  {
    weaponId: "shotgun", itemId: "shield",
    resultName: "爆炸护盾",
    result: { id: "evolved_shotgun", name: "爆炸护盾", damage: 12, fireRate: 600, bulletCount: 5, spread: 15, bulletSpeed: 350, range: 140, cost: 0, ammoMax: 6, reloadTime: 2200, weaponType: "ranged", splashRadius: 60 },
  },
  {
    weaponId: "sniper", itemId: "clover",
    resultName: "死神之眼",
    result: { id: "evolved_sniper", name: "死神之眼", damage: 50, fireRate: 800, bulletCount: 1, spread: 0, bulletSpeed: 800, range: 600, cost: 0, ammoMax: 8, reloadTime: 1800, weaponType: "ranged", penetrate: 3 },
  },
  {
    weaponId: "smg", itemId: "coffee",
    resultName: "加特林",
    result: { id: "evolved_smg", name: "加特林", damage: 3, fireRate: 60, bulletCount: 3, spread: 18, bulletSpeed: 350, range: 250, cost: 0, ammoMax: 40, reloadTime: 2500, weaponType: "ranged" },
  },
  {
    weaponId: "fireaxe", itemId: "shoes",
    resultName: "旋风斩",
    result: { id: "evolved_fireaxe", name: "旋风斩", damage: 30, fireRate: 700, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 130, ammoMax: 0, reloadTime: 0, cost: 0, weaponType: "melee" },
  },
  {
    weaponId: "rifle", itemId: "foldingStock",
    resultName: "突击步枪",
    result: { id: "evolved_rifle", name: "突击步枪", damage: 20, fireRate: 220, bulletCount: 1, spread: 3, bulletSpeed: 500, range: 380, cost: 0, ammoMax: 25, reloadTime: 1500, weaponType: "ranged" },
  },
  {
    weaponId: "pistol", itemId: "medkit",
    resultName: "医疗手枪",
    result: { id: "evolved_pistol", name: "医疗手枪", damage: 8, fireRate: 250, bulletCount: 1, spread: 0, bulletSpeed: 400, range: 350, cost: 0, ammoMax: 20, reloadTime: 900, weaponType: "ranged" },
  },
  {
    weaponId: "rocket", itemId: "shield",
    resultName: "爆破护盾",
    result: { id: "evolved_rocket", name: "爆破护盾", damage: 60, fireRate: 1200, bulletCount: 1, spread: 0, bulletSpeed: 350, range: 450, cost: 0, ammoMax: 3, reloadTime: 2800, weaponType: "ranged", splashRadius: 100 },
  },
  {
    weaponId: "crowbar", itemId: "clover",
    resultName: "幸运撬棍",
    result: { id: "evolved_crowbar", name: "幸运撬棍", damage: 25, fireRate: 500, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 70, ammoMax: 0, reloadTime: 0, cost: 0, weaponType: "melee" },
  },
  {
    weaponId: "machete", itemId: "foldingStock",
    resultName: "战术砍刀",
    result: { id: "evolved_machete", name: "战术砍刀", damage: 18, fireRate: 300, bulletCount: 0, spread: 0, bulletSpeed: 0, range: 60, ammoMax: 0, reloadTime: 0, cost: 0, weaponType: "melee" },
  },
  {
    weaponId: "laser", itemId: "coffee",
    resultName: "激光炮",
    result: { id: "evolved_laser", name: "激光炮", damage: 6, fireRate: 40, bulletCount: 2, spread: 1, bulletSpeed: 650, range: 400, ammoMax: 80, reloadTime: 2500, penetrate: 5, weaponType: "ranged", cost: 0 },
  },
  {
    weaponId: "freeze", itemId: "clover",
    resultName: "暴风雪",
    result: { id: "evolved_freeze", name: "暴风雪", damage: 12, fireRate: 300, bulletCount: 3, spread: 20, bulletSpeed: 300, range: 280, ammoMax: 18, reloadTime: 2000, splashRadius: 50, weaponType: "ranged", cost: 0 },
  },
];

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
