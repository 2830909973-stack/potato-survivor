import Phaser from "phaser";
import { W, H } from "../types";

const STORAGE_KEY = "potato_tutorial_seen";

export function hasSeenTutorial(): boolean {
  return localStorage.getItem(STORAGE_KEY) === "true";
}

export function markTutorialSeen() {
  localStorage.setItem(STORAGE_KEY, "true");
}

export function showTutorial(scene: Phaser.Scene, onDone: () => void) {
  const bg = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.8).setOrigin(0.5).setDepth(500);
  const panel = scene.add.rectangle(W / 2, H / 2, 700, 500, 0x1a1a2e, 0.95).setStrokeStyle(2, 0x4488ff).setDepth(501);

  const lines = [
    "━━ 操作指南 ━━",
    "",
    "WASD / 方向键    移动角色",
    "★ 所有武器自动攻击最近的敌人",
    "R               手动换弹",
    "Q               切换武器焦点",
    "G               投掷手雷",
    "F               发动角色技能",
    "1 / 2           发动异能",
    "ESC             暂停",
    "",
    "━━ 游戏提示 ━━",
    "",
    "黄色金币 = 材料 (可在波间商店使用)",
    "绿色光球 = 经验 (升级获得身体强化)",
    "每 5 波出现 BOSS，击败后进入商店",
    "商店中可购买武器/改装/道具/异能",
    "重复购买武器可升级(伤害+射速+弹片)",
    "",
    "点击任意处开始",
  ];

  const text = scene.add.text(W / 2, H / 2 - 200, lines.join("\n"), {
    fontSize: "13px",
    color: "#ccc",
    align: "center",
    lineSpacing: 4,
  }).setOrigin(0.5).setDepth(502);

  const hint = scene.add.text(W / 2, H / 2 + 210, "点击任意处关闭", {
    fontSize: "14px", color: "#88f",
  }).setOrigin(0.5).setDepth(502);

  const clickZone = scene.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.001).setInteractive().setDepth(503);
  const keyHandler = (e: KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
      bg.destroy(); panel.destroy(); text.destroy(); hint.destroy(); clickZone.destroy();
      scene.input.keyboard!.off("keydown", keyHandler);
      markTutorialSeen();
      onDone();
    }
  };
  scene.input.keyboard!.on("keydown", keyHandler);

  clickZone.on("pointerdown", () => {
    bg.destroy(); panel.destroy(); text.destroy(); hint.destroy(); clickZone.destroy();
    scene.input.keyboard!.off("keydown", keyHandler);
    markTutorialSeen();
    onDone();
  });
}