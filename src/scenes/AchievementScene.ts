import Phaser from "phaser";
import { W, H } from "../types";
import { Achievements } from "../utils/Achievements";
import { MetaProgress } from "../utils/MetaProgress";
import { BottomStatusBar } from "../ui/BottomStatusBar";
import { ScrollContainer } from "../ui/ScrollContainer";

const ACHIEVEMENT_ICONS: Record<string, string> = {
  first_blood: "💀", wave_10: "🛡️", wave_20: "⚔️", wave_30: "👑",
  kill_100: "🗡️", kill_500: "🔥", boss_5: "🐉", boss_10: "💀",
  rich: "💰", magnet: "🧲", berserker_win: "😈", sniper_win: "🎯", tank_win: "🛡️",
};

export class AchievementScene extends Phaser.Scene {
  private bottomBar!: BottomStatusBar;
  private scroll!: ScrollContainer;

  constructor() {
    super("AchievementScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a1a);
    this.renderTopBar();
    this.renderAchievementGrid();
    this.renderBottomBar();
  }

  private renderTopBar() {
    const bg = this.add.graphics().setDepth(0);
    bg.fillStyle(0x141432, 0.85);
    bg.fillRoundedRect(10, 10, W - 20, 50, 12);

    const backBtn = this.add.text(30, 30, "← 返回", {
      fontSize: "16px", color: "#7a5cff", fontStyle: "bold",
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 3, fill: true },
    }).setOrigin(0, 0.5).setInteractive({ useHandCursor: true }).setDepth(10);
    backBtn.on("pointerdown", () => {
      this.bottomBar.destroy();
      this.scroll.destroy();
      this.scene.start("TitleScene");
    });

    this.add.text(W / 2, 35, "🏆 成就", {
      fontSize: "28px", color: "#ffcc00", fontStyle: "bold",
      shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 4, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(10);

    const all = Achievements.getAll();
    this.add.text(W - 30, 35, `已解锁：${Achievements.unlocked.length}/${all.length}`, {
      fontSize: "16px", color: "#fff", fontStyle: "bold",
    }).setOrigin(1, 0.5).setDepth(10);
  }

  private renderAchievementGrid() {
    const all = Achievements.getAll();
    const unlockedSet = new Set(Achievements.unlocked);
    const cardW = 280;
    const cardH = 110;
    const gapX = 20;
    const gapY = 14;
    const cols = 2;
    const totalGridW = cols * cardW + (cols - 1) * gapX;
    const startX = (W - totalGridW) / 2;
    const rows = Math.ceil(all.length / cols);

    this.scroll = new ScrollContainer(this, 0, 80, W, 590);

    all.forEach((a, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      const unlocked = unlockedSet.has(a.id);
      const cx = startX + col * (cardW + gapX) + cardW / 2;
      const cy = row * (cardH + gapY);

      const shadowG = this.add.graphics();
      shadowG.fillStyle(0x000000, 0.2);
      shadowG.fillRoundedRect(cx - cardW / 2 + 2, cy + 2, cardW, cardH, 10);
      this.scroll.add(shadowG);

      const cardG = this.add.graphics();
      cardG.fillStyle(0x141432, 0.85);
      cardG.fillRoundedRect(cx - cardW / 2, cy, cardW, cardH, 10);
      if (unlocked) {
        cardG.lineStyle(2, 0xffd700, 0.8);
      } else {
        cardG.lineStyle(1, 0x333366, 0.4);
      }
      cardG.strokeRoundedRect(cx - cardW / 2, cy, cardW, cardH, 10);
      this.scroll.add(cardG);

      const iconX = cx - cardW / 2 + 28;
      if (unlocked) {
        this.scroll.add(this.add.text(iconX, cy + 43, ACHIEVEMENT_ICONS[a.id] || "🏆", {
          fontSize: "26px",
        }).setOrigin(0.5));
      } else {
        const iconBg = this.add.graphics();
        iconBg.fillStyle(0x333366, 0.5);
        iconBg.fillRoundedRect(iconX - 15, cy + 14, 30, 30, 6);
        this.scroll.add(iconBg);
        this.scroll.add(this.add.text(iconX, cy + 29, "?", {
          fontSize: "20px", color: "#666", fontStyle: "bold",
        }).setOrigin(0.5));
      }

      const textX = cx - cardW / 2 + 60;
      this.scroll.add(this.add.text(textX, cy + 14, a.name, {
        fontSize: "17px", color: unlocked ? "#fff" : "#888", fontStyle: "bold",
      }));
      this.scroll.add(this.add.text(textX, cy + 38, a.desc, {
        fontSize: "13px", color: "#666",
      }));

      const statusColor = unlocked ? "#44ff44" : "#ff8844";
      const statusText = unlocked ? "✔ 已达成" : "○ 未达成";
      this.scroll.add(this.add.text(textX, cy + 62, statusText, {
        fontSize: "14px", color: statusColor, fontStyle: "bold",
      }));
    });

    const contentH = rows * (cardH + gapY) - gapY + 20;
    this.scroll.setContentHeight(contentH);
  }

  private renderBottomBar() {
    const all = Achievements.getAll();
    this.bottomBar = new BottomStatusBar(this, {
      genePoints: MetaProgress.genePoints,
      achievedCount: Achievements.unlocked.length,
      totalCount: all.length,
    });
  }
}
