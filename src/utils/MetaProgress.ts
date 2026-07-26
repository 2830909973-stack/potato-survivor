import { PlayerStats } from "../types";
import { safeGetItem, safeSetItem } from "./Storage";

const STORAGE_KEY = "potato_meta";

interface MetaState {
  genePoints: number;
  upgrades: Record<string, number>;
  unlockedChars: string[];
  unlockedDifficulty: number;
}

export interface MetaUpgradeDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  baseCost: number;
  apply: (level: number, stats: PlayerStats) => void;
}

export const META_UPGRADES: MetaUpgradeDef[] = [
  { id: "hp", name: "生命强化", desc: "最大生命 +10", maxLevel: 10, baseCost: 15, apply: (l, s) => { s.maxHp += l * 10; s.hp += l * 10; } },
  { id: "armor", name: "护甲训练", desc: "护甲 +1", maxLevel: 5, baseCost: 30, apply: (l, s) => { s.armor += l; } },
  { id: "speed", name: "速度提升", desc: "移动速度 +5", maxLevel: 10, baseCost: 12, apply: (l, s) => { s.speed += l * 5; } },
  { id: "dmg", name: "武器精通", desc: "所有伤害 +5%", maxLevel: 10, baseCost: 20, apply: (l, s) => { /* applied via weapon multiplier in Player */ } },
  { id: "dodge", name: "闪避训练", desc: "闪避 +1%", maxLevel: 5, baseCost: 25, apply: (l, s) => { s.dodge += l * 0.01; } },
  { id: "regen", name: "自愈", desc: "每秒回复 3HP", maxLevel: 1, baseCost: 50, apply: (l, s) => { if (l > 0) s.hpRegen = true; } },
];

export const CHAR_UNLOCK_REQUIREMENTS: Record<string, { name: string; desc: string }> = {
  sniper: { name: "狙击手", desc: "累计击杀 100 只怪物" },
  lucky: { name: "幸运儿", desc: "单局获得 200 材料" },
  tank: { name: "重装兵", desc: "通关第 10 波" },
  berserker: { name: "疯子", desc: "通关第 20 波" },
};

function costFor(upgrade: MetaUpgradeDef, level: number): number {
  return Math.round(upgrade.baseCost * (1 + level * 0.5));
}

function defaultState(): MetaState {
  return {
    genePoints: 0,
    upgrades: {},
    unlockedChars: ["merc", "spec", "fireman"],
    unlockedDifficulty: 1,
  };
}

function load(): MetaState {
  const raw = safeGetItem(STORAGE_KEY);
  if (raw) {
    try {
      const data = JSON.parse(raw) as MetaState;
      return { ...defaultState(), ...data };
    } catch { }
  }
  return defaultState();
}

function save(state: MetaState) {
  safeSetItem(STORAGE_KEY, JSON.stringify(state));
}

export class MetaProgress {
  private static state = load();

  static get genePoints(): number { return MetaProgress.state.genePoints; }

  static addGenePoints(amount: number) {
    MetaProgress.state.genePoints += amount;
    save(MetaProgress.state);
  }

  static getUpgradeLevel(id: string): number {
    return MetaProgress.state.upgrades[id] || 0;
  }

  static getUpgradeCost(id: string): number {
    const def = META_UPGRADES.find(u => u.id === id);
    if (!def) return Infinity;
    const cur = MetaProgress.getUpgradeLevel(id);
    if (cur >= def.maxLevel) return Infinity;
    return costFor(def, cur);
  }

  static buyUpgrade(id: string): boolean {
    const def = META_UPGRADES.find(u => u.id === id);
    if (!def) return false;
    const cur = MetaProgress.getUpgradeLevel(id);
    if (cur >= def.maxLevel) return false;
    const cost = costFor(def, cur);
    if (MetaProgress.state.genePoints < cost) return false;
    MetaProgress.state.genePoints -= cost;
    MetaProgress.state.upgrades[id] = cur + 1;
    save(MetaProgress.state);
    return true;
  }

  static isCharUnlocked(id: string): boolean {
    return MetaProgress.state.unlockedChars.includes(id);
  }

  static unlockChar(id: string): boolean {
    if (MetaProgress.isCharUnlocked(id)) return false;
    MetaProgress.state.unlockedChars.push(id);
    save(MetaProgress.state);
    return true;
  }

  static applyUpgrades(stats: PlayerStats) {
    for (const def of META_UPGRADES) {
      const level = MetaProgress.getUpgradeLevel(def.id);
      if (level > 0) def.apply(level, stats);
    }
  }

  static get dmgMult(): number {
    const level = MetaProgress.getUpgradeLevel("dmg");
    return 1 + level * 0.05;
  }

  static get unlockedDifficulty(): number {
    return MetaProgress.state.unlockedDifficulty;
  }

  static setUnlockedDifficulty(n: number) {
    if (n > MetaProgress.state.unlockedDifficulty) {
      MetaProgress.state.unlockedDifficulty = n;
      save(MetaProgress.state);
    }
  }

  static getCharUnlockRequirement(id: string): { name: string; desc: string } | null {
    return CHAR_UNLOCK_REQUIREMENTS[id] || null;
  }

  static checkCharUnlocks(ctx: { kills: number; materialsEarned: number; wave: number; won: boolean }): string[] {
    const newly: string[] = [];
    if (!MetaProgress.isCharUnlocked("sniper") && ctx.kills >= 100) {
      MetaProgress.unlockChar("sniper"); newly.push("sniper");
    }
    if (!MetaProgress.isCharUnlocked("lucky") && ctx.materialsEarned >= 200) {
      MetaProgress.unlockChar("lucky"); newly.push("lucky");
    }
    if (!MetaProgress.isCharUnlocked("tank") && ctx.wave >= 10) {
      MetaProgress.unlockChar("tank"); newly.push("tank");
    }
    if (!MetaProgress.isCharUnlocked("berserker") && ctx.wave >= 20) {
      MetaProgress.unlockChar("berserker"); newly.push("berserker");
    }
    return newly;
  }
}