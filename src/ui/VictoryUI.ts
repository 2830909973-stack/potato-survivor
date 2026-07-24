import Phaser from "phaser";
import { W, H } from "../types";
import { MetaProgress } from "../utils/MetaProgress";

export class VictoryUI {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(wave: number, level: number, kills: number, bossKills: number, peakAlive: number, materialsEarned: number, onMenu: () => void, onRestart: () => void) {
    const geneEarned = Math.round(materialsEarned * 0.5 + wave * 3);
    MetaProgress.addGenePoints(geneEarned);

    const bg = this.scene.add.rectangle(W / 2, H / 2, 480, 420, 0x000000, 0.88).setOrigin(0.5);
    this.scene.add.text(W / 2, H / 2 - 190, "🏆 恭喜通关! 🏆", { fontSize: "32px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    this.scene.add.text(W / 2, H / 2 - 150, `波次 ${wave} · 等级 ${level}`, { fontSize: "18px", color: "#4f4" }).setOrigin(0.5);

    const stats = [
      `击杀: ${kills}`,
      `BOSS 击杀: ${bossKills}`,
      `最多同时在场: ${peakAlive}`,
      `材料收入: ${materialsEarned}`,
      `+${geneEarned} 基因点 (总 ${MetaProgress.genePoints})`,
    ];
    stats.forEach((s, i) => {
      this.scene.add.text(W / 2, H / 2 - 100 + i * 30, s, { fontSize: "15px", color: "#aaa" }).setOrigin(0.5);
    });

    const menuBtn = this.scene.add.rectangle(W / 2 - 80, H / 2 + 120, 140, 40, 0x444488).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x6666aa);
    this.scene.add.text(W / 2 - 80, H / 2 + 120, "返回主菜单", { fontSize: "14px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    menuBtn.on("pointerover", () => menuBtn.setFillStyle(0x5555aa));
    menuBtn.on("pointerout", () => menuBtn.setFillStyle(0x444488));
    menuBtn.on("pointerdown", onMenu);

    const againBtn = this.scene.add.rectangle(W / 2 + 80, H / 2 + 120, 140, 40, 0x44aa44).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x66cc66);
    this.scene.add.text(W / 2 + 80, H / 2 + 120, "再来一局", { fontSize: "14px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    againBtn.on("pointerover", () => againBtn.setFillStyle(0x55cc55));
    againBtn.on("pointerout", () => againBtn.setFillStyle(0x44aa44));
    againBtn.on("pointerdown", onRestart);
  }
}
