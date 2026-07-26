import Phaser from "phaser";
import { W, H } from "../types";
import { Settings } from "../utils/Settings";

export interface BottomStatusBarData {
  genePoints: number;
  achievedCount: number;
  totalCount: number;
}

export class BottomStatusBar {
  private scene: Phaser.Scene;
  private container: Phaser.GameObjects.Container;
  private geneText: Phaser.GameObjects.Text;
  private achText: Phaser.GameObjects.Text;
  private hintText: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene, data: BottomStatusBarData) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setDepth(200);

    const y = 735;

    const shadow = scene.add.graphics();
    shadow.fillStyle(0x000000, 0.3);
    shadow.fillRoundedRect(12, y - 4, W - 16, 56, 12);
    shadow.setDepth(199);
    this.container.add(shadow);

    const bg = scene.add.graphics();
    bg.fillStyle(0x141432, 0.85);
    bg.fillRoundedRect(8, y - 8, W - 16, 56, 12);
    bg.lineStyle(1, 0x333366, 0.4);
    bg.strokeRoundedRect(8, y - 8, W - 16, 56, 12);
    this.container.add(bg);

    this.geneText = scene.add.text(24, y + 4, `基因 (${data.genePoints}💰)`, {
      fontSize: "13px", color: "#ffcc00", fontStyle: "bold",
    }).setOrigin(0, 0);
    this.container.add(this.geneText);

    this.achText = scene.add.text(W / 2, y + 4, `成就: ${data.achievedCount}/${data.totalCount}`, {
      fontSize: "13px", color: "#ffcc00", fontStyle: "bold",
    }).setOrigin(0.5, 0);
    this.container.add(this.achText);

    const bindings = Settings.getAllBindings();
    const hint = `${bindings.switch} 切换  ${bindings.reload} 换弹  ${bindings.grenade} 手雷  ${bindings.ability} 技能  ${bindings.pause} 暂停`;
    this.hintText = scene.add.text(W - 24, y + 4, hint, {
      fontSize: "11px", color: "#666",
    }).setOrigin(1, 0);
    this.container.add(this.hintText);
  }

  refresh(data: BottomStatusBarData) {
    this.geneText.setText(`基因 (${data.genePoints}💰)`);
    this.achText.setText(`成就: ${data.achievedCount}/${data.totalCount}`);
  }

  destroy() {
    this.container.destroy();
  }
}
