import Phaser from "phaser";
import { W, H } from "../types";
import { Settings } from "../utils/Settings";
import { AudioManager } from "../utils/AudioManager";

export class SettingsUI {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container | null = null;
  private bgmSlider!: Phaser.GameObjects.Rectangle;
  private bgmFill!: Phaser.GameObjects.Rectangle;
  private bgmKnob!: Phaser.GameObjects.Container;
  private sfxSlider!: Phaser.GameObjects.Rectangle;
  private sfxFill!: Phaser.GameObjects.Rectangle;
  private sfxKnob!: Phaser.GameObjects.Container;
  private shakeText!: Phaser.GameObjects.Text;
  private visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(onClose?: () => void) {
    if (this.visible) return;
    this.visible = true;

    this.container = this.scene.add.container(0, 0).setDepth(300);
    const children: Phaser.GameObjects.GameObject[] = [];

    const bg = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive();
    const panel = this.scene.add.rectangle(W / 2, H / 2, 400, 340, 0x222244, 0.95).setStrokeStyle(2, 0x6666aa);
    const title = this.scene.add.text(W / 2, H / 2 - 140, "设置", { fontSize: "24px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    children.push(bg, panel, title);

    const sliderW = 220;

    const bgmLabel = this.scene.add.text(W / 2 - 150, H / 2 - 80, "BGM 音量", { fontSize: "14px", color: "#aaa" });
    this.bgmSlider = this.scene.add.rectangle(W / 2 + 30, H / 2 - 75, sliderW, 8, 0x555555).setOrigin(0, 0.5);
    this.bgmFill = this.scene.add.rectangle(W / 2 + 30, H / 2 - 75, sliderW * Settings.bgmVolume, 8, 0x44aaff).setOrigin(0, 0.5);
    const bgmBg = this.scene.add.rectangle(W / 2 + 30, H / 2 - 75, sliderW, 20, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    this.bgmKnob = this.scene.add.container(0, 0);
    const knob1 = this.scene.add.circle(0, 0, 8, 0xffffff).setStrokeStyle(2, 0x44aaff);
    this.bgmKnob.add(knob1);
    this.bgmKnob.setPosition(W / 2 + 30 + sliderW * Settings.bgmVolume, H / 2 - 75);
    children.push(bgmLabel, this.bgmSlider, this.bgmFill, bgmBg, this.bgmKnob);

    bgmBg.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const v = Math.max(0, Math.min(1, (p.x - (W / 2 + 30)) / sliderW));
      Settings.bgmVolume = v;
      if (this.bgmFill) this.bgmFill.setScale(v, 1);
      this.bgmKnob.setPosition(W / 2 + 30 + sliderW * v, H / 2 - 75);
      AudioManager.setBgmVolume(v);
      if (v > 0) AudioManager.startBGM(); else AudioManager.stopBGM();
    });

    const sfxLabel = this.scene.add.text(W / 2 - 150, H / 2 - 30, "SFX 音量", { fontSize: "14px", color: "#aaa" });
    this.sfxSlider = this.scene.add.rectangle(W / 2 + 30, H / 2 - 25, sliderW, 8, 0x555555).setOrigin(0, 0.5);
    this.sfxFill = this.scene.add.rectangle(W / 2 + 30, H / 2 - 25, sliderW * Settings.sfxVolume, 8, 0x44aaff).setOrigin(0, 0.5);
    const sfxBg = this.scene.add.rectangle(W / 2 + 30, H / 2 - 25, sliderW, 20, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    this.sfxKnob = this.scene.add.container(0, 0);
    const knob2 = this.scene.add.circle(0, 0, 8, 0xffffff).setStrokeStyle(2, 0x44aaff);
    this.sfxKnob.add(knob2);
    this.sfxKnob.setPosition(W / 2 + 30 + sliderW * Settings.sfxVolume, H / 2 - 25);
    children.push(sfxLabel, this.sfxSlider, this.sfxFill, sfxBg, this.sfxKnob);

    sfxBg.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const v = Math.max(0, Math.min(1, (p.x - (W / 2 + 30)) / sliderW));
      Settings.sfxVolume = v;
      if (this.sfxFill) this.sfxFill.setScale(v, 1);
      this.sfxKnob.setPosition(W / 2 + 30 + sliderW * v, H / 2 - 25);
      AudioManager.setSfxVolume(v);
      if (v > 0) AudioManager.shoot();
    });

    const shakeLabel = this.scene.add.text(W / 2 - 150, H / 2 + 20, "屏幕震动", { fontSize: "14px", color: "#aaa" });
    this.shakeText = this.scene.add.text(W / 2 + 120, H / 2 + 20, Settings.screenShake ? "开" : "关", {
      fontSize: "14px", color: Settings.screenShake ? "#4f4" : "#f44", fontStyle: "bold",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const shakeBg = this.scene.add.rectangle(W / 2 + 30, H / 2 + 20, sliderW, 30, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    children.push(shakeLabel, this.shakeText, shakeBg);

    const toggleShake = () => {
      Settings.screenShake = !Settings.screenShake;
      this.shakeText.setText(Settings.screenShake ? "开" : "关");
      this.shakeText.setColor(Settings.screenShake ? "#4f4" : "#f44");
    };
    shakeBg.on("pointerdown", toggleShake);
    this.shakeText.on("pointerdown", toggleShake);

    const closeBtn = this.scene.add.rectangle(W / 2, H / 2 + 80, 160, 36, 0x444488).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x6666aa);
    const closeLabel = this.scene.add.text(W / 2, H / 2 + 80, "关闭", { fontSize: "16px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    closeBtn.on("pointerover", () => closeBtn.setFillStyle(0x5555aa));
    closeBtn.on("pointerout", () => closeBtn.setFillStyle(0x444488));
    closeBtn.on("pointerdown", () => { this.hide(); if (onClose) onClose(); });
    children.push(closeBtn, closeLabel);

    this.container.add(children);
  }

  hide() {
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.visible = false;
  }

  get isVisible(): boolean { return this.visible; }
}
