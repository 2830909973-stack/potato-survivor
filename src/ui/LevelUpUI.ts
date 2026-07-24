import Phaser from "phaser";
import { PlayerStats, Weapon, BodyPartUpgrade, W, H } from "../types";
import { BODY_UPGRADES, PART_NAMES, PART_COLORS } from "../config";

export class LevelUpUI {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setVisible(false).setDepth(100);
  }

  show(
    stats: PlayerStats, weapons: Weapon[], wave: number, charId: string,
    onSelect: (upgrade: BodyPartUpgrade) => void
  ) {
    this.visible = true;
    this.render(stats, weapons, wave, charId, onSelect);
  }

  hide() {
    this.container.removeAll(true);
    this.container.setVisible(false);
    this.visible = false;
  }

  private render(
    stats: PlayerStats, weapons: Weapon[], wave: number, charId: string,
    onSelect: (upgrade: BodyPartUpgrade) => void
  ) {
    this.container.removeAll(true);
    this.container.setVisible(true);

    const children: Phaser.GameObjects.GameObject[] = [];
    const bg = this.scene.add.rectangle(W / 2, H / 2, 500, 320, 0x000000, 0.9).setOrigin(0.5);
    const title = this.scene.add.text(W / 2, H / 2 - 140, `升级! 等级 ${stats.level}`, { fontSize: "28px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    children.push(bg, title);

    const maxTier = wave >= 8 ? 3 : wave >= 5 ? 2 : 1;
    const available = BODY_UPGRADES.filter(u => u.tier <= maxTier);
    const cardCount = charId === "lucky" ? 5 : 4;
    const shuffled = [...available].sort(() => Math.random() - 0.5).slice(0, cardCount);
    const cardW = 100;
    const gap = 12;
    const totalW = shuffled.length * cardW + (shuffled.length - 1) * gap;
    const startX = (W - totalW) / 2 + cardW / 2;

    shuffled.forEach((upgrade, i) => {
      const x = startX + i * (cardW + gap);
      const y = H / 2 + 10;
      const partName = PART_NAMES[upgrade.part];
      const partColor = PART_COLORS[upgrade.part];

      const cardBg = this.scene.add.rectangle(x, y, cardW, 150, 0x222244).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x4466aa);
      const tierTag = this.scene.add.text(x, y - 48, `${partName} T${upgrade.tier}`, { fontSize: "12px", color: partColor, fontStyle: "bold", align: "center" }).setOrigin(0.5);
      const cardName = this.scene.add.text(x, y - 20, upgrade.name, { fontSize: "14px", color: "#fff", fontStyle: "bold", align: "center" }).setOrigin(0.5);
      const cardDesc = this.scene.add.text(x, y + 15, upgrade.desc, { fontSize: "12px", color: "#aaa", align: "center", wordWrap: { width: cardW - 16 } }).setOrigin(0.5);

      children.push(cardBg, tierTag, cardName, cardDesc);

      cardBg.on("pointerover", () => { cardBg.setFillStyle(0x333366); cardBg.setStrokeStyle(2, 0x88aaff); });
      cardBg.on("pointerout", () => { cardBg.setFillStyle(0x222244); cardBg.setStrokeStyle(2, 0x4466aa); });
      cardBg.on("pointerdown", () => {
        onSelect(upgrade);
      });
    });

    const closeText = this.scene.add.text(W / 2, H / 2 + 140, "选择一个升级", { fontSize: "14px", color: "#888" }).setOrigin(0.5);
    this.scene.tweens.add({ targets: closeText, alpha: 0.5, yoyo: true, repeat: -1, duration: 800 });
    children.push(closeText);

    this.container.add(children);
  }
}
