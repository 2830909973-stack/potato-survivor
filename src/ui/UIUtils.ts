import Phaser from "phaser";

export function createButton(
  scene: Phaser.Scene,
  x: number, y: number, w: number, h: number,
  label: string,
  color: number,
  hoverColor: number,
  onClick: () => void,
  strokeColor = color,
): Phaser.GameObjects.Rectangle {
  const btn = scene.add.rectangle(x, y, w, h, color)
    .setInteractive({ useHandCursor: true })
    .setStrokeStyle(2, strokeColor);
  scene.add.text(x, y, label, { fontSize: "18px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
  btn.on("pointerover", () => btn.setFillStyle(hoverColor));
  btn.on("pointerout", () => btn.setFillStyle(color));
  btn.on("pointerdown", onClick);
  return btn;
}