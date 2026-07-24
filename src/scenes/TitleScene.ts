import Phaser from "phaser";
import { W, H } from "../types";
import { Achievements } from "../utils/Achievements";
import { SettingsUI } from "../ui/SettingsUI";

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

    const startBtn = this.add.rectangle(W / 2, 420, 220, 50, 0x44aa44).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x66cc66);
    this.add.text(W / 2, 420, "開始遊戲", { fontSize: "20px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    startBtn.on("pointerover", () => startBtn.setFillStyle(0x55cc55));
    startBtn.on("pointerout", () => startBtn.setFillStyle(0x44aa44));
    startBtn.on("pointerdown", () => this.scene.start("CharacterSelectScene"));

    const achBtn = this.add.rectangle(W / 2, 490, 220, 50, 0x444488).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x6666aa);
    this.add.text(W / 2, 490, "成就", { fontSize: "20px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    achBtn.on("pointerover", () => achBtn.setFillStyle(0x5555aa));
    achBtn.on("pointerout", () => achBtn.setFillStyle(0x444488));
    achBtn.on("pointerdown", () => this.showAchievements());

    const setBtn = this.add.rectangle(W / 2, 560, 220, 50, 0x884488).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xaa66aa);
    this.add.text(W / 2, 560, "设置", { fontSize: "20px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    setBtn.on("pointerover", () => setBtn.setFillStyle(0xaa55aa));
    setBtn.on("pointerout", () => setBtn.setFillStyle(0x884488));
    setBtn.on("pointerdown", () => this.settingsUI.show());

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
}
