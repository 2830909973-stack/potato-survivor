import Phaser from "phaser";
import { PlayerStats, Weapon, Power, W, H, MAX_POWERS } from "../types";

export interface HUDCallbacks {
  onUseAbility: () => void;
  onUsePower: (slot: number) => void;
}

const BG = 0x141432;
const BD = 0x333366;
const WHITE = "#ffffff";
const GOLD = "#ffcc00";
const GRAY = "#aaa";
const DIM = "#666";
const RED = "#ff2222";
const HP_GRAD_W = 188;
const HP_GRAD_H = 12;
const BOSS_BAR_W = 400;

export class HUDManager {
  private scene: Phaser.Scene;
  private callbacks: HUDCallbacks;

  private cTopLeft!: Phaser.GameObjects.Container;
  private hpText!: Phaser.GameObjects.Text;
  private hpFillImg!: Phaser.GameObjects.Image;
  private waveText!: Phaser.GameObjects.Text;
  private matText!: Phaser.GameObjects.Text;
  private displayHp = 1;
  private maxHp = 1;
  private hpFlashing = false;
  private hpFlashTween: Phaser.Tweens.Tween | null = null;
  private levelText!: Phaser.GameObjects.Text;
  private xpBarBg!: Phaser.GameObjects.Graphics;
  private xpBarFill!: Phaser.GameObjects.Rectangle;
  private currentXpScale = 0;

  private cTopRight!: Phaser.GameObjects.Container;
  private enemyCountText!: Phaser.GameObjects.Text;

  private cBottom!: Phaser.GameObjects.Container;
  private weaponNameText!: Phaser.GameObjects.Text;
  private weaponAmmoText!: Phaser.GameObjects.Text;
  private ammoFlashTween: Phaser.Tweens.Tween | null = null;
  private grenadeText!: Phaser.GameObjects.Text;

  private powerGfx: Phaser.GameObjects.Graphics[] = [];
  private powerTexts: Phaser.GameObjects.Text[] = [];
  private powerCtTexts: Phaser.GameObjects.Text[] = [];
  private powerZones: Phaser.GameObjects.Zone[] = [];

  private abilityGfx!: Phaser.GameObjects.Graphics;
  private abilityText!: Phaser.GameObjects.Text;
  private abilityCtText!: Phaser.GameObjects.Text;
  private abilityZone!: Phaser.GameObjects.Zone;

  private cBoss!: Phaser.GameObjects.Container;
  private bossNameText!: Phaser.GameObjects.Text;
  private bossHpFillImg!: Phaser.GameObjects.Image;

  private announceText!: Phaser.GameObjects.Text;

  private buffContainer!: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, callbacks: HUDCallbacks) {
    this.scene = scene;
    this.callbacks = callbacks;

    this.ensureGradient("hp_grad", HP_GRAD_W, HP_GRAD_H, "#ff4444", "#ff8844");
    this.ensureGradient("boss_hp_grad", BOSS_BAR_W, 14, "#ff2222", "#ff6644");

    this.buildTopLeft();
    this.buildTopRight();
    this.buildBottomBar();
    this.buildBossPanel();
    this.buildAnnounce();
    this.buildBuffContainer();
  }

  private ensureGradient(key: string, w: number, h: number, c1: string, c2: string) {
    if (this.scene.textures.exists(key)) return;
    const ct = this.scene.textures.createCanvas(key, w, h);
    if (!ct) return;
    const ctx = ct.getContext();
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, c1);
    g.addColorStop(1, c2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    ct.refresh();
  }

  private frostedCard(x: number, y: number, w: number, h: number, r = 12): Phaser.GameObjects.Container {
    const c = this.scene.add.container(0, 0).setDepth(50);
    const g = this.scene.add.graphics();
    g.fillStyle(BG, 0.85);
    g.fillRoundedRect(x, y, w, h, r);
    g.lineStyle(1, BD, 0.4);
    g.strokeRoundedRect(x, y, w, h, r);
    c.add(g);
    return c;
  }

  private shadowed(text: Phaser.GameObjects.Text): Phaser.GameObjects.Text {
    return text.setShadow(2, 2, "rgba(0,0,0,0.6)", 2);
  }

  private buildTopLeft() {
    const cx = 16, cy = 16, cw = 228, ch = 106;
    this.cTopLeft = this.frostedCard(cx, cy, cw, ch, 12);

    const lx = cx + 20;

    this.hpText = this.shadowed(this.scene.add.text(lx, cy + 18, "❤️ HP  0/0", {
      fontSize: "14px", color: WHITE, fontFamily: "Arial,sans-serif",
    }).setDepth(51));
    this.cTopLeft.add(this.hpText);

    const barBg = this.scene.add.graphics().setDepth(51);
    barBg.fillStyle(0x222244, 1);
    barBg.fillRoundedRect(lx, cy + 38, HP_GRAD_W, HP_GRAD_H, 4);
    this.cTopLeft.add(barBg);

    this.hpFillImg = this.scene.add.image(lx, cy + 38, "hp_grad").setOrigin(0).setDepth(52);
    this.hpFillImg.setDisplaySize(HP_GRAD_W, HP_GRAD_H);
    this.cTopLeft.add(this.hpFillImg);

    this.waveText = this.shadowed(this.scene.add.text(lx, cy + 58, "🌊 波次: 1", {
      fontSize: "13px", color: GRAY, fontFamily: "Arial,sans-serif",
    }).setDepth(51));
    this.cTopLeft.add(this.waveText);

    this.matText = this.shadowed(this.scene.add.text(cx + cw - 20, cy + 58, "💰 0", {
      fontSize: "13px", color: GOLD, fontFamily: "Arial,sans-serif",
    }).setOrigin(1, 0).setDepth(51));
    this.cTopLeft.add(this.matText);

    this.xpBarBg = this.scene.add.graphics().setDepth(51);
    this.xpBarBg.fillStyle(0x222244, 1);
    this.xpBarBg.fillRoundedRect(lx, cy + 80, HP_GRAD_W, 8, 3);
    this.cTopLeft.add(this.xpBarBg);

    this.xpBarFill = this.scene.add.rectangle(lx, cy + 80 + 4, HP_GRAD_W, 8, 0x44aaff)
      .setOrigin(0, 0.5).setDepth(52);
    this.cTopLeft.add(this.xpBarFill);

    this.levelText = this.shadowed(this.scene.add.text(lx + HP_GRAD_W + 8, cy + 80, "Lv.1", {
      fontSize: "11px", color: "#8cf", fontFamily: "Arial,sans-serif",
    }).setDepth(51));
    this.cTopLeft.add(this.levelText);
  }

  private buildTopRight() {
    const cw = 170, ch = 52;
    const cx = W - 16 - cw, cy = 16;
    this.cTopRight = this.frostedCard(cx, cy, cw, ch, 12);

    this.enemyCountText = this.shadowed(this.scene.add.text(cx + cw / 2, cy + ch / 2, "👾 剩余: 0", {
      fontSize: "16px", color: WHITE, fontFamily: "Arial,sans-serif", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(51));
    this.cTopRight.add(this.enemyCountText);
  }

  private buildBottomBar() {
    const bw = 500, bh = 60;
    const bx = (W - bw) / 2, by = H - 10 - bh;
    this.cBottom = this.frostedCard(bx, by, bw, bh, 16);

    const ly = by + 14;

    this.weaponNameText = this.shadowed(this.scene.add.text(bx + 18, ly, "★ 武器", {
      fontSize: "14px", color: GOLD, fontFamily: "Arial,sans-serif", fontStyle: "bold",
    }).setDepth(51));
    this.cBottom.add(this.weaponNameText);

    this.weaponAmmoText = this.shadowed(this.scene.add.text(bx + 18, ly + 20, "0/0", {
      fontSize: "14px", color: WHITE, fontFamily: "Arial,sans-serif", fontStyle: "bold",
    }).setDepth(51));
    this.cBottom.add(this.weaponAmmoText);

    this.grenadeText = this.shadowed(this.scene.add.text(bx + bw - 18, by + 10, "💣 0", {
      fontSize: "12px", color: DIM, fontFamily: "Arial,sans-serif",
    }).setOrigin(1, 0).setDepth(51));
    this.cBottom.add(this.grenadeText);

    const skillCenterX = bx + 230;
    const skillY = by + 30;
    const skillRadius = 18;
    const gap = 44;

    for (let i = 0; i < MAX_POWERS; i++) {
      const cx = skillCenterX - gap / 2 + i * gap;
      const gfx = this.scene.add.graphics().setDepth(52);
      this.cBottom.add(gfx);
      this.powerGfx.push(gfx);

      const ct = this.scene.add.text(cx, skillY - 4, "?", {
        fontSize: "8px", color: WHITE, fontFamily: "Arial,sans-serif", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(53);
      this.cBottom.add(ct);
      this.powerTexts.push(ct);

      const cdt = this.scene.add.text(cx, skillY + 2, "", {
        fontSize: "11px", color: GRAY, fontFamily: "Arial,sans-serif", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(53);
      this.cBottom.add(cdt);
      this.powerCtTexts.push(cdt);

      const z = this.scene.add.zone(cx, skillY, skillRadius * 2, skillRadius * 2).setDepth(54);
      z.setInteractive(new Phaser.Geom.Circle(0, 0, skillRadius), Phaser.Geom.Circle.Contains);
      z.on("pointerdown", () => this.callbacks.onUsePower(i));
      this.cBottom.add(z);
      this.powerZones.push(z);
    }

    const acx = skillCenterX + gap;
    const aGfx = this.scene.add.graphics().setDepth(52);
    this.cBottom.add(aGfx);
    this.abilityGfx = aGfx;

    this.abilityText = this.scene.add.text(acx, skillY - 4, "⚡", {
      fontSize: "14px", color: WHITE, fontFamily: "Arial,sans-serif",
    }).setOrigin(0.5).setDepth(53);
    this.cBottom.add(this.abilityText);

    this.abilityCtText = this.scene.add.text(acx, skillY + 2, "", {
      fontSize: "11px", color: GRAY, fontFamily: "Arial,sans-serif", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(53);
    this.cBottom.add(this.abilityCtText);

    const aZone = this.scene.add.zone(acx, skillY, skillRadius * 2, skillRadius * 2).setDepth(54);
    aZone.setInteractive(new Phaser.Geom.Circle(0, 0, skillRadius), Phaser.Geom.Circle.Contains);
    aZone.on("pointerdown", () => this.callbacks.onUseAbility());
    this.cBottom.add(aZone);
    this.abilityZone = aZone;
  }

  private buildBossPanel() {
    this.cBoss = this.scene.add.container(0, 0).setDepth(55).setVisible(false);

    this.bossNameText = this.shadowed(this.scene.add.text(W / 2, 58, "BOSS", {
      fontSize: "18px", color: "#f44", fontFamily: "Arial,sans-serif", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(56));
    this.cBoss.add(this.bossNameText);

    const bg = this.scene.add.graphics().setDepth(56);
    bg.fillStyle(0x222244, 1);
    bg.fillRoundedRect(W / 2 - BOSS_BAR_W / 2, 76, BOSS_BAR_W, 14, 5);
    this.cBoss.add(bg);

    this.bossHpFillImg = this.scene.add.image(W / 2 - BOSS_BAR_W / 2, 76, "boss_hp_grad")
      .setOrigin(0).setDepth(57);
    this.bossHpFillImg.setDisplaySize(BOSS_BAR_W, 14);
    this.cBoss.add(this.bossHpFillImg);
  }

  private buildAnnounce() {
    this.announceText = this.scene.add.text(W / 2, H / 2 - 40, "", {
      fontSize: "36px", color: "#fff", fontFamily: "Arial,sans-serif", fontStyle: "bold",
      shadow: { offsetX: 3, offsetY: 3, color: "#000", blur: 6, fill: true },
    }).setOrigin(0.5).setAlpha(0).setDepth(200);
  }

  private buildBuffContainer() {
    this.buffContainer = this.scene.add.container(0, 0).setDepth(58);
  }

  update(
    stats: PlayerStats,
    weapons: Weapon[],
    activeIdx: number,
    reloading: boolean,
    wave: number,
    waveTimer: number,
    bossPhase: boolean,
    grenadeCount: number,
    grenadeCooldown: number,
    enemyCount: number,
    waveDuration: number,
    abilityCd: number,
    powers?: (Power | null)[],
    powerCds?: number[],
    powerActive?: boolean[],
    buffs?: { label: string; color: number }[],
  ) {
    this.updateHP(stats);
    this.updateWaveMat(stats, wave);
    this.updateXP(stats);
    this.updateEnemyCount(enemyCount);
    this.updateWeapon(weapons, activeIdx, reloading);
    this.updateGrenade(grenadeCount, grenadeCooldown);
    this.updatePowerCircles(powers, powerCds, powerActive);
    this.updateAbility(abilityCd);
    this.updateBuffs(buffs);
  }

  private updateHP(stats: PlayerStats) {
    this.maxHp = stats.maxHp;
    this.hpText.setText(`❤️ HP  ${stats.hp}/${stats.maxHp}`);

    const target = stats.hp / Math.max(1, stats.maxHp);
    this.displayHp += (target - this.displayHp) * 0.15;
    if (Math.abs(this.displayHp - target) < 0.001) this.displayHp = target;

    const cropW = Math.max(0, this.displayHp * HP_GRAD_W);
    this.hpFillImg.setCrop(0, 0, cropW, HP_GRAD_H);

    const low = target < 0.3;
    if (low && !this.hpFlashing) {
      this.hpFlashing = true;
      this.hpFlashTween = this.scene.tweens.add({
        targets: this.hpFillImg,
        alpha: 0.25,
        yoyo: true,
        repeat: -1,
        duration: 300,
      });
    } else if (!low && this.hpFlashing) {
      this.hpFlashing = false;
      if (this.hpFlashTween) { this.hpFlashTween.stop(); this.hpFlashTween = null; }
      this.hpFillImg.setAlpha(1);
    }
  }

  private updateWaveMat(stats: PlayerStats, wave: number) {
    this.waveText.setText(`🌊 波次: ${wave}`);
    this.matText.setText(`💰 ${stats.materials}`);
  }

  private updateXP(stats: PlayerStats) {
    const target = stats.xpToNext > 0 ? Math.min(1, stats.xp / stats.xpToNext) : 1;
    this.currentXpScale += (target - this.currentXpScale) * 0.15;
    if (Math.abs(this.currentXpScale - target) < 0.001) this.currentXpScale = target;
    this.xpBarFill.setScale(this.currentXpScale, 1);
    this.levelText.setText(`Lv.${stats.level}`);
  }

  private updateEnemyCount(count: number) {
    this.enemyCountText.setText(`👾 剩余: ${count}`);
  }

  private updateWeapon(weapons: Weapon[], idx: number, reloading: boolean) {
    const w = weapons[idx];
    if (w) {
      this.weaponNameText.setText(`★ ${w.name}`);
      if (reloading) {
        this.weaponAmmoText.setText("换弹中...");
        this.weaponAmmoText.setColor(GOLD);
        this.stopAmmoFlash();
      } else if (w.weaponType === "melee") {
        this.weaponAmmoText.setText("近战");
        this.weaponAmmoText.setColor(GRAY);
        this.stopAmmoFlash();
      } else {
        this.weaponAmmoText.setText(`${w.ammo}/${w.ammoMax}`);
        if (w.ammo <= 0) {
          this.weaponAmmoText.setColor(RED);
          this.startAmmoFlash();
        } else if (w.ammo <= 5) {
          this.weaponAmmoText.setColor("#ffaa00");
          this.stopAmmoFlash();
        } else {
          this.weaponAmmoText.setColor(WHITE);
          this.stopAmmoFlash();
        }
      }
    }
  }

  private startAmmoFlash() {
    if (this.ammoFlashTween) return;
    this.ammoFlashTween = this.scene.tweens.add({
      targets: this.weaponAmmoText,
      alpha: 0.3,
      yoyo: true,
      repeat: -1,
      duration: 250,
    });
  }

  private stopAmmoFlash() {
    if (this.ammoFlashTween) {
      this.ammoFlashTween.stop();
      this.ammoFlashTween = null;
    }
    this.weaponAmmoText.setAlpha(1);
  }

  private updateGrenade(count: number, cd: number) {
    const cdSec = Math.ceil(cd / 1000);
    if (count > 0) {
      this.grenadeText.setText(`💣 ×${count}`);
      this.grenadeText.setColor("#4f4");
    } else if (cdSec > 0) {
      this.grenadeText.setText(`💣 ${cdSec}s`);
      this.grenadeText.setColor(DIM);
    } else {
      this.grenadeText.setText("💣 ×0");
      this.grenadeText.setColor(DIM);
    }
  }

  private drawSkillCircle(
    gfx: Phaser.GameObjects.Graphics,
    cx: number,
    cy: number,
    radius: number,
    cooldownRatio: number,
    active: boolean,
  ) {
    gfx.clear();
    const progress = Phaser.Math.Clamp(1 - cooldownRatio, 0, 1);

    gfx.lineStyle(2, 0x333355, 0.6);
    gfx.beginPath();
    gfx.arc(cx, cy, radius, 0, Math.PI * 2);
    gfx.strokePath();

    if (active) {
      gfx.lineStyle(3, 0x44ff44, 0.9);
      gfx.beginPath();
      gfx.arc(cx, cy, radius, -Math.PI / 2, Math.PI * 1.5);
      gfx.strokePath();
    } else if (progress > 0) {
      gfx.lineStyle(3, 0xffcc00, 0.85);
      gfx.beginPath();
      gfx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
      gfx.strokePath();
    }
  }

  private updatePowerCircles(powers?: (Power | null)[], powerCds?: number[], powerActive?: boolean[]) {
    const bx = (W - 500) / 2;
    const skillCenterX = bx + 230;
    const skillY = H - 10 - 60 + 30;
    const gap = 44;
    const radius = 18;

    for (let i = 0; i < MAX_POWERS; i++) {
      const cx = skillCenterX - gap / 2 + i * gap;
      const p = powers?.[i] ?? null;
      const cd = powerCds?.[i] ?? 0;
      const active = powerActive?.[i] ?? false;

      if (p) {
        this.powerTexts[i].setVisible(true);
        this.powerTexts[i].setText(p.name.charAt(0));
        this.powerTexts[i].setColor(active ? "#44ff44" : WHITE);
        this.powerCtTexts[i].setVisible(true);

        const maxCd = p.cooldown;
        const ratio = maxCd > 0 ? cd / maxCd : 0;
        this.drawSkillCircle(this.powerGfx[i], cx, skillY, radius, ratio, active);

        if (ratio > 0 && !active) {
          this.powerCtTexts[i].setText(`${Math.ceil(cd / 1000)}s`);
          this.powerCtTexts[i].setColor(GRAY);
        } else if (active) {
          this.powerCtTexts[i].setText("⚡");
          this.powerCtTexts[i].setColor("#44ff44");
        } else {
          this.powerCtTexts[i].setText("就绪");
          this.powerCtTexts[i].setColor(GOLD);
        }
      } else {
        this.powerTexts[i].setVisible(false);
        this.powerCtTexts[i].setVisible(false);
        this.powerGfx[i].clear();
      }
    }
  }

  private updateAbility(cd: number) {
    const bx = (W - 500) / 2;
    const skillCenterX = bx + 230;
    const skillY = H - 10 - 60 + 30;
    const acx = skillCenterX + 44;
    const radius = 18;

    const ratio = cd > 0 ? cd / 10000 : 0;
    this.drawSkillCircle(this.abilityGfx, acx, skillY, radius, ratio, false);

    if (cd > 0) {
      this.abilityCtText.setText(`${Math.ceil(cd / 1000)}s`);
      this.abilityCtText.setColor(GRAY);
      this.abilityCtText.setVisible(true);
      this.abilityText.setAlpha(0.4);
    } else {
      this.abilityCtText.setText("就绪");
      this.abilityCtText.setColor(GOLD);
      this.abilityCtText.setVisible(true);
      this.abilityText.setAlpha(1);
    }
  }

  private updateBuffs(buffs?: { label: string; color: number }[]) {
    this.buffContainer.removeAll(true);
    if (!buffs || buffs.length === 0) return;

    const startX = 16;
    const startY = 128;
    const iconW = 58;
    const iconH = 20;
    const gap = 4;

    buffs.forEach((buff, i) => {
      const x = startX + i * (iconW + gap) + iconW / 2;
      const g = this.scene.add.graphics();
      g.fillStyle(buff.color, 0.2);
      g.fillRoundedRect(x - iconW / 2, startY, iconW, iconH, 4);
      g.lineStyle(1, buff.color, 0.7);
      g.strokeRoundedRect(x - iconW / 2, startY, iconW, iconH, 4);
      this.buffContainer.add(g);

      const t = this.scene.add.text(x, startY + iconH / 2, buff.label, {
        fontSize: "10px", color: "#fff", fontFamily: "Arial,sans-serif", fontStyle: "bold",
      }).setOrigin(0.5);
      this.buffContainer.add(t);
    });
  }

  showBossHP(name: string, hp: number, maxHp: number) {
    this.cBoss.setVisible(true);
    this.bossNameText.setText(name);
    const pct = Math.max(0, hp / maxHp);
    this.bossHpFillImg.setCrop(0, 0, BOSS_BAR_W * pct, 14);
  }

  hideBossHP() {
    this.cBoss.setVisible(false);
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

  destroy() {
    if (this.hpFlashTween) { this.hpFlashTween.stop(); this.hpFlashTween = null; }
    if (this.ammoFlashTween) { this.ammoFlashTween.stop(); this.ammoFlashTween = null; }
    this.cTopLeft.destroy();
    this.cTopRight.destroy();
    this.cBottom.destroy();
    this.cBoss.destroy();
    this.announceText.destroy();
    this.buffContainer.destroy();
  }
}
