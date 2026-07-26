import Phaser from "phaser";
import { W, H } from "../types";
import { Settings, DEFAULT_KEY_BINDINGS } from "../utils/Settings";
import { AudioManager } from "../utils/AudioManager";

const KEY_LABELS: Record<string, string> = {
  switch: "切换武器", reload: "换弹", grenade: "手雷",
  ability: "技能", power1: "异能1", power2: "异能2", pause: "暂停",
};

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
  private waitingForBind: string | null = null;
  private bindTexts: Phaser.GameObjects.Text[] = [];
  private rebindHint: Phaser.GameObjects.Text | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  show(onClose?: () => void) {
    if (this.visible) return;
    this.visible = true;

    this.container = this.scene.add.container(0, 0).setDepth(300);
    const children: Phaser.GameObjects.GameObject[] = [];

    const bg = this.scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.7).setInteractive();
    const panel = this.scene.add.rectangle(W / 2, H / 2, 550, 480, 0x222244, 0.95).setStrokeStyle(2, 0x6666aa);
    const title = this.scene.add.text(W / 2, H / 2 - 220, "设置", { fontSize: "24px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    children.push(bg, panel, title);

    const sliderW = 150;

    const bgmLabel = this.scene.add.text(W / 2 - 230, H / 2 - 160, "BGM 音量", { fontSize: "14px", color: "#aaa" });
    this.bgmSlider = this.scene.add.rectangle(W / 2 - 60, H / 2 - 155, sliderW, 8, 0x555555).setOrigin(0, 0.5);
    this.bgmFill = this.scene.add.rectangle(W / 2 - 60, H / 2 - 155, sliderW * Settings.bgmVolume, 8, 0x44aaff).setOrigin(0, 0.5);
    const bgmBg = this.scene.add.rectangle(W / 2 - 60, H / 2 - 155, sliderW, 20, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    this.bgmKnob = this.scene.add.container(0, 0);
    const knob1 = this.scene.add.circle(0, 0, 8, 0xffffff).setStrokeStyle(2, 0x44aaff);
    this.bgmKnob.add(knob1);
    this.bgmKnob.setPosition(W / 2 - 60 + sliderW * Settings.bgmVolume, H / 2 - 155);
    children.push(bgmLabel, this.bgmSlider, this.bgmFill, bgmBg, this.bgmKnob);

    bgmBg.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const v = Math.max(0, Math.min(1, (p.x - (W / 2 - 60)) / sliderW));
      Settings.bgmVolume = v;
      if (this.bgmFill) this.bgmFill.setScale(v, 1);
      this.bgmKnob.setPosition(W / 2 - 60 + sliderW * v, H / 2 - 155);
      AudioManager.setBgmVolume(v);
      if (v > 0) AudioManager.startBGM(); else AudioManager.stopBGM();
    });

    const sfxLabel = this.scene.add.text(W / 2 - 230, H / 2 - 110, "SFX 音量", { fontSize: "14px", color: "#aaa" });
    this.sfxSlider = this.scene.add.rectangle(W / 2 - 60, H / 2 - 105, sliderW, 8, 0x555555).setOrigin(0, 0.5);
    this.sfxFill = this.scene.add.rectangle(W / 2 - 60, H / 2 - 105, sliderW * Settings.sfxVolume, 8, 0x44aaff).setOrigin(0, 0.5);
    const sfxBg = this.scene.add.rectangle(W / 2 - 60, H / 2 - 105, sliderW, 20, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    this.sfxKnob = this.scene.add.container(0, 0);
    const knob2 = this.scene.add.circle(0, 0, 8, 0xffffff).setStrokeStyle(2, 0x44aaff);
    this.sfxKnob.add(knob2);
    this.sfxKnob.setPosition(W / 2 - 60 + sliderW * Settings.sfxVolume, H / 2 - 105);
    children.push(sfxLabel, this.sfxSlider, this.sfxFill, sfxBg, this.sfxKnob);

    sfxBg.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const v = Math.max(0, Math.min(1, (p.x - (W / 2 - 60)) / sliderW));
      Settings.sfxVolume = v;
      if (this.sfxFill) this.sfxFill.setScale(v, 1);
      this.sfxKnob.setPosition(W / 2 - 60 + sliderW * v, H / 2 - 105);
      AudioManager.setSfxVolume(v);
      if (v > 0) AudioManager.shoot();
    });

    const shakeLabel = this.scene.add.text(W / 2 - 230, H / 2 - 60, "屏幕震动", { fontSize: "14px", color: "#aaa" });
    this.shakeText = this.scene.add.text(W / 2 + 120, H / 2 - 60, Settings.screenShake ? "开" : "关", {
      fontSize: "14px", color: Settings.screenShake ? "#4f4" : "#f44", fontStyle: "bold",
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    const shakeBg = this.scene.add.rectangle(W / 2 - 60, H / 2 - 60, sliderW, 30, 0x000000, 0.001).setInteractive({ useHandCursor: true });
    children.push(shakeLabel, this.shakeText, shakeBg);

    const toggleShake = () => {
      Settings.screenShake = !Settings.screenShake;
      this.shakeText.setText(Settings.screenShake ? "开" : "关");
      this.shakeText.setColor(Settings.screenShake ? "#4f4" : "#f44");
    };
    shakeBg.on("pointerdown", toggleShake);
    this.shakeText.on("pointerdown", toggleShake);

    const bindTitle = this.scene.add.text(W / 2, H / 2 - 15, "━ 按键设置 ━", { fontSize: "14px", color: "#f80" }).setOrigin(0.5);
    children.push(bindTitle);

    this.bindTexts = [];
    const actions = Object.keys(DEFAULT_KEY_BINDINGS);
    actions.forEach((action, i) => {
      const y = H / 2 + 15 + i * 28;
      const label = this.scene.add.text(W / 2 - 200, y, KEY_LABELS[action] ?? action, { fontSize: "13px", color: "#ccc" });
      const keyText = this.scene.add.text(W / 2 + 100, y, `[ ${Settings.getKeyBinding(action)} ]`, {
        fontSize: "13px", color: "#ff0", fontStyle: "bold",
      }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      this.bindTexts.push(keyText);
      children.push(label, keyText);

      keyText.on("pointerdown", () => this.startRebind(action, keyText));
    });

    this.rebindHint = this.scene.add.text(W / 2, H / 2 + 230, "", {
      fontSize: "12px", color: "#ff8",
    }).setOrigin(0.5);
    children.push(this.rebindHint);

    const resetBtn = this.scene.add.rectangle(W / 2 - 110, H / 2 + 200, 140, 36, 0x884422).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xaa6644);
    const resetLabel = this.scene.add.text(W / 2 - 110, H / 2 + 200, "恢复默认", { fontSize: "14px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    resetBtn.on("pointerover", () => resetBtn.setFillStyle(0xaa5533));
    resetBtn.on("pointerout", () => resetBtn.setFillStyle(0x884422));
    resetBtn.on("pointerdown", () => {
      Settings.resetKeyBindings();
      const actions = Object.keys(DEFAULT_KEY_BINDINGS);
      actions.forEach((action, i) => {
        if (this.bindTexts[i]) this.bindTexts[i].setText(`[ ${DEFAULT_KEY_BINDINGS[action]} ]`);
      });
      this.rebindHint?.setText("已恢复默认按键");
    });
    children.push(resetBtn, resetLabel);

    const closeBtn = this.scene.add.rectangle(W / 2 + 110, H / 2 + 200, 140, 36, 0x444488).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x6666aa);
    const closeLabel = this.scene.add.text(W / 2 + 110, H / 2 + 200, "关闭", { fontSize: "16px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    closeBtn.on("pointerover", () => closeBtn.setFillStyle(0x5555aa));
    closeBtn.on("pointerout", () => closeBtn.setFillStyle(0x444488));
    closeBtn.on("pointerdown", () => { this.hide(); if (onClose) onClose(); });
    children.push(closeBtn, closeLabel);

    this.container.add(children);
  }

  private startRebind(action: string, keyText: Phaser.GameObjects.Text) {
    this.waitingForBind = action;
    keyText.setText("[ ... ]");
    keyText.setColor("#f44");
    if (this.rebindHint) this.rebindHint.setText("按下任意键...");

    const handler = (event: KeyboardEvent) => {
      if (!this.waitingForBind) return;
      const keyName = this.keyCodeToName(event.keyCode);
      if (!keyName) { this.rebindHint?.setText("不支持的按键"); return; }
      Settings.setKeyBinding(this.waitingForBind, keyName);
      this.waitingForBind = null;
      keyText.setText(`[ ${keyName} ]`);
      keyText.setColor("#ff0");
      this.rebindHint?.setText(`已绑定: ${KEY_LABELS[action]} → ${keyName}`);
      this.scene.input.keyboard!.off("keydown", handler);
    };

    this.scene.input.keyboard!.on("keydown", handler);

    this.scene.time.delayedCall(5000, () => {
      if (this.waitingForBind === action) {
        this.waitingForBind = null;
        keyText.setText(`[ ${Settings.getKeyBinding(action)} ]`);
        keyText.setColor("#ff0");
        this.rebindHint?.setText("");
        this.scene.input.keyboard!.off("keydown", handler);
      }
    });
  }

  private keyCodeToName(code: number): string | null {
    const map: Record<number, string> = {};
    const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    for (let i = 0; i < letters.length; i++) map[65 + i] = letters[i];
    const digits = "0123456789";
    for (let i = 0; i < digits.length; i++) map[48 + i] = digits[i];
    map[32] = "SPACE";
    map[16] = "SHIFT";
    map[17] = "CTRL";
    map[18] = "ALT";
    map[9] = "TAB";
    map[27] = "ESC";
    map[13] = "ENTER";
    map[37] = "LEFT";
    map[38] = "UP";
    map[39] = "RIGHT";
    map[40] = "DOWN";
    return map[code] ?? null;
  }

  hide() {
    this.waitingForBind = null;
    if (this.container) {
      this.container.destroy();
      this.container = null;
    }
    this.visible = false;
  }

  get isVisible(): boolean { return this.visible; }
}
