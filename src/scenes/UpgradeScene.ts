import Phaser from "phaser";
import { W, H } from "../types";
import { MetaProgress, META_UPGRADES } from "../utils/MetaProgress";
import { Achievements } from "../utils/Achievements";
import { BottomStatusBar } from "../ui/BottomStatusBar";
import { ScrollContainer } from "../ui/ScrollContainer";

export class UpgradeScene extends Phaser.Scene {
  private bottomBar!: BottomStatusBar;
  private scroll!: ScrollContainer;

  constructor() {
    super("UpgradeScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    this.renderTopBar();
    this.renderUpgradeList();
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

    this.add.text(W / 2, 35, "基因升级", {
      fontSize: "28px", color: "#ffcc00", fontStyle: "bold",
      shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 4, fill: true },
    }).setOrigin(0.5, 0.5).setDepth(10);

    this.add.text(W - 30, 35, `${MetaProgress.genePoints}💰`, {
      fontSize: "18px", color: "#ffcc00", fontStyle: "bold",
    }).setOrigin(1, 0.5).setDepth(10);
  }

  private renderUpgradeList() {
    const cardW = 620;
    const cardH = 80;
    const gap = 10;
    const cx = (W - cardW) / 2;
    const lx = cx + 30;
    const genePoints = MetaProgress.genePoints;
    const allMaxed = META_UPGRADES.every(u => MetaProgress.getUpgradeLevel(u.id) >= u.maxLevel);

    this.scroll = new ScrollContainer(this, 0, 80, W, 590);

    if (allMaxed) {
      this.scroll.add(this.add.text(W / 2, 60, "基因系统已禁用\n所有升级已达满级", {
        fontSize: "20px", color: "#888", fontStyle: "bold", align: "center",
      }).setOrigin(0.5, 0));
      this.scroll.setContentHeight(120);
      return;
    }

    META_UPGRADES.forEach((u, i) => {
      const cur = MetaProgress.getUpgradeLevel(u.id);
      const isMaxed = cur >= u.maxLevel;
      const cost = isMaxed ? 0 : Math.round(u.baseCost * (1 + cur * 0.5));
      const canAfford = !isMaxed && genePoints >= cost;
      const y = i * (cardH + gap);

      const shadow = this.add.graphics();
      shadow.fillStyle(0x000000, 0.2);
      shadow.fillRoundedRect(cx + 2, y + 2, cardW, cardH, 10);
      shadow.setDepth(-1);
      this.scroll.add(shadow);

      const cardG = this.add.graphics();
      cardG.fillStyle(0x141432, 0.85);
      cardG.fillRoundedRect(cx, y, cardW, cardH, 10);
      cardG.lineStyle(1, isMaxed ? 0xffd700 : (canAfford ? 0x448844 : 0x333366), isMaxed ? 0.6 : 0.4);
      cardG.strokeRoundedRect(cx, y, cardW, cardH, 10);
      this.scroll.add(cardG);

      const nameColor = isMaxed ? "#888" : "#fff";
      this.scroll.add(this.add.text(lx, y + 15, u.name, {
        fontSize: "16px", color: nameColor, fontStyle: "bold",
      }));

      const levelColor = isMaxed ? "#ffd700" : "#ff8844";
      this.scroll.add(this.add.text(lx + 160, y + 15, isMaxed ? "Lv.MAX" : `Lv.${cur}/${u.maxLevel}`, {
        fontSize: "13px", color: levelColor, fontStyle: "bold",
      }));

      const descText = u.desc;
      const levelDesc = u.id === "hp" ? `最大生命 +${cur * 10}` :
        u.id === "armor" ? `护甲 +${cur}` :
        u.id === "speed" ? `移动速度 +${cur * 5}` :
        u.id === "dmg" ? `所有伤害 +${cur * 5}%` :
        u.id === "dodge" ? `闪避 +${cur}%` :
        u.id === "regen" ? (cur > 0 ? "每秒回复 3HP" : "未解锁") : "";
      const nextVal = isMaxed ? "" :
        u.id === "hp" ? `[+${(cur + 1) * 10}]` :
        u.id === "armor" ? `[+${cur + 1}]` :
        u.id === "speed" ? `[+${(cur + 1) * 5}]` :
        u.id === "dmg" ? `[+${(cur + 1) * 5}%]` :
        u.id === "dodge" ? `[+${cur + 1}%]` :
        u.id === "regen" ? "[解锁]" : "";

      this.scroll.add(this.add.text(lx, y + 45, `${descText} ${nextVal}`, {
        fontSize: "12px", color: "#888",
      }));

      if (isMaxed) {
        this.scroll.add(this.add.text(cx + cardW - 30, y + cardH / 2, "MAX", {
          fontSize: "16px", color: "#ffd700", fontStyle: "bold",
        }).setOrigin(1, 0.5));
        return;
      }

      const priceX = cx + cardW - 80;
      this.scroll.add(this.add.text(priceX, y + 20, `[${cost}💰]`, {
        fontSize: "13px", color: "#ffcc00", fontStyle: "bold",
      }).setOrigin(1, 0));

      const btnW = 70;
      const btnH = 30;
      const btnX = cx + cardW - 40;
      const btnY = y + 52;

      const btnG = this.add.graphics();
      btnG.fillStyle(canAfford ? 0x338833 : 0x333333, 1);
      btnG.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
      btnG.lineStyle(1, canAfford ? 0x44cc44 : 0x444444, 0.5);
      btnG.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
      this.scroll.add(btnG);

      this.scroll.add(this.add.text(btnX, btnY, "购买", {
        fontSize: "13px", color: canAfford ? "#fff" : "#555", fontStyle: "bold",
      }).setOrigin(0.5));

      if (canAfford) {
        const zone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
        zone.on("pointerover", () => {
          btnG.clear();
          btnG.fillStyle(0x44aa44, 1);
          btnG.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
          btnG.lineStyle(1, 0x66cc66, 0.5);
          btnG.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });
        zone.on("pointerout", () => {
          btnG.clear();
          btnG.fillStyle(canAfford ? 0x338833 : 0x333333, 1);
          btnG.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
          btnG.lineStyle(1, canAfford ? 0x44cc44 : 0x444444, 0.5);
          btnG.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 6);
        });
        zone.on("pointerdown", () => {
          if (MetaProgress.buyUpgrade(u.id)) {
            this.scroll.destroy();
            this.scroll = null as any;
            this.renderUpgradeList();
            this.bottomBar.destroy();
            this.renderBottomBar();
            this.renderTopBar();
          }
        });
      }
    });

    const contentH = META_UPGRADES.length * (cardH + gap) - gap + 20;
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
