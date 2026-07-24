import Phaser from "phaser";
import { W, H } from "../types";

export class GameOverUI {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(wave: number, level: number, kills: number, bossKills: number, peakAlive: number, materialsEarned: number, onRestart: () => void, onMenu: () => void) {
    const bg = this.scene.add.rectangle(W / 2, H / 2, 460, 360, 0x000000, 0.88).setOrigin(0.5);
    this.scene.add.text(W / 2, H / 2 - 160, "游戏结束", { fontSize: "36px", color: "#f44", fontStyle: "bold" }).setOrigin(0.5);
    this.scene.add.text(W / 2, H / 2 - 120, `波次 ${wave} · 等级 ${level}`, { fontSize: "18px", color: "#ff0" }).setOrigin(0.5);

    const stats = [
      `击杀: ${kills}`,
      `BOSS 击杀: ${bossKills}`,
      `最多同时在场: ${peakAlive}`,
      `材料收入: ${materialsEarned}`,
    ];
    stats.forEach((s, i) => {
      this.scene.add.text(W / 2, H / 2 - 70 + i * 28, s, { fontSize: "15px", color: "#aaa" }).setOrigin(0.5);
    });

    const againBtn = this.scene.add.rectangle(W / 2 - 80, H / 2 + 100, 140, 40, 0x44aa44).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x66cc66);
    this.scene.add.text(W / 2 - 80, H / 2 + 100, "再来一局", { fontSize: "14px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    againBtn.on("pointerover", () => againBtn.setFillStyle(0x55cc55));
    againBtn.on("pointerout", () => againBtn.setFillStyle(0x44aa44));
    againBtn.on("pointerdown", onRestart);

    const menuBtn = this.scene.add.rectangle(W / 2 + 80, H / 2 + 100, 140, 40, 0x444488).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x6666aa);
    this.scene.add.text(W / 2 + 80, H / 2 + 100, "返回主菜单", { fontSize: "14px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    menuBtn.on("pointerover", () => menuBtn.setFillStyle(0x5555aa));
    menuBtn.on("pointerout", () => menuBtn.setFillStyle(0x444488));
    menuBtn.on("pointerdown", onMenu);
  }
}
