import Phaser from "phaser";
import { PlayerStats, Weapon, Power, W, H, MAX_POWERS } from "../types";

export class HUD {
  private hpText: Phaser.GameObjects.Text;
  private matText: Phaser.GameObjects.Text;
  private weaponText: Phaser.GameObjects.Text;
  private weapon2Text: Phaser.GameObjects.Text;
  private waveText: Phaser.GameObjects.Text;
  private timerText: Phaser.GameObjects.Text;
  private announceText: Phaser.GameObjects.Text;
  private xpBarBg: Phaser.GameObjects.Rectangle;
  private xpBarFill: Phaser.GameObjects.Rectangle;
  private levelText: Phaser.GameObjects.Text;
  private grenadeText: Phaser.GameObjects.Text;
  private enemyCountText: Phaser.GameObjects.Text;
  private waveProgressBg: Phaser.GameObjects.Rectangle;
  private waveProgressFill: Phaser.GameObjects.Rectangle;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossHpBg!: Phaser.GameObjects.Rectangle;
  private bossHpFill!: Phaser.GameObjects.Rectangle;
  private abilityText: Phaser.GameObjects.Text;
  private powerTexts: Phaser.GameObjects.Text[] = [];
  private scene: Phaser.Scene;
  private currentXpScale = 0;
  private buffContainer: Phaser.GameObjects.Container;
  private buffItems: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;

    this.hpText = scene.add.text(10, 10, "", { fontSize: "16px", color: "#fff" });
    this.matText = scene.add.text(10, 28, "", { fontSize: "14px", color: "#ff0" });
    this.weaponText = scene.add.text(10, 46, "", { fontSize: "12px", color: "#aaa" }).setDepth(20);
    this.weapon2Text = scene.add.text(10, 60, "", { fontSize: "11px", color: "#666" }).setDepth(20);
    this.grenadeText = scene.add.text(W - 10, 34, "", { fontSize: "13px", color: "#4f4" }).setOrigin(1, 0);
    this.xpBarBg = scene.add.rectangle(10, 88, 150, 8, 0x333333).setOrigin(0, 0.5);
    this.xpBarFill = scene.add.rectangle(10, 88, 150, 8, 0x44aaff).setOrigin(0, 0.5);
    this.levelText = scene.add.text(10, 74, "", { fontSize: "11px", color: "#8cf" }).setOrigin(0, 0.5);
    this.waveText = scene.add.text(W - 10, 10, "", { fontSize: "16px", color: "#fff" }).setOrigin(1, 0);
    this.timerText = scene.add.text(W / 2, 10, "", { fontSize: "18px", color: "#ff0" }).setOrigin(0.5, 0);
    this.enemyCountText = scene.add.text(W / 2, 30, "", { fontSize: "13px", color: "#f88" }).setOrigin(0.5, 0);
    this.waveProgressBg = scene.add.rectangle(W / 2, 48, 300, 6, 0x333333).setOrigin(0.5).setDepth(1);
    this.waveProgressFill = scene.add.rectangle(W / 2 - 150, 48, 300, 6, 0x44aaff).setOrigin(0, 0.5).setDepth(2);
    this.announceText = scene.add.text(W / 2, H / 2 - 40, "", { fontSize: "40px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5).setAlpha(0).setDepth(50);

    this.bossNameText = scene.add.text(W / 2, 100, "", { fontSize: "20px", color: "#f44", fontStyle: "bold" }).setOrigin(0.5).setDepth(25).setVisible(false);
    this.bossHpBg = scene.add.rectangle(W / 2, 120, 400, 14, 0x333333).setOrigin(0.5).setDepth(25).setVisible(false);
    this.bossHpFill = scene.add.rectangle(W / 2 - 200, 120, 400, 14, 0xff3333).setOrigin(0, 0.5).setDepth(26).setVisible(false);
    this.abilityText = scene.add.text(W - 10, 60, "", { fontSize: "12px", color: "#f88" }).setOrigin(1, 0);

    for (let i = 0; i < MAX_POWERS; i++) {
      const t = scene.add.text(W - 10, 78 + i * 16, "", { fontSize: "11px", color: "#f4f" }).setOrigin(1, 0);
      this.powerTexts.push(t);
    }

    this.buffContainer = scene.add.container(0, 0).setDepth(20);
  }

  destroy() {
    this.hpText.destroy();
    this.matText.destroy();
    this.weaponText.destroy();
    this.weapon2Text.destroy();
    this.waveText.destroy();
    this.timerText.destroy();
    this.announceText.destroy();
    this.xpBarBg.destroy();
    this.xpBarFill.destroy();
    this.levelText.destroy();
    this.grenadeText.destroy();
    this.enemyCountText.destroy();
    this.waveProgressBg.destroy();
    this.waveProgressFill.destroy();
    this.bossNameText.destroy();
    this.bossHpBg.destroy();
    this.bossHpFill.destroy();
    this.abilityText.destroy();
    for (const t of this.powerTexts) t.destroy();
    this.powerTexts = [];
    this.buffContainer.destroy();
  }

  update(stats: PlayerStats, weapons: Weapon[], activeIdx: number, reloading: boolean, wave: number, waveTimer: number, bossPhase = false, grenadeCount = 0, grenadeCooldown = 0, enemyCount = 0, waveDuration = 30000, abilityCd = 0, powers?: (Power | null)[], powerCds?: number[], powerActive?: boolean[], buffs?: { label: string; color: number }[]) {
    this.hpText.setText(`HP: ${stats.hp}/${stats.maxHp}`);
    this.matText.setText(`材料: ${stats.materials}`);

    const w = weapons[activeIdx];
    if (w) {
      if (reloading) {
        this.weaponText.setText(`★ ${w.name}  换弹中...`);
      } else if (w.weaponType === "melee") {
        this.weaponText.setText(`★ ${w.name}  近战`);
      } else {
        this.weaponText.setText(`★ ${w.name}  ${w.ammo}/${w.ammoMax}`);
      }
    }
    const w2 = weapons.length > 1 ? weapons[1 - activeIdx] : null;
    if (w2) {
      const w2Reloading = w2.reloading;
      if (w2Reloading) {
        this.weapon2Text.setText(`  ${w2.name}  换弹中`);
      } else if (w2.weaponType === "melee") {
        this.weapon2Text.setText(`  ${w2.name}  近战`);
      } else {
        this.weapon2Text.setText(`  ${w2.name}  ${w2.ammo}/${w2.ammoMax}`);
      }
      this.weapon2Text.setVisible(true);
    } else {
      this.weapon2Text.setVisible(false);
    }

    this.waveText.setText(`波次: ${wave}`);
    this.enemyCountText.setText(`剩余: ${enemyCount}`);
    if (bossPhase) {
      this.timerText.setText("BOSS");
      this.waveProgressFill.setFillStyle(0xff3333);
    } else {
      const secs = Math.ceil(waveTimer / 1000);
      this.timerText.setText(`${secs}s`);
      this.waveProgressFill.setFillStyle(0x44aaff);
    }
    const progress = waveDuration > 0 ? Math.max(0, waveTimer / waveDuration) : 0;
    this.waveProgressFill.setScale(progress, 1);

    const targetXpScale = Math.min(1, stats.xp / stats.xpToNext);
    this.currentXpScale += (targetXpScale - this.currentXpScale) * 0.15;
    if (Math.abs(this.currentXpScale - targetXpScale) < 0.001) this.currentXpScale = targetXpScale;
    this.xpBarFill.setScale(this.currentXpScale, 1);
    this.levelText.setText(`Lv.${stats.level}`);

    const cdSecs = Math.ceil(grenadeCooldown / 1000);
    this.grenadeText.setText(grenadeCount > 0 ? `💣 ×${grenadeCount}` : cdSecs > 0 ? `💣 ${cdSecs}s` : "💣 ×0");
    this.grenadeText.setColor(grenadeCount > 0 ? "#4f4" : "#666");

    const abilityCdSecs = Math.ceil(abilityCd / 1000);
    this.abilityText.setText(abilityCd > 0 ? `技能: ${abilityCdSecs}s` : "技能: 就绪 [F]");
    this.abilityText.setColor(abilityCd > 0 ? "#666" : "#f88");

    if (powers && powerCds && powerActive) {
      for (let i = 0; i < MAX_POWERS; i++) {
        const p = powers[i];
        const cd = powerCds[i];
        const active = powerActive[i];
        if (p) {
          const secs = Math.ceil(cd / 1000);
          if (active) {
            this.powerTexts[i].setText(`${p.name} ⚡`);
            this.powerTexts[i].setColor("#4f4");
          } else if (cd > 0) {
            this.powerTexts[i].setText(`${p.name} ${secs}s`);
            this.powerTexts[i].setColor("#666");
          } else {
            this.powerTexts[i].setText(`${p.name} 就绪 [${i + 1}]`);
            this.powerTexts[i].setColor("#f4f");
          }
        } else {
          this.powerTexts[i].setText(`空 [${i + 1}]`);
          this.powerTexts[i].setColor("#444");
        }
      }
    }

    this.buffContainer.removeAll(true);
    this.buffItems = [];
    if (buffs && buffs.length > 0) {
      const startX = 10;
      const startY = 108;
      const iconW = 60;
      const iconH = 20;
      const gap = 4;
      buffs.forEach((buff, i) => {
        const x = startX + i * (iconW + gap) + iconW / 2;
        const g = this.scene.add.graphics();
        g.fillStyle(buff.color, 0.25);
        g.fillRoundedRect(x - iconW / 2, startY, iconW, iconH, 4);
        g.lineStyle(1, buff.color, 0.8);
        g.strokeRoundedRect(x - iconW / 2, startY, iconW, iconH, 4);
        this.buffContainer.add(g);
        this.buffItems.push(g);
        const t = this.scene.add.text(x, startY + iconH / 2, buff.label, {
          fontSize: "10px", color: "#fff", fontStyle: "bold",
        }).setOrigin(0.5);
        this.buffContainer.add(t);
        this.buffItems.push(t);
      });
    }
  }

  showBossHP(name: string, hp: number, maxHp: number) {
    this.bossNameText.setText(name).setVisible(true);
    this.bossHpBg.setVisible(true);
    this.bossHpFill.setVisible(true);
    const pct = Math.max(0, hp / maxHp);
    this.bossHpFill.setScale(pct, 1);
  }

  hideBossHP() {
    this.bossNameText.setVisible(false);
    this.bossHpBg.setVisible(false);
    this.bossHpFill.setVisible(false);
  }

  announce(text: string) {
    this.announceText.setText(text);
    this.announceText.setAlpha(1);
    this.announceText.y = H / 2 - 40;
    this.scene.tweens.add({
      targets: this.announceText,
      alpha: 0,
      y: H / 2 - 60,
      duration: 1500,
      ease: "Power2",
      onComplete: () => { this.announceText.y = H / 2 - 40; },
    });
  }
}
