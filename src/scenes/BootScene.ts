import Phaser from "phaser";
import { W, H } from "../types";
import { AudioManager } from "../utils/AudioManager";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    const cx = W / 2, cy = H / 2;
    const barW = 300, barH = 20;
    const bg = this.add.rectangle(cx, cy, barW, barH, 0x333333).setOrigin(0.5);
    const fill = this.add.rectangle(cx - barW / 2, cy, 0, barH, 0x44aaff).setOrigin(0, 0.5);
    const txt = this.add.text(cx, cy - 30, "加载中...", { fontSize: "16px", color: "#fff" }).setOrigin(0.5);

    this.load.on("progress", (v: number) => { fill.width = barW * v; });
    this.load.on("complete", () => { bg.destroy(); fill.destroy(); txt.destroy(); });

    const assetKeys = ["zombie_normal", "zombie_fast", "zombie_tank", "zombie_ranged",
      "zombie_boss1", "zombie_boss2", "skeleton_normal", "skeleton_other"];
    for (const key of assetKeys) this.load.image(key, `assets/${key}.png`);

    const playerIds = ["merc", "spec", "sniper", "fireman", "lucky", "tank", "berserker"];
    for (const id of playerIds) this.load.image(`player_${id}`, `assets/player_${id}.png`);
  }

  create() {
    AudioManager.applySettings();
    this.generateBulletTextures();
    this.scene.start("TitleScene");
  }

  private generateBulletTextures() {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffff00);
    g.fillRect(0, 0, 4, 4);
    g.fillRect(1, 4, 2, 4);
    g.generateTexture("bullet", 4, 8);
    g.destroy();

    const eb = this.make.graphics({ x: 0, y: 0 }, false);
    eb.fillStyle(0xff4444);
    eb.fillRect(0, 0, 3, 3);
    eb.generateTexture("enemyBullet", 3, 3);
    eb.destroy();

    const pt = this.make.graphics({ x: 0, y: 0 }, false);
    pt.fillStyle(0xffaa00);
    pt.fillRect(0, 0, 3, 3);
    pt.generateTexture("particle", 3, 3);
    pt.destroy();

    const mg = this.make.graphics({ x: 0, y: 0 }, false);
    mg.fillStyle(0x00ff88);
    mg.fillRect(3, 0, 2, 2);
    mg.fillRect(1, 2, 6, 4);
    mg.fillRect(2, 4, 4, 4);
    mg.fillRect(3, 8, 2, 2);
    mg.generateTexture("material", 8, 10);
    mg.destroy();

    const xp = this.make.graphics({ x: 0, y: 0 }, false);
    xp.fillStyle(0x44ff44);
    xp.fillCircle(4, 4, 4);
    xp.generateTexture("xp_orb", 8, 8);
    xp.destroy();

    const ch = this.make.graphics({ x: 0, y: 0 }, false);
    ch.fillStyle(0xff4444);
    ch.fillRect(2, 0, 8, 4);
    ch.fillRect(0, 4, 12, 6);
    ch.fillRect(2, 10, 8, 2);
    ch.generateTexture("enemy_charger", 12, 12);
    ch.destroy();

    const ex = this.make.graphics({ x: 0, y: 0 }, false);
    ex.fillStyle(0xff8800);
    ex.fillCircle(5, 5, 5);
    ex.fillStyle(0xffcc00);
    ex.fillCircle(5, 5, 3);
    ex.generateTexture("enemy_exploder", 10, 10);
    ex.destroy();

    const laser = this.make.graphics({ x: 0, y: 0 }, false);
    laser.fillStyle(0x44aaff);
    laser.fillRect(0, 1, 12, 2);
    laser.fillRect(2, 0, 8, 4);
    laser.generateTexture("bullet_laser", 12, 4);
    laser.destroy();

    const ice = this.make.graphics({ x: 0, y: 0 }, false);
    ice.fillStyle(0x88ddff);
    ice.fillCircle(4, 4, 4);
    ice.fillStyle(0xffffff, 0.6);
    ice.fillCircle(4, 4, 2);
    ice.generateTexture("bullet_freeze", 8, 8);
    ice.destroy();
  }
}
