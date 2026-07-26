import Phaser from "phaser";
import { W, H } from "../types";
import { Achievements } from "../utils/Achievements";
import { MetaProgress } from "../utils/MetaProgress";
import { createButton } from "../ui/UIUtils";
import { AudioManager } from "../utils/AudioManager";
import { BottomStatusBar } from "../ui/BottomStatusBar";

export class MainMenuScene extends Phaser.Scene {
  private bottomBar!: BottomStatusBar;
  private audioInitialized = false;

  constructor() {
    super("TitleScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    this.add.text(W / 2, 120, "土豆幸存者", {
      fontSize: "64px", color: "#ffcc00", fontStyle: "bold",
      shadow: { offsetX: 3, offsetY: 3, color: "#000", blur: 8, fill: true },
    }).setOrigin(0.5);

    this.add.text(W / 2, 190, "Potato Survivor", {
      fontSize: "24px", color: "#7a5cff", fontStyle: "bold",
    }).setOrigin(0.5);

    this.add.text(W / 2, 230, "殭屍末日 · 覺醒異能", {
      fontSize: "18px", color: "#ff6688",
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 4, fill: true },
    }).setOrigin(0.5);

    createButton(this, W / 2, 350, 260, 54, "開始遊戲", 0x338833, 0x44aa44, () => this.scene.start("CharacterSelectScene"), 0x44cc44);
    createButton(this, W / 2, 420, 260, 54, "成就", 0x444488, 0x5555aa, () => this.scene.start("AchievementScene"), 0x6666aa);
    createButton(this, W / 2, 490, 260, 54, "设置", 0x773377, 0x994499, () => this.scene.start("SettingsScene"), 0x994499);
    createButton(this, W / 2, 560, 260, 54, `基因升级 (${MetaProgress.genePoints}💰)`, 0x444444, 0x555555, () => this.scene.start("UpgradeScene"), 0x666666);

    const all = Achievements.getAll();
    this.bottomBar = new BottomStatusBar(this, {
      genePoints: MetaProgress.genePoints,
      achievedCount: Achievements.unlocked.length,
      totalCount: all.length,
    });

    this.initAudioOnInteraction();
  }

  private initAudioOnInteraction() {
    if (this.audioInitialized) return;
    const handler = () => {
      if (this.audioInitialized) return;
      this.audioInitialized = true;
      AudioManager.init();
      this.input.off("pointerdown", handler);
      this.input.keyboard?.off("keydown", handler);
    };
    this.input.on("pointerdown", handler);
    this.input.keyboard?.on("keydown", handler);
  }
}
