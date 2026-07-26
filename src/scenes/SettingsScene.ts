import Phaser from "phaser";
import { W, H } from "../types";
import { Settings, DEFAULT_KEY_BINDINGS } from "../utils/Settings";
import { MetaProgress } from "../utils/MetaProgress";
import { Achievements } from "../utils/Achievements";
import { AudioManager } from "../utils/AudioManager";
import { BottomStatusBar } from "../ui/BottomStatusBar";

const ACTIONS: { key: string; label: string }[] = [
  { key: "switch", label: "切换武器" },
  { key: "reload", label: "换弹" },
  { key: "grenade", label: "手雷" },
  { key: "ability", label: "技能" },
  { key: "power1", label: "异能1" },
  { key: "power2", label: "异能2" },
  { key: "pause", label: "暂停" },
];

export class SettingsScene extends Phaser.Scene {
  private bottomBar!: BottomStatusBar;
  private bindingAction = "";
  private bindingTexts: Record<string, Phaser.GameObjects.Text> = {};
  private bindingBg: Record<string, Phaser.GameObjects.Graphics> = {};
  private containers: Phaser.GameObjects.GameObject[] = [];

  constructor() {
    super("SettingsScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a1a);
    this.bindingAction = "";
    this.bindingTexts = {};
    this.bindingBg = {};
    this.containers = [];

    this.renderPanel();
    this.renderBottomBar();

    this.input.keyboard!.on("keydown", this.onKeyDown, this);
  }

  private onKeyDown(e: KeyboardEvent) {
    if (!this.bindingAction) return;
    const keyName = e.key === " " ? "SPACE" : e.key === "Escape" ? "ESC" : e.key.toUpperCase();
    Settings.setKeyBinding(this.bindingAction, keyName);
    this.bindingAction = "";
    this.refreshKeysOnly();
  }

  private refreshKeysOnly() {
    const bindings = Settings.getAllBindings();
    const pX = (W - 900) / 2;
    const pW = 900;
    const keyX = pX + pW - 200;
    const keyW = 120;
    const keyH = 30;
    const startY = (H - 660) / 2 + 210;
    const rowH = 36;

    ACTIONS.forEach((act, i) => {
      const y = startY + 30 + i * rowH;
      const isBinding = this.bindingAction === act.key;
      const keyName = bindings[act.key] || DEFAULT_KEY_BINDINGS[act.key] || "?";
      const label = isBinding ? "..." : keyName;

      if (this.bindingTexts[act.key]) {
        this.bindingTexts[act.key].setText(label);
        this.bindingTexts[act.key].setColor(isBinding ? "#fff" : "#aaa");
      }
      if (this.bindingBg[act.key]) {
        this.bindingBg[act.key].clear();
        this.bindingBg[act.key].fillStyle(isBinding ? 0x7a5cff : 0x222244, 0.8);
        this.bindingBg[act.key].fillRoundedRect(keyX, y, keyW, keyH, 6);
        if (isBinding) {
          this.bindingBg[act.key].lineStyle(2, 0xaa88ff, 1);
          this.bindingBg[act.key].strokeRoundedRect(keyX, y, keyW, keyH, 6);
        }
      }
    });
  }

  private renderPanel() {
    const pX = (W - 900) / 2;
    const pY = (H - 660) / 2;
    const pW = 900;
    const pH = 620;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.25);
    shadow.fillRoundedRect(pX + 4, pY + 4, pW, pH, 16);
    shadow.setDepth(0);
    this.containers.push(shadow);

    const bg = this.add.graphics();
    bg.fillStyle(0x141432, 0.92);
    bg.fillRoundedRect(pX, pY, pW, pH, 16);
    bg.lineStyle(1, 0x333366, 0.4);
    bg.strokeRoundedRect(pX, pY, pW, pH, 16);
    bg.setDepth(1);
    this.containers.push(bg);

    const backBtn = this.add.text(pX + 14, pY + 14, "← 返回", {
      fontSize: "16px", color: "#7a5cff", fontStyle: "bold",
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 3, fill: true },
    }).setInteractive({ useHandCursor: true }).setDepth(10);
    backBtn.on("pointerdown", () => {
      this.cleanup();
      this.scene.start("TitleScene");
    });
    this.containers.push(backBtn);

    const title = this.add.text(pX + pW / 2, pY + 14, "设置", {
      fontSize: "28px", color: "#ffcc00", fontStyle: "bold",
      shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 4, fill: true },
    }).setOrigin(0.5, 0).setDepth(10);
    this.containers.push(title);

    const divider = this.add.graphics();
    divider.lineStyle(1, 0x333355, 0.5);
    divider.lineBetween(pX + 20, pY + 54, pX + pW - 20, pY + 54);
    divider.setDepth(10);
    this.containers.push(divider);

    this.renderVolumeSection(pX, pY, pW);
    this.renderScreenShakeToggle(pX, pY);
    this.renderKeyBindings(pX, pY, pW);
    this.renderBottomButtons(pX, pY, pW);
  }

  private renderVolumeSection(pX: number, pY: number, pW: number) {
    const sliderW = 200;
    const sliderH = 8;
    const labelX = pX + 40;
    const sliderX = pX + 160;
    const valueX = sliderX + sliderW + 20;

    const bgmL = this.add.text(labelX, pY + 80, "BGM 音量", { fontSize: "16px", color: "#fff" }).setDepth(10);
    this.containers.push(bgmL);

    const bgmFill = this.add.graphics().setDepth(10);
    this.containers.push(bgmFill);
    this.drawSlider(sliderX, pY + 82, sliderW, sliderH, Settings.bgmVolume, bgmFill);

    const bgmLabel = this.add.text(valueX, pY + 78, `${Math.round(Settings.bgmVolume * 100)}%`, {
      fontSize: "14px", color: "#ffcc00", fontStyle: "bold",
    }).setDepth(10);
    this.containers.push(bgmLabel);

    this.makeSliderInteractive(sliderX, pY + 78, sliderW, sliderH, (v) => {
      Settings.bgmVolume = v;
      AudioManager.setBgmVolume(v);
      this.drawSlider(sliderX, pY + 82, sliderW, sliderH, v, bgmFill);
      bgmLabel.setText(`${Math.round(v * 100)}%`);
    });

    const sfxL = this.add.text(labelX, pY + 125, "SFX 音量", { fontSize: "16px", color: "#fff" }).setDepth(10);
    this.containers.push(sfxL);

    const sfxFill = this.add.graphics().setDepth(10);
    this.containers.push(sfxFill);
    this.drawSlider(sliderX, pY + 127, sliderW, sliderH, Settings.sfxVolume, sfxFill);

    const sfxLabel = this.add.text(valueX, pY + 123, `${Math.round(Settings.sfxVolume * 100)}%`, {
      fontSize: "14px", color: "#ffcc00", fontStyle: "bold",
    }).setDepth(10);
    this.containers.push(sfxLabel);

    this.makeSliderInteractive(sliderX, pY + 123, sliderW, sliderH, (v) => {
      Settings.sfxVolume = v;
      AudioManager.setSfxVolume(v);
      this.drawSlider(sliderX, pY + 127, sliderW, sliderH, v, sfxFill);
      sfxLabel.setText(`${Math.round(v * 100)}%`);
    });
  }

  private drawSlider(x: number, y: number, w: number, h: number, ratio: number, g: Phaser.GameObjects.Graphics) {
    g.clear();
    g.fillStyle(0x333355, 0.6);
    g.fillRoundedRect(x, y, w, h, 4);
    if (ratio > 0) {
      g.fillStyle(0x7a5cff, 1);
      g.fillRoundedRect(x, y, w * ratio, h, 4);
    }
  }

  private makeSliderInteractive(x: number, y: number, w: number, h: number, onChange: (v: number) => void) {
    const zone = this.add.zone(x + w / 2, y + h / 2, w + 20, h + 20)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.containers.push(zone);
    zone.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const v = Phaser.Math.Clamp((p.x - x) / w, 0, 1);
      onChange(v);
    });
    zone.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!p.isDown) return;
      const v = Phaser.Math.Clamp((p.x - x) / w, 0, 1);
      onChange(v);
    });
  }

  private renderScreenShakeToggle(pX: number, pY: number) {
    const labelX = pX + 40;

    const shakeL = this.add.text(labelX, pY + 170, "屏幕震动", { fontSize: "16px", color: "#fff" }).setDepth(10);
    this.containers.push(shakeL);

    const toggleX = pX + 160;
    const toggleY = pY + 168;
    const toggleW = 44;
    const toggleH = 24;

    const toggleG = this.add.graphics().setDepth(10);
    this.containers.push(toggleG);
    this.drawToggle(toggleG, toggleX, toggleY, toggleW, toggleH, Settings.screenShake);

    const toggleZone = this.add.zone(toggleX + toggleW / 2, toggleY + toggleH / 2, toggleW, toggleH)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.containers.push(toggleZone);
    toggleZone.on("pointerdown", () => {
      Settings.screenShake = !Settings.screenShake;
      this.drawToggle(toggleG, toggleX, toggleY, toggleW, toggleH, Settings.screenShake);
    });
  }

  private drawToggle(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, on: boolean) {
    g.clear();
    g.fillStyle(0x333355, 0.8);
    g.fillRoundedRect(x, y, w, h, 12);
    if (on) {
      g.fillStyle(0x7a5cff, 1);
      g.fillRoundedRect(x, y, w, h, 12);
      g.fillStyle(0xffffff, 1);
      g.fillCircle(x + w - 10, y + h / 2, 8);
    } else {
      g.fillStyle(0xffffff, 1);
      g.fillCircle(x + 10, y + h / 2, 8);
    }
  }

  private renderKeyBindings(pX: number, pY: number, pW: number) {
    const startY = pY + 210;
    const labelX = pX + 40;
    const keyX = pX + pW - 200;
    const keyW = 120;
    const keyH = 30;
    const rowH = 36;
    const bindings = Settings.getAllBindings();

    const sectionTitle = this.add.text(pX + pW / 2, startY, "按键设置", {
      fontSize: "18px", color: "#ffcc00", fontStyle: "bold",
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
    }).setOrigin(0.5, 0).setDepth(10);
    this.containers.push(sectionTitle);

    ACTIONS.forEach((act, i) => {
      const y = startY + 30 + i * rowH;
      const isBinding = this.bindingAction === act.key;
      const keyName = bindings[act.key] || DEFAULT_KEY_BINDINGS[act.key] || "?";

      const actLabel = this.add.text(labelX, y + 6, act.label, {
        fontSize: "16px", color: "#ccc",
      }).setDepth(10);
      this.containers.push(actLabel);

      const keyBg = this.add.graphics().setDepth(10);
      keyBg.fillStyle(isBinding ? 0x7a5cff : 0x222244, 0.8);
      keyBg.fillRoundedRect(keyX, y, keyW, keyH, 6);
      if (isBinding) {
        keyBg.lineStyle(2, 0xaa88ff, 1);
        keyBg.strokeRoundedRect(keyX, y, keyW, keyH, 6);
      }
      this.containers.push(keyBg);

      this.bindingBg[act.key] = keyBg;

      const keyText = this.add.text(keyX + keyW / 2, y + keyH / 2, isBinding ? "..." : keyName, {
        fontSize: "14px", color: isBinding ? "#fff" : "#aaa", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(10);
      this.containers.push(keyText);
      this.bindingTexts[act.key] = keyText;

      const zone = this.add.zone(keyX + keyW / 2, y + keyH / 2, keyW, keyH)
        .setInteractive({ useHandCursor: true }).setDepth(10);
      this.containers.push(zone);
      zone.on("pointerdown", () => {
        if (this.bindingAction === act.key) {
          this.bindingAction = "";
          this.refreshKeysOnly();
          return;
        }
        this.bindingAction = act.key;
        this.refreshKeysOnly();
      });
    });
  }

  private renderBottomButtons(pX: number, pY: number, pW: number) {
    const btnY = pY + 520;
    const btnW = 120;
    const btnH = 36;

    const resetG = this.add.graphics().setDepth(10);
    resetG.fillStyle(0x444444, 0.8);
    resetG.fillRoundedRect(pX + 40, btnY, btnW, btnH, 8);
    this.containers.push(resetG);

    const resetText = this.add.text(pX + 40 + btnW / 2, btnY + btnH / 2, "恢复默认", {
      fontSize: "14px", color: "#ccc", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(10);
    this.containers.push(resetText);

    const resetZone = this.add.zone(pX + 40 + btnW / 2, btnY + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.containers.push(resetZone);
    resetZone.on("pointerover", () => {
      resetG.clear();
      resetG.fillStyle(0x555555, 0.9);
      resetG.fillRoundedRect(pX + 40, btnY, btnW, btnH, 8);
    });
    resetZone.on("pointerout", () => {
      resetG.clear();
      resetG.fillStyle(0x444444, 0.8);
      resetG.fillRoundedRect(pX + 40, btnY, btnW, btnH, 8);
    });
    resetZone.on("pointerdown", () => {
      Settings.resetKeyBindings();
      Settings.bgmVolume = 0.5;
      Settings.sfxVolume = 0.5;
      Settings.screenShake = true;
      AudioManager.setBgmVolume(0.5);
      AudioManager.setSfxVolume(0.5);
      this.bindingAction = "";
      this.scene.restart();
    });

    const closeG = this.add.graphics().setDepth(10);
    closeG.fillStyle(0x444444, 0.8);
    closeG.fillRoundedRect(pX + pW - 40 - btnW, btnY, btnW, btnH, 8);
    this.containers.push(closeG);

    const closeText = this.add.text(pX + pW - 40 - btnW / 2, btnY + btnH / 2, "关闭", {
      fontSize: "14px", color: "#ccc", fontStyle: "bold",
    }).setOrigin(0.5).setDepth(10);
    this.containers.push(closeText);

    const closeZone = this.add.zone(pX + pW - 40 - btnW / 2, btnY + btnH / 2, btnW, btnH)
      .setInteractive({ useHandCursor: true }).setDepth(10);
    this.containers.push(closeZone);
    closeZone.on("pointerover", () => {
      closeG.clear();
      closeG.fillStyle(0x555555, 0.9);
      closeG.fillRoundedRect(pX + pW - 40 - btnW, btnY, btnW, btnH, 8);
    });
    closeZone.on("pointerout", () => {
      closeG.clear();
      closeG.fillStyle(0x444444, 0.8);
      closeG.fillRoundedRect(pX + pW - 40 - btnW, btnY, btnW, btnH, 8);
    });
    closeZone.on("pointerdown", () => {
      this.cleanup();
      this.scene.start("TitleScene");
    });
  }

  private renderBottomBar() {
    const all = Achievements.getAll();
    this.bottomBar = new BottomStatusBar(this, {
      genePoints: MetaProgress.genePoints,
      achievedCount: Achievements.unlocked.length,
      totalCount: all.length,
    });
  }

  private cleanup() {
    this.input.keyboard?.off("keydown", this.onKeyDown, this);
    this.bottomBar?.destroy();
  }
}
