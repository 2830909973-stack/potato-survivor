import Phaser from "phaser";
import { Character } from "../types";
import { Achievements } from "../utils/Achievements";

const CHARACTERS: Character[] = [
  {
    id: "merc", name: "雇佣兵", desc: "全副武装，伤害提升",
    hpMult: 1, speedMult: 1, startWeapons: ["rifle"],
    passive: (s, w) => w.forEach(we => we.damage = Math.round(we.damage * 1.1)),
    abilityName: "精准射击", abilityDesc: "6秒内子弹必暴击", abilityCooldown: 12000, abilityDuration: 6000,
  },
  {
    id: "spec", name: "特种兵", desc: "双枪上阵，换弹如风",
    hpMult: 0.9, speedMult: 1, startWeapons: ["rifle", "pistol"],
    passive: (s, w) => w.forEach(we => we.reloadTime = Math.round(we.reloadTime * 0.8)),
    abilityName: "速射", abilityDesc: "4秒内射速翻倍", abilityCooldown: 15000, abilityDuration: 4000,
  },
  {
    id: "sniper", name: "狙击手", desc: "远程精准，视野更广",
    hpMult: 0.8, speedMult: 1, startWeapons: ["sniper", "pistol"],
    passive: (s, w) => w.forEach(we => we.range += 50),
    abilityName: "锁定", abilityDesc: "5秒内所有敌人易伤50%", abilityCooldown: 18000, abilityDuration: 5000,
  },
  {
    id: "fireman", name: "消防员", desc: "消防斧开路，身先士卒",
    hpMult: 1.2, speedMult: 0.9, startWeapons: ["fireaxe"],
    passive: (s) => { s.armor += 2; },
    abilityName: "火焰盾", abilityDesc: "3秒无敌并灼烧周围", abilityCooldown: 20000, abilityDuration: 3000,
  },
  {
    id: "lucky", name: "幸运儿", desc: "天生好运，升级多一选",
    hpMult: 0.9, speedMult: 1.1, startWeapons: ["pistol"],
    passive: () => {},
    abilityName: "聚宝", abilityDesc: "5秒内掉落翻倍", abilityCooldown: 15000, abilityDuration: 5000,
  },
  {
    id: "tank", name: "重装兵", desc: "血厚防高，步履沉稳",
    hpMult: 1.5, speedMult: 0.85, startWeapons: ["smg"],
    passive: (s) => { s.armor += 1; },
    abilityName: "铁壁", abilityDesc: "5秒内护甲+10", abilityCooldown: 18000, abilityDuration: 5000,
  },
  {
    id: "berserker", name: "疯子", desc: "狂暴冲杀，击杀回血",
    hpMult: 0.9, speedMult: 1.15, startWeapons: ["shotgun"],
    passive: () => {},
    abilityName: "狂暴", abilityDesc: "4秒内攻速+80%移速+50%", abilityCooldown: 15000, abilityDuration: 4000,
  },
];

const W = 1200;
const H = 800;
const CARD_W = 125;
const CARD_GAP = 12;
const COLORS = [0x44aaff, 0xff6644, 0x44ff88, 0xff44aa, 0xffaa00, 0xaa66ff, 0xff8866];
const PASSIVE_LABELS: Record<string, string> = {
  merc: "伤害 +10%", spec: "换弹 -20%", sniper: "射程 +50",
  fireman: "护甲 +2", lucky: "升级 5 选 1", tank: "护甲 +1", berserker: "移速 +15%",
};

const ABILITY_LABELS: Record<string, string> = {
  merc: "精准射击 [F]", spec: "速射 [F]", sniper: "锁定 [F]",
  fireman: "火焰盾 [F]", lucky: "聚宝 [F]", tank: "铁壁 [F]", berserker: "狂暴 [F]",
};

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIdx = 0;
  private previewContainer!: Phaser.GameObjects.Container;
  private cardsContainer!: Phaser.GameObjects.Container;
  private btnContainer!: Phaser.GameObjects.Container;

  constructor() {
    super("CharacterSelectScene");
  }

  create() {
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);
    this.add.text(W / 2, 30, "选择角色", { fontSize: "28px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);

    this.previewContainer = this.add.container(0, 0);
    this.cardsContainer = this.add.container(0, 0);
    this.btnContainer = this.add.container(0, 0);
    this.renderAll();
  }

  private renderAll() {
    this.renderPreview();
    this.renderCards();
    this.renderStartButton();
  }

  private renderPreview() {
    this.previewContainer.removeAll(true);
    const char = CHARACTERS[this.selectedIdx];
    const color = COLORS[this.selectedIdx];
    const boxX = 300;
    const boxY = 200;
    const panelX = 620;
    const panelW = 500;

    const modelBg = this.add.rectangle(boxX, boxY, 220, 220, 0x222244).setStrokeStyle(2, color);
    const modelRect = this.add.rectangle(boxX, boxY - 15, 150, 150, color, 0.3).setStrokeStyle(3, color);
    const modelName = this.add.text(boxX, boxY + 85, char.name, { fontSize: "20px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);

    const panelBg = this.add.rectangle(panelX, boxY, panelW, 220, 0x222244, 0.9).setStrokeStyle(2, color);
    const pName = this.add.text(panelX - panelW / 2 + 30, boxY - 85, char.name, { fontSize: "26px", color: "#ff0", fontStyle: "bold" });
    const pDesc = this.add.text(panelX - panelW / 2 + 30, boxY - 50, char.desc, { fontSize: "14px", color: "#aaa" });

    const statTexts: Phaser.GameObjects.Text[] = [];
    const statLines = [
      `生命: ${Math.round(char.hpMult * 100)}%`,
      `速度: ${Math.round(char.speedMult * 100)}%`,
      `武器: ${char.startWeapons.join(" / ")}`,
    ];
    statLines.forEach((line, i) => {
      statTexts.push(this.add.text(panelX - panelW / 2 + 30, boxY + 10 + i * 26, line, { fontSize: "15px", color: "#cfc" }));
    });

    const passiveText = this.add.text(panelX - panelW / 2 + 30, boxY + 88, `被动: ${PASSIVE_LABELS[char.id] || ""}`, { fontSize: "15px", color: "#ff8" });
    const abilityText = this.add.text(panelX - panelW / 2 + 30, boxY + 114, `技能: ${char.abilityName} (CD ${char.abilityCooldown / 1000}s)`, { fontSize: "14px", color: "#f88" });
    const abilityDesc = this.add.text(panelX - panelW / 2 + 30, boxY + 134, `${char.abilityDesc}`, { fontSize: "12px", color: "#aaa" });

    this.previewContainer.add([modelBg, modelRect, modelName, panelBg, pName, pDesc, ...statTexts, passiveText, abilityText, abilityDesc]);
  }

  private renderCards() {
    this.cardsContainer.removeAll(true);
    const rows = [4, 3];
    let cardIdx = 0;

    rows.forEach((count, row) => {
      const totalW = count * CARD_W + (count - 1) * CARD_GAP;
      const startX = (W - totalW) / 2 + CARD_W / 2;
      const y = 500 + row * 140;

      for (let i = 0; i < count; i++) {
        const idx = cardIdx++;
        const char = CHARACTERS[idx];
        const color = COLORS[idx];
        const x = startX + i * (CARD_W + CARD_GAP);

        const cardBg = this.add.rectangle(x, y, CARD_W, 120, 0x222244).setInteractive({ useHandCursor: true });
        cardBg.setStrokeStyle(2, color);

        const nameBg = this.add.rectangle(x, y - 44, CARD_W - 8, 26, color, 0.4).setOrigin(0.5);
        const nameText = this.add.text(x, y - 44, char.name, { fontSize: "14px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
        const descText = this.add.text(x, y - 10, char.desc, { fontSize: "10px", color: "#aaa", align: "center", wordWrap: { width: CARD_W - 16 } }).setOrigin(0.5);
        const weaponText = this.add.text(x, y + 28, `武器: ${char.startWeapons.join("/")}`, { fontSize: "10px", color: "#ff8", align: "center" }).setOrigin(0.5);

        if (idx === this.selectedIdx) {
          cardBg.setFillStyle(0x333366);
        }

        cardBg.on("pointerover", () => {
          if (this.selectedIdx !== idx) cardBg.setFillStyle(0x333366);
        });
        cardBg.on("pointerout", () => {
          if (this.selectedIdx !== idx) cardBg.setFillStyle(0x222244);
        });
        cardBg.on("pointerdown", () => {
          this.selectedIdx = idx;
    this.renderAll();
    this.renderAchievements();
        });

        this.cardsContainer.add([cardBg, nameBg, nameText, descText, weaponText]);
      }
    });
  }

  private renderStartButton() {
    this.btnContainer.removeAll(true);
    const btnY = 420;
    const btn = this.add.rectangle(W / 2, btnY, 200, 42, 0x44aa44).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x66cc66);
    const label = this.add.text(W / 2, btnY, "开始游戏", { fontSize: "18px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);

    btn.on("pointerover", () => btn.setFillStyle(0x55cc55));
    btn.on("pointerout", () => btn.setFillStyle(0x44aa44));
    btn.on("pointerdown", () => {
      this.scene.start("GameScene", { character: CHARACTERS[this.selectedIdx] });
    });

    this.btnContainer.add([btn, label]);
  }

  private renderAchievements() {
    const unlocked = Achievements.unlocked;
    if (unlocked.length === 0) return;
    const unlockedSet = new Set(unlocked);
    const all = Achievements.getAll();
    const lines: string[] = [];
    for (const a of all) {
      if (unlockedSet.has(a.id)) lines.push(`🏆 ${a.name}`);
    }
    this.add.text(W / 2, 730, `成就: ${unlocked.length}/${all.length}`, {
      fontSize: "14px", color: "#ff0", fontStyle: "bold",
    }).setOrigin(0.5);
    this.add.text(W / 2, 748, lines.join("  "), {
      fontSize: "11px", color: "#aaa",
    }).setOrigin(0.5);
  }
}
