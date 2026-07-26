import Phaser from "phaser";
import { W, H } from "../types";
import { Achievements } from "../utils/Achievements";
import { MetaProgress } from "../utils/MetaProgress";
import { hasSeenTutorial, showTutorial } from "../ui/Tutorial";
import { CHARACTERS, DIFFICULTY_TIERS } from "../config";

const COLORS = [0x44aaff, 0xff6644, 0x44ff88, 0xff44aa, 0xffaa00, 0xaa66ff, 0xff8866];
const PASSIVE_LABELS: Record<string, string> = {
  merc: "伤害 +10%", spec: "换弹 -20%", sniper: "射程 +50",
  fireman: "护甲 +2", lucky: "升级 5 选 1", tank: "护甲 +1", berserker: "移速 +15%",
};

export class CharacterSelectScene extends Phaser.Scene {
  private selectedIdx = 0;
  private difficultyIdx = 1;
  private endlessMode = false;

  private topContainer!: Phaser.GameObjects.Container;
  private previewContainer!: Phaser.GameObjects.Container;
  private btnContainer!: Phaser.GameObjects.Container;
  private diffContainer!: Phaser.GameObjects.Container;
  private cardsContainer!: Phaser.GameObjects.Container;
  private achContainer!: Phaser.GameObjects.Container;

  constructor() {
    super("CharacterSelectScene");
  }

  create() {
    this.cameras.main.setBackgroundColor(0x0a0a1a);

    this.topContainer = this.add.container(0, 0);
    this.previewContainer = this.add.container(0, 0);
    this.btnContainer = this.add.container(0, 0);
    this.diffContainer = this.add.container(0, 0);
    this.cardsContainer = this.add.container(0, 0);
    this.achContainer = this.add.container(0, 0);

    this.renderAll();
  }

  private renderAll() {
    this.renderTopBar();
    this.renderPreview();
    this.renderStartButton();
    this.renderDifficulty();
    this.renderCards();
    this.renderAchievements();
  }

  private destroyContainer(c: Phaser.GameObjects.Container) {
    c.removeAll(true);
  }

  private progressBar(g: Phaser.GameObjects.Graphics, x: number, y: number, w: number, h: number, pct: number, color: number) {
    const p = Phaser.Math.Clamp(pct, 0, 1);
    g.fillStyle(0x222244, 0.6);
    g.fillRoundedRect(x, y, w, h, 4);
    if (p > 0) {
      g.fillStyle(color, 1);
      g.fillRoundedRect(x, y, w * p, h, 4);
    }
  }

  private circleCD(g: Phaser.GameObjects.Graphics, x: number, y: number, radius: number, pct: number, color: number) {
    const p = Phaser.Math.Clamp(pct, 0, 1);
    g.lineStyle(3, 0x333355, 0.6);
    g.strokeCircle(x, y, radius);
    if (p > 0) {
      g.fillStyle(color, 0.25);
      g.slice(x, y, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + p * 360), false);
      g.fillPath();
      g.lineStyle(3, color, 1);
      g.beginPath();
      g.arc(x, y, radius, Phaser.Math.DegToRad(-90), Phaser.Math.DegToRad(-90 + p * 360), false);
      g.strokePath();
    }
  }

  private renderTopBar() {
    this.destroyContainer(this.topContainer);
    const children: Phaser.GameObjects.GameObject[] = [];

    children.push(this.add.text(12, 12, `基因: ${MetaProgress.genePoints}💰`, {
      fontSize: "14px", color: "#ffcc00", fontStyle: "bold",
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
    }).setOrigin(0, 0));

    children.push(this.add.text(W / 2, 12, "选择角色", {
      fontSize: "22px", color: "#ffcc00", fontStyle: "bold",
      shadow: { offsetX: 2, offsetY: 2, color: "#000", blur: 4, fill: true },
    }).setOrigin(0.5, 0));

    const toggleText = this.add.text(W - 12, 14, `无尽模式: ${this.endlessMode ? "开" : "关"}`, {
      fontSize: "13px", color: this.endlessMode ? "#ff8844" : "#888", fontStyle: "bold",
    }).setOrigin(1, 0);
    children.push(toggleText);

    const toggleZone = this.add.zone(W - 80, 22, 100, 30).setInteractive({ useHandCursor: true });
    toggleZone.on("pointerdown", () => {
      this.endlessMode = !this.endlessMode;
      this.renderTopBar();
    });
    children.push(toggleZone);

    const divider = this.add.graphics();
    divider.lineStyle(1, 0x333355, 0.5);
    divider.lineBetween(0, 50, W, 50);
    children.push(divider);

    this.topContainer.add(children);
  }

  private renderPreview() {
    this.destroyContainer(this.previewContainer);
    const char = CHARACTERS[this.selectedIdx];
    const color = COLORS[this.selectedIdx];
    const unlocked = MetaProgress.isCharUnlocked(char.id);
    const children: Phaser.GameObjects.GameObject[] = [];

    const centerY = 260;

    const avatarX = 240;
    const avatarW = 200;
    const avatarH = 260;

    const shadow = this.add.graphics();
    shadow.fillStyle(0x000000, 0.2);
    shadow.fillRoundedRect(avatarX - avatarW / 2 + 3, centerY - avatarH / 2 + 3, avatarW, avatarH, 12);
    children.push(shadow);

    const avatarBg = this.add.graphics();
    avatarBg.fillStyle(0x141432, 0.85);
    avatarBg.fillRoundedRect(avatarX - avatarW / 2, centerY - avatarH / 2, avatarW, avatarH, 12);
    avatarBg.lineStyle(2, color, 1);
    avatarBg.strokeRoundedRect(avatarX - avatarW / 2, centerY - avatarH / 2, avatarW, avatarH, 12);
    children.push(avatarBg);

    const iconG = this.add.graphics();
    iconG.fillStyle(color, 0.25);
    iconG.fillRoundedRect(avatarX - 60, centerY - 80, 120, 120, 10);
    iconG.lineStyle(2, color, 0.6);
    iconG.strokeRoundedRect(avatarX - 60, centerY - 80, 120, 120, 10);
    children.push(iconG);

    children.push(this.add.text(avatarX, centerY + 60, char.name, {
      fontSize: "20px", color: "#fff", fontStyle: "bold",
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
    }).setOrigin(0.5));

    const statusColor = unlocked ? "#44ff44" : "#ff8844";
    const statusText = unlocked ? "✔ 已选" : "🔒 未解锁";
    children.push(this.add.text(avatarX, centerY + 85, statusText, {
      fontSize: "13px", color: statusColor, fontStyle: "bold",
    }).setOrigin(0.5));

    if (!unlocked) {
      const req = MetaProgress.getCharUnlockRequirement(char.id);
      if (req) {
        children.push(this.add.text(avatarX, centerY + 105, req.desc, {
          fontSize: "10px", color: "#888",
        }).setOrigin(0.5));
      }
    }

    const panelX = 470;
    const panelW = 520;
    const panelH = 260;

    const panelShadow = this.add.graphics();
    panelShadow.fillStyle(0x000000, 0.2);
    panelShadow.fillRoundedRect(panelX + 3, centerY - panelH / 2 + 3, panelW, panelH, 12);
    children.push(panelShadow);

    const panelBg = this.add.graphics();
    panelBg.fillStyle(0x141432, 0.85);
    panelBg.fillRoundedRect(panelX, centerY - panelH / 2, panelW, panelH, 12);
    panelBg.lineStyle(2, color, 1);
    panelBg.strokeRoundedRect(panelX, centerY - panelH / 2, panelW, panelH, 12);
    children.push(panelBg);

    const lx = panelX + 20;
    const innerW = panelW - 40;

    const ny = centerY - panelH / 2;
    children.push(this.add.text(lx, ny + 16, char.name, {
      fontSize: "24px", color: "#ffcc00", fontStyle: "bold",
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
    }));
    children.push(this.add.text(lx, ny + 42, char.desc, {
      fontSize: "13px", color: "#aaa",
    }));

    const barY = ny + 68;
    const barW = 140;
    const barH = 10;

    const statG = this.add.graphics();
    this.progressBar(statG, lx, barY, barW, barH, Math.min(1, char.hpMult / 1.5), 0x44ff44);
    children.push(statG);
    children.push(this.add.text(lx + barW + 8, barY - 2, `生命 ${Math.round(char.hpMult * 100)}%`, {
      fontSize: "12px", color: "#cfc",
    }));

    const statG2 = this.add.graphics();
    this.progressBar(statG2, lx, barY + 18, barW, barH, Math.min(1, char.speedMult / 1.15), 0x44aaff);
    children.push(statG2);
    children.push(this.add.text(lx + barW + 8, barY + 16, `速度 ${Math.round(char.speedMult * 100)}%`, {
      fontSize: "12px", color: "#8cf",
    }));

    children.push(this.add.text(lx, barY + 40, `武器: ${char.startWeapons.join(" / ")}`, {
      fontSize: "12px", color: "#ffcc00",
    }));

    const passiveY = ny + panelH - 94;
    const passiveShadow = this.add.graphics();
    passiveShadow.fillStyle(0x000000, 0.2);
    passiveShadow.fillRoundedRect(lx + 2, passiveY + 2, innerW, 34, 6);
    children.push(passiveShadow);

    const cardG = this.add.graphics();
    cardG.fillStyle(0x1a1a3a, 0.7);
    cardG.fillRoundedRect(lx, passiveY, innerW, 34, 6);
    cardG.lineStyle(1, 0x444488, 0.5);
    cardG.strokeRoundedRect(lx, passiveY, innerW, 34, 6);
    children.push(cardG);
    children.push(this.add.text(lx + 10, passiveY + 8, `被动: ${PASSIVE_LABELS[char.id] || ""}`, {
      fontSize: "13px", color: "#ffcc00",
    }));

    const abilityY = passiveY + 42;
    const abilityShadow = this.add.graphics();
    abilityShadow.fillStyle(0x000000, 0.2);
    abilityShadow.fillRoundedRect(lx + 2, abilityY + 2, innerW, 56, 6);
    children.push(abilityShadow);

    const cardG2 = this.add.graphics();
    cardG2.fillStyle(0x1a1a3a, 0.7);
    cardG2.fillRoundedRect(lx, abilityY, innerW, 56, 6);
    cardG2.lineStyle(1, 0x884488, 0.5);
    cardG2.strokeRoundedRect(lx, abilityY, innerW, 56, 6);
    children.push(cardG2);

    children.push(this.add.text(lx + 10, abilityY + 6, char.abilityName, {
      fontSize: "14px", color: "#ff6688", fontStyle: "bold",
    }));
    children.push(this.add.text(lx + 10, abilityY + 28, `CD ${char.abilityCooldown / 1000}s  ${char.abilityDesc}`, {
      fontSize: "11px", color: "#aaa",
    }));

    const cdG = this.add.graphics();
    const cdRatio = char.abilityCooldown ? 1 : 0;
    this.circleCD(cdG, panelX + panelW - 40, abilityY + 28, 22, cdRatio, 0xff4488);
    children.push(cdG);

    this.previewContainer.add(children);
  }

  private renderStartButton() {
    this.destroyContainer(this.btnContainer);
    const char = CHARACTERS[this.selectedIdx];
    const unlocked = MetaProgress.isCharUnlocked(char.id);
    const canStart = unlocked;
    const children: Phaser.GameObjects.GameObject[] = [];

    const btnX = W / 2;
    const btnY = 470;
    const btnW = 280;
    const btnH = 54;

    const btnShadow = this.add.graphics();
    btnShadow.fillStyle(0x000000, 0.3);
    btnShadow.fillRoundedRect(btnX - btnW / 2 + 3, btnY - btnH / 2 + 3, btnW, btnH, 10);
    children.push(btnShadow);

    const btnG = this.add.graphics();
    if (canStart) {
      btnG.fillStyle(0x338833, 1);
      btnG.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
      btnG.lineStyle(2, 0x44cc44, 1);
      btnG.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
    } else {
      btnG.fillStyle(0x333333, 1);
      btnG.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
    }
    children.push(btnG);

    children.push(this.add.text(btnX, btnY, "▶ 开始游戏", {
      fontSize: "22px", color: canStart ? "#fff" : "#555", fontStyle: "bold",
      shadow: { offsetX: 1, offsetY: 1, color: "#000", blur: 2, fill: true },
    }).setOrigin(0.5));

    if (canStart) {
      const zone = this.add.zone(btnX, btnY, btnW, btnH).setInteractive({ useHandCursor: true });
      zone.on("pointerover", () => {
        btnG.clear();
        btnG.fillStyle(0x44aa44, 1);
        btnG.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        btnG.lineStyle(2, 0x66ee66, 1);
        btnG.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
      });
      zone.on("pointerout", () => {
        btnG.clear();
        btnG.fillStyle(0x338833, 1);
        btnG.fillRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
        btnG.lineStyle(2, 0x44cc44, 1);
        btnG.strokeRoundedRect(btnX - btnW / 2, btnY - btnH / 2, btnW, btnH, 10);
      });
      zone.on("pointerdown", () => {
        if (!MetaProgress.isCharUnlocked(char.id)) return;
        if (hasSeenTutorial()) {
          this.scene.start("GameScene", { character: char, endlessMode: this.endlessMode, difficulty: this.difficultyIdx });
        } else {
          showTutorial(this, () => {
            this.scene.start("GameScene", { character: char, endlessMode: this.endlessMode, difficulty: this.difficultyIdx });
          });
        }
      });
      children.push(zone);
    }

    this.btnContainer.add(children);
  }

  private renderDifficulty() {
    this.destroyContainer(this.diffContainer);
    const children: Phaser.GameObjects.GameObject[] = [];
    const unlockedMax = MetaProgress.unlockedDifficulty;
    const startX = 60;
    const y = 510;
    const btnW = 110;
    const gap = 8;

    const label = this.add.text(W / 2, y - 14, "难度选择", {
      fontSize: "14px", color: "#888", fontStyle: "bold",
    }).setOrigin(0.5);
    children.push(label);

    DIFFICULTY_TIERS.forEach((t, i) => {
      const cx = startX + i * (btnW + gap) + btnW / 2;
      const unlocked = i <= unlockedMax;
      const selected = i === this.difficultyIdx;
      const alpha = unlocked ? 1 : 0.35;

      const cardG = this.add.graphics();
      if (selected && unlocked) {
        cardG.fillStyle(0x883333, 0.9);
        cardG.fillRoundedRect(cx - btnW / 2, y + 4, btnW, 28, 6);
        cardG.lineStyle(2, 0xffcc00, 1);
      } else if (unlocked) {
        cardG.fillStyle(0x222244, 0.7);
        cardG.fillRoundedRect(cx - btnW / 2, y + 4, btnW, 28, 6);
        cardG.lineStyle(1, 0x444488, 0.5);
      } else {
        cardG.fillStyle(0x111122, 0.5);
        cardG.fillRoundedRect(cx - btnW / 2, y + 4, btnW, 28, 6);
        cardG.lineStyle(1, 0x333333, 0.3);
      }
      cardG.strokeRoundedRect(cx - btnW / 2, y + 4, btnW, 28, 6);
      children.push(cardG);

      const textColor = selected && unlocked ? "#ffcc00" : (unlocked ? "#aaa" : "#555");
      children.push(this.add.text(cx, y + 18, unlocked ? t.name : "🔒", {
        fontSize: "12px", color: textColor, fontStyle: "bold",
      }).setOrigin(0.5));

      if (unlocked) {
        const zone = this.add.zone(cx, y + 18, btnW, 28).setInteractive({ useHandCursor: true });
        zone.on("pointerdown", () => {
          if (this.difficultyIdx === i) return;
          this.difficultyIdx = i;
          this.renderDifficulty();
        });
        children.push(zone);
      }
    });

    this.diffContainer.add(children);
  }

  private renderCards() {
    this.destroyContainer(this.cardsContainer);
    const children: Phaser.GameObjects.GameObject[] = [];

    const cardW = 120;
    const cardH = 140;
    const cardGap = 16;
    const totalW = CHARACTERS.length * cardW + (CHARACTERS.length - 1) * cardGap;
    const startX = (W - totalW) / 2 - 20;

    CHARACTERS.forEach((char, i) => {
      const color = COLORS[i];
      const unlocked = MetaProgress.isCharUnlocked(char.id);
      const isSelected = i === this.selectedIdx;
      const cx = startX + i * (cardW + cardGap) + cardW / 2;
      const cy = 640;

      const alpha = unlocked ? 1 : 0.4;

      const cardShadow = this.add.graphics();
      cardShadow.fillStyle(0x000000, 0.2);
      cardShadow.fillRoundedRect(cx - cardW / 2 + 2, cy - cardH / 2 + 2, cardW, cardH, 8);
      children.push(cardShadow);

      const cardG = this.add.graphics();
      cardG.fillStyle(isSelected ? 0x1a1a3a : 0x141432, alpha);
      cardG.fillRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8);

      if (isSelected && unlocked) {
        cardG.lineStyle(3, 0xffcc00, 1);
      } else if (unlocked) {
        cardG.lineStyle(1, 0x555577, 0.6);
      } else {
        cardG.lineStyle(1, 0x333333, 0.3);
      }
      cardG.strokeRoundedRect(cx - cardW / 2, cy - cardH / 2, cardW, cardH, 8);
      children.push(cardG);

      if (unlocked) {
        const stripeG = this.add.graphics();
        stripeG.fillStyle(color, 0.5);
        stripeG.fillRoundedRect(cx - cardW / 2 + 4, cy - cardH / 2 + 4, cardW - 8, 6, 3);
        children.push(stripeG);
      }

      if (isSelected && unlocked) {
        children.push(this.add.text(cx + cardW / 2 - 10, cy - cardH / 2 + 2, "✔", {
          fontSize: "14px", color: "#44ff44", fontStyle: "bold",
        }).setOrigin(1, 0));
      }

      if (!unlocked) {
        children.push(this.add.text(cx, cy - 10, "🔒", {
          fontSize: "20px",
        }).setOrigin(0.5));
      }

      const nameColor = unlocked ? "#fff" : "#666";
      children.push(this.add.text(cx, cy + (unlocked ? 2 : 14), char.name, {
        fontSize: "14px", color: nameColor, fontStyle: "bold",
      }).setOrigin(0.5));

      if (!unlocked) {
        const req = MetaProgress.getCharUnlockRequirement(char.id);
        if (req) {
          children.push(this.add.text(cx, cy + 38, req.desc, {
            fontSize: "8px", color: "#888", align: "center",
            wordWrap: { width: cardW - 12 },
          }).setOrigin(0.5, 0));
        }
      }

      if (unlocked) {
        const zone = this.add.zone(cx, cy, cardW, cardH).setInteractive({ useHandCursor: true });
        zone.on("pointerdown", () => {
          if (this.selectedIdx === i) return;
          this.selectedIdx = i;
          this.renderPreview();
          this.renderStartButton();
          this.renderCards();
        });
        children.push(zone);
      }
    });

    this.cardsContainer.add(children);
  }

  private renderAchievements() {
    this.destroyContainer(this.achContainer);
    const children: Phaser.GameObjects.GameObject[] = [];

    const unlocked = Achievements.unlocked;
    const all = Achievements.getAll();
    if (unlocked.length === 0) return;

    const unlockedSet = new Set(unlocked);
    const lines: string[] = [];
    for (const a of all) {
      if (unlockedSet.has(a.id)) lines.push(`🏆 ${a.name}`);
    }

    children.push(this.add.text(W / 2, 740, `成就: ${unlocked.length}/${all.length}`, {
      fontSize: "13px", color: "#ffcc00", fontStyle: "bold",
    }).setOrigin(0.5));

    if (lines.length > 0) {
      children.push(this.add.text(W / 2, 758, lines.join("  ·  "), {
        fontSize: "10px", color: "#888",
      }).setOrigin(0.5));
    }

    this.achContainer.add(children);
  }
}
