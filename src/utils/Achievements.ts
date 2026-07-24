export interface Achievement {
  id: string;
  name: string;
  desc: string;
  check: (ctx: AchievementCtx) => boolean;
}

export interface AchievementCtx {
  wave: number;
  kills: number;
  bossKills: number;
  peakAlive: number;
  materialsEarned: number;
  charId: string;
  won: boolean;
}

const ALL: Achievement[] = [
  { id: "first_blood", name: "初阵", desc: "通关第 5 波", check: c => c.wave >= 5 && c.won },
  { id: "wave_10", name: "十波勇士", desc: "通关第 10 波", check: c => c.wave >= 10 && c.won },
  { id: "wave_20", name: "二十波勇士", desc: "通关第 20 波", check: c => c.wave >= 20 && c.won },
  { id: "wave_30", name: "幸存者", desc: "通关第 30 波", check: c => c.wave >= 30 && c.won },
  { id: "kill_100", name: "百斩", desc: "累计击杀 100 只怪物", check: c => c.kills >= 100 },
  { id: "kill_500", name: "五百斩", desc: "累计击杀 500 只怪物", check: c => c.kills >= 500 },
  { id: "boss_5", name: "猎王", desc: "击败 5 个 Boss", check: c => c.bossKills >= 5 },
  { id: "boss_10", name: "弑神", desc: "击败 10 个 Boss", check: c => c.bossKills >= 10 },
  { id: "rich", name: "致富", desc: "一局获得 200 材料", check: c => c.materialsEarned >= 200 },
  { id: "magnet", name: "吸铁石", desc: "一局获得 500 材料", check: c => c.materialsEarned >= 500 },
  { id: "berserker_win", name: "疯子的胜利", desc: "用疯子通关", check: c => c.charId === "berserker" && c.won },
  { id: "sniper_win", name: "狙击精英", desc: "用狙击手通关", check: c => c.charId === "sniper" && c.won },
  { id: "tank_win", name: "钢铁意志", desc: "用重装兵通关", check: c => c.charId === "tank" && c.won },
];

const STORAGE_KEY = "potato_achievements";

export class Achievements {
  static get unlocked(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  static isUnlocked(id: string): boolean {
    return this.unlocked.includes(id);
  }

  static check(ctx: AchievementCtx): string[] {
    const already = new Set(this.unlocked);
    const newly: string[] = [];
    for (const a of ALL) {
      if (already.has(a.id)) continue;
      if (a.check(ctx)) {
        newly.push(a.id);
      }
    }
    if (newly.length > 0) {
      const merged = [...already, ...newly];
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(merged)); } catch {}
    }
    return newly;
  }

  static getAll() { return ALL; }
}
