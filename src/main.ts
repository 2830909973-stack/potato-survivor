import Phaser from "phaser";
import { BootScene } from "./scenes/BootScene";
import { GameScene } from "./scenes/GameScene";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene";
import { MainMenuScene } from "./scenes/MainMenuScene";
import { AchievementScene } from "./scenes/AchievementScene";
import { UpgradeScene } from "./scenes/UpgradeScene";
import { SettingsScene } from "./scenes/SettingsScene";

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1200,
  height: 800,
  backgroundColor: "#1a1a2e",
  parent: document.body,
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  input: {
    keyboard: {
      capture: [37, 38, 39, 40, 65, 87, 83, 68],
    },
  },
  scene: [BootScene, MainMenuScene, CharacterSelectScene, GameScene, AchievementScene, UpgradeScene, SettingsScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
};

new Phaser.Game(config);
