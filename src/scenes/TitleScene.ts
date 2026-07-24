import Phaser from "phaser";
import { W, H } from "../types";
import { Achievements } from "../utils/Achievements";
import { MetaProgress, META_UPGRADES } from "../utils/MetaProgress";
import { SettingsUI } from "../ui/SettingsUI";
import { createButton } from "../ui/UIUtils";

export class TitleScene extends Phaser.Scene {
  private settingsUI!: SettingsUI;

  constructor() {
    super("TitleScene");
  }

  create() {
    this.settingsUI = new SettingsUI(this);
    this.add.rectangle(W / 2, H / 2, W, H, 0x1a1a2e);

    this.add.text(W / 2, 180, "土豆幸存者", { fontSize: "64px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    this.add.text(W / 2, 250, "Potato Survivor", { fontSize: "24px", color: "#aaa" }).setOrigin(0.5);
    this.add.text(W / 2, 300, "殭屍末日 · 覺醒異能", { fontSize: "18px", color: "#f88" }).setOrigin(0.5);

    createButton(this, W / 2, 420, 220, 50, "開始遊戲", 0x44aa44, 0x55cc55, () => this.scene.start("CharacterSelectScene"), 0x66cc66);
    createButton(this, W / 2, 490, 220, 50, "成就", 0x444488, 0x5555aa, () => this.showAchievements(), 0x6666aa);
    createButton(this, W / 2, 560, 220, 50, "设置", 0x884488, 0xaa55aa, () => this.settingsUI.show(), 0xaa66aa);
    createButton(this, W / 2, 630, 220, 50, `基因升级 (${MetaProgress.genePoints}💰)`, 0x444444, 0x555555, () => this.showMetaUpgrades(), 0x888888);

    const unlocked = Achievements.unlocked;
    const all = Achievements.getAll();
    this.add.text(W / 2, 620, `成就: ${unlocked.length}/${all.length}`, { fontSize: "14px", color: "#ff0" }).setOrigin(0.5);

    this.add.text(W / 2, H - 40, "Q 切槍  R 換彈  G 手雷  1/2 異能  F 技能  ESC 暫停", {
      fontSize: "12px", color: "#666",
    }).setOrigin(0.5);
  }

  private showAchievements() {
    const unlockedSet = new Set(Achievements.unlocked);
    const all = Achievements.getAll();
    const lines: string[] = [];
    for (const a of all) {
      const done = unlockedSet.has(a.id);
      lines.push(`${done ? "🏆" : "　"} ${a.name} — ${a.desc}`);
    }
    const text = this.add.text(W / 2, H / 2, lines.join("\n"), {
      fontSize: "14px", color: "#aaa", align: "center",
      lineSpacing: 6,
      backgroundColor: "#1a1a2e", padding: { x: 20, y: 20 },
    }).setOrigin(0.5).setDepth(100);

    const closeBtn = this.add.text(W / 2, H / 2 + lines.length * 10 + 40, "點擊關閉", {
      fontSize: "16px", color: "#88f",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
    closeBtn.on("pointerdown", () => { text.destroy(); closeBtn.destroy(); });
  }

  private showMetaUpgrades() {
    const upgradeLines: string[] = [];
    for (const u of META_UPGRADES) {
      const cur = MetaProgress.getUpgradeLevel(u.id);
      const cost = MetaProgress.getUpgradeCost(u.id);
      if (cur >= u.maxLevel) {
        upgradeLines.push(`✔ ${u.name} MAX  ${u.desc}`);
      } else {
        upgradeLines.push(`${u.name} Lv.${cur}/${u.maxLevel}  ${u.desc}  [${cost}💰]`);
      }
    }
    const text = this.add.text(W / 2, H / 2 - 20, upgradeLines.join("\n"), {
      fontSize: "14px", color: "#aaa", align: "center",
      lineSpacing: 8,
      backgroundColor: "#1a1a2e", padding: { x: 20, y: 20 },
    }).setOrigin(0.5).setDepth(100);

    const hint = this.add.text(W / 2, H / 2 + upgradeLines.length * 8 + 30, "点击升级项购买 | 基因点通过游戏获得", {
      fontSize: "12px", color: "#666",
    }).setOrigin(0.5).setDepth(100);

    const closeBtn = this.add.text(W / 2, H / 2 + upgradeLines.length * 8 + 55, "关闭", {
      fontSize: "16px", color: "#88f",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);

    for (let i = 0; i < META_UPGRADES.length; i++) {
      const u = META_UPGRADES[i];
      const cur = MetaProgress.getUpgradeLevel(u.id);
      if (cur >= u.maxLevel) continue;
      const y = H / 2 - 20 - upgradeLines.length * 4 + i * 22;
      const buyBtn = this.add.text(W / 2 + 180, y, "购买", {
        fontSize: "12px", color: "#4f4", fontStyle: "bold",
      }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(100);
      buyBtn.on("pointerdown", () => {
        if (MetaProgress.buyUpgrade(u.id)) {
          text.destroy(); hint.destroy(); closeBtn.destroy();
          this.showMetaUpgrades();
        }
      });
    }

    closeBtn.on("pointerdown", () => { text.destroy(); hint.destroy(); closeBtn.destroy(); });
  }
}
