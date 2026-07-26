import Phaser from "phaser";
import { PlayerStats, Weapon, W, H, MAX_WEAPONS, Rarity } from "../types";
import { WEAPON_CONFIGS, ITEMS, calcRerollCost, applyRarityToWeapon, pickRandomRarity } from "../config";

export interface ShopCallback {
  buyWeapon: (w: Weapon) => void;
  buyItem: (itemId: string) => void;
  buyConsumable: (type: "grenade" | "firstAid") => void;
  sellWeapon: (idx: number) => void;
  upgradeWeapon: (idx: number, type: "damage" | "fireRate") => void;
  replaceWeapon: (idx: number, w: Weapon) => void;
  reroll: () => void;
  nextWave: () => void;
}

interface ShopSlot {
  type: "weapon" | "item" | "consumable";
  id: string;
  name: string;
  descLines: string[];
  cost: number;
  weapon?: Weapon;
  consumableType?: string;
  rarity: Rarity;
  icon: string;
}

const PANEL_W = 650;
const PANEL_H = 520;
const CONTENT_W = 610;

const RARITY_STYLE: Record<string, { border: number; bg: number; label: string }> = {
  "普通": { border: 0x666666, bg: 0x1a1a1a, label: "#aaaaaa" },
  "稀有": { border: 0x4488ff, bg: 0x141e33, label: "#4488ff" },
  "史诗": { border: 0xaa44ff, bg: 0x1e1433, label: "#aa44ff" },
  "传说": { border: 0xff8800, bg: 0x332211, label: "#ff8800" },
};

const CARD_W = 130;
const CARD_H = 150;
const CARD_GAP = 40;
const ROW_TOTAL = CARD_W * 2 + CARD_GAP;
const ROW_OFFSET = (CONTENT_W - ROW_TOTAL) / 2;

function rarityStyle(rarityName: string): { border: number; bg: number; label: string } {
  return RARITY_STYLE[rarityName] || RARITY_STYLE["普通"];
}

function buildDescLines(slot: { type: string; desc: string; weapon?: Weapon; consumableType?: string }): string[] {
  if (slot.type === "weapon" && slot.weapon) {
    return [`伤害 ${slot.weapon.damage}`, `射速 ${slot.weapon.fireRate}ms`];
  }
  if (slot.type === "consumable") {
    if (slot.consumableType === "grenade") return ["获得1枚手雷", "一次性"];
    return ["恢复 25HP", "一次性"];
  }
  return slot.desc.split(", ").slice(0, 2);
}

function pickSlotIcon(slot: { type: string; consumableType?: string }): string {
  if (slot.type === "weapon") return "🔫";
  if (slot.type === "consumable") return slot.consumableType === "grenade" ? "💣" : "🩸";
  return "☕";
}

function generateRefreshSlots(stats: PlayerStats, weapons: Weapon[], ownedItems: Set<string>, wave: number): ShopSlot[] {
  const weaponPool = WEAPON_CONFIGS.filter(w => !weapons.some(we => we.id === w.id));
  const weaponSlots: ShopSlot[] = [];
  for (let i = 0; i < 2; i++) {
    if (weaponPool.length === 0) continue;
    const w = weaponPool[Math.floor(Math.random() * weaponPool.length)];
    const rarity = pickRandomRarity();
    const rarified = applyRarityToWeapon(w, rarity);
    weaponSlots.push({
      type: "weapon", id: w.id, name: w.name,
      descLines: [`伤害 ${rarified.damage}`, `射速 ${rarified.fireRate}ms`],
      cost: Math.round(rarified.cost), weapon: rarified, rarity, icon: "🔫",
    });
  }

  const itemPool = ITEMS.filter(item => !ownedItems.has(item.id));
  const itemSlots: ShopSlot[] = itemPool.length > 0 ? [{
    type: "item", id: itemPool[0].id, name: itemPool[0].name,
    descLines: itemPool[0].desc.split(", ").slice(0, 2),
    cost: itemPool[0].cost, rarity: pickRandomRarity(), icon: "☕",
  }] : [];

  const consumableOptions: ShopSlot[] = [
    { type: "consumable" as const, id: "grenade", name: "手雷", descLines: ["获得1枚手雷", "一次性"], cost: 8, consumableType: "grenade", rarity: pickRandomRarity(), icon: "💣" },
    { type: "consumable" as const, id: "firstAid", name: "急救包", descLines: ["恢复 25HP", "一次性"], cost: 6, consumableType: "firstAid", rarity: pickRandomRarity(), icon: "🩸" },
  ];
  const consumableSlot = consumableOptions[Math.floor(Math.random() * consumableOptions.length)];

  const allSlots = [...weaponSlots, ...itemSlots, consumableSlot];

  while (allSlots.length < 4) {
    const extraConsumable = consumableOptions[Math.floor(Math.random() * consumableOptions.length)];
    allSlots.push({ ...extraConsumable, rarity: pickRandomRarity() });
  }

  return allSlots.slice(0, 4);
}

export class ShopUI {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private callbacks: ShopCallback | null = null;
  private stats: PlayerStats | null = null;
  private weapons: Weapon[] = [];
  private ownedItems = new Set<string>();
  private rerollCount = 0;
  visible = false;
  private lockedSlots = new Set<number>();
  private lockMode = false;
  private wave = 0;
  private slots: ShopSlot[] = [];
  private panelCX = 0;
  private panelCY = 0;
  private panelLeft = 0;
  private panelTop = 0;
  private panelRight = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setVisible(false).setDepth(100);
  }

  show(
    stats: PlayerStats, weapons: Weapon[], ownedItems: Set<string>, rerollCount: number, callbacks: ShopCallback, wave: number
  ) {
    this.stats = stats;
    this.weapons = weapons;
    this.ownedItems = ownedItems;
    this.rerollCount = rerollCount;
    this.callbacks = callbacks;
    this.wave = wave;
    this.visible = true;
    this.panelCX = W / 2;
    this.panelCY = H / 2;
    this.panelLeft = this.panelCX - PANEL_W / 2;
    this.panelTop = this.panelCY - PANEL_H / 2;
    this.panelRight = this.panelLeft + CONTENT_W;
    this.container.setVisible(true);
    this.render();
  }

  hide() {
    this.container.removeAll(true);
    this.container.setVisible(false);
    this.visible = false;
    this.callbacks = null;
    this.stats = null;
    this.lockedSlots.clear();
    this.lockMode = false;
  }

  destroy() {
    this.container.removeAll(true);
    this.container.destroy();
    this.visible = false;
    this.callbacks = null;
    this.stats = null;
  }

  private refreshSlots() {
    if (!this.stats) return [];
    return generateRefreshSlots(this.stats, this.weapons, this.ownedItems, this.wave);
  }

  private get shopSlots(): ShopSlot[] {
    if (this.slots.length === 0) {
      this.slots = this.refreshSlots();
    }
    return this.slots;
  }

  private render() {
    this.container.removeAll(true);
    if (!this.stats) return;

    const children: Phaser.GameObjects.GameObject[] = [];

    const bg = this.scene.add.rectangle(this.panelCX, this.panelCY, PANEL_W, PANEL_H, 0x000000, 0.88).setOrigin(0.5);
    children.push(bg);

    this.renderStatusBar(children);
    this.renderCards(children);
    this.renderWeaponBar(children);
    this.renderActionButtons(children);

    this.container.add(children);
  }

  private renderStatusBar(children: Phaser.GameObjects.GameObject[]) {
    if (!this.stats) return;
    const y = this.panelTop + 12;
    const title = this.scene.add.text(this.panelLeft + 20, y, "🛒 商店", { fontSize: "24px", color: "#ff0", fontStyle: "bold" });
    const waveText = this.scene.add.text(this.panelCX, y, `波次 ${this.wave}`, { fontSize: "16px", color: "#fff" }).setOrigin(0.5, 0);
    const matText = this.scene.add.text(this.panelRight - 10, y, `材料: ${this.stats.materials}`, { fontSize: "16px", color: "#0f8", fontStyle: "bold" }).setOrigin(1, 0);
    const holdText = this.scene.add.text(this.panelRight - 10, y + 20, `持有: ${this.weapons.length}/${MAX_WEAPONS}`, { fontSize: "13px", color: "#aaa" }).setOrigin(1, 0);
    children.push(title, waveText, matText, holdText);

    const sep = this.scene.add.rectangle(this.panelLeft + CONTENT_W / 2, this.panelTop + 50, CONTENT_W, 1, 0x444466);
    children.push(sep);
  }

  private renderCards(children: Phaser.GameObjects.GameObject[]) {
    if (!this.stats) return;
    const slots = this.shopSlots;
    const cardX = [this.panelLeft + ROW_OFFSET + CARD_W / 2, this.panelLeft + ROW_OFFSET + CARD_W + CARD_GAP + CARD_W / 2];
    const cardY = [this.panelTop + 70 + CARD_H / 2, this.panelTop + 245 + CARD_H / 2];

    slots.forEach((slot, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      this.renderCard(children, slot, i, cardX[col], cardY[row]);
    });
  }

  private renderCard(children: Phaser.GameObjects.GameObject[], slot: ShopSlot, idx: number, cx: number, cy: number) {
    if (!this.stats) return;
    const rs = rarityStyle(slot.rarity.name);
    const isLocked = this.lockedSlots.has(idx);
    const isWeaponFull = slot.type === "weapon" && this.weapons.length >= MAX_WEAPONS;
    const isOwned = slot.type === "item" && this.ownedItems.has(slot.id);
    const hasWeapon = slot.type === "weapon" && this.weapons.some(w => w.id === slot.id);
    const enoughMat = this.stats.materials >= slot.cost;
    const canBuy = enoughMat && !isOwned && !hasWeapon && (slot.type !== "weapon" || !isWeaponFull);
    const alreadyBought = isOwned || hasWeapon;

    const bgColor = isLocked ? 0x2a2a15 : rs.bg;
    const card = this.scene.add.rectangle(cx, cy, CARD_W, CARD_H, bgColor).setStrokeStyle(1, isLocked ? 0x888822 : rs.border);

    if (canBuy) {
      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(isLocked ? 0x3a3a22 : 0x2a2a2a));
      card.on("pointerout", () => card.setFillStyle(bgColor));
      card.on("pointerdown", () => {
        if (this.lockMode) {
          this.toggleLock(idx);
          return;
        }
        this.buySlot(idx);
      });
    } else if (isWeaponFull && slot.type === "weapon") {
      card.setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(0x2a2a2a));
      card.on("pointerout", () => card.setFillStyle(bgColor));
      card.on("pointerdown", () => {
        if (this.lockMode) { this.toggleLock(idx); return; }
        this.buySlot(idx);
      });
    } else {
      card.on("pointerdown", () => {
        if (this.lockMode) this.toggleLock(idx);
      });
    }
    children.push(card);

    const rarityLabelText = this.scene.add.text(cx + CARD_W / 2 - 6, cy - CARD_H / 2 + 6, `[${slot.rarity.name}]`, {
      fontSize: "11px", color: rs.label, fontStyle: "bold",
    }).setOrigin(1, 0);
    children.push(rarityLabelText);

    const iconSize = 36;
    const iconBg = this.scene.add.rectangle(cx, cy - CARD_H / 2 + 32, iconSize, iconSize, 0x000000, 0.3).setStrokeStyle(1, 0x333333);
    const iconText = this.scene.add.text(cx, cy - CARD_H / 2 + 32, slot.icon, { fontSize: "20px" }).setOrigin(0.5);
    children.push(iconBg, iconText);

    const nameText = this.scene.add.text(cx, cy - CARD_H / 2 + 60, slot.name, {
      fontSize: "14px", color: "#fff", fontStyle: "bold",
    }).setOrigin(0.5);
    children.push(nameText);

    slot.descLines.forEach((line, li) => {
      const dt = this.scene.add.text(cx, cy - CARD_H / 2 + 80 + li * 16, line, {
        fontSize: "12px", color: "#aaa",
      }).setOrigin(0.5);
      children.push(dt);
    });

    const priceColor = enoughMat || alreadyBought ? "#ffd700" : "#ff4444";
    const priceY = cy + CARD_H / 2 - 36;
    const priceText = this.scene.add.text(cx, priceY, alreadyBought ? "已拥有" : `${slot.cost}💰`, {
      fontSize: alreadyBought ? "11px" : "16px", color: alreadyBought ? "#666" : priceColor, fontStyle: "bold",
    }).setOrigin(0.5);
    children.push(priceText);

    if (!alreadyBought) {
      const btnY = cy + CARD_H / 2 - 14;
      const btnColor = canBuy ? 0x446644 : 0x333333;
      const btn = this.scene.add.rectangle(cx, btnY, 56, 22, btnColor).setStrokeStyle(1, canBuy ? 0x66aa66 : 0x444444);
      if (canBuy) {
        btn.setInteractive({ useHandCursor: true });
        btn.on("pointerover", () => btn.setFillStyle(0x558855));
        btn.on("pointerout", () => btn.setFillStyle(btnColor));
        btn.on("pointerdown", (p: Phaser.Input.Pointer) => { p.event.stopPropagation(); this.buySlot(idx); });
      }
      const btnText = this.scene.add.text(cx, btnY, "购买", {
        fontSize: "11px", color: canBuy ? "#fff" : "#555", fontStyle: "bold",
      }).setOrigin(0.5);
      children.push(btn, btnText);
    }

    if (isLocked) {
      const lockIcon = this.scene.add.text(cx - CARD_W / 2 + 12, cy - CARD_H / 2 + 8, "🔒", { fontSize: "12px" }).setOrigin(0.5);
      children.push(lockIcon);
    } else {
      const unlockBtn = this.scene.add.text(cx - CARD_W / 2 + 12, cy - CARD_H / 2 + 8, "🔓", { fontSize: "10px" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      unlockBtn.on("pointerdown", (p: Phaser.Input.Pointer) => { p.event.stopPropagation(); this.toggleLock(idx); });
      children.push(unlockBtn);
    }
  }

  private toggleLock(idx: number) {
    if (!this.stats) return;
    if (this.lockedSlots.has(idx)) {
      this.lockedSlots.delete(idx);
      this.render();
    } else {
      if (this.stats.materials < 5) return;
      this.stats.materials -= 5;
      this.lockedSlots.add(idx);
      this.render();
    }
  }

  private buySlot(idx: number) {
    if (!this.stats || !this.callbacks) return;
    const slot = this.shopSlots[idx];
    if (!slot) return;
    const isWeaponFull = slot.type === "weapon" && this.weapons.length >= MAX_WEAPONS;
    const isOwned = slot.type === "item" && this.ownedItems.has(slot.id);
    const hasWeapon = slot.type === "weapon" && this.weapons.some(w => w.id === slot.id);
    const enoughMat = this.stats.materials >= slot.cost;
    if (!enoughMat) return;
    if (isOwned || hasWeapon) return;

    if (isWeaponFull && slot.type === "weapon" && slot.weapon) {
      this.showReplaceWeaponModal(idx, slot.weapon);
      return;
    }

    this.stats.materials -= slot.cost;
    if (slot.type === "weapon" && slot.weapon) {
      this.callbacks.buyWeapon(slot.weapon);
    } else if (slot.type === "item") {
      this.callbacks.buyItem(slot.id);
    } else if (slot.type === "consumable") {
      this.callbacks.buyConsumable(slot.consumableType as "grenade" | "firstAid");
    }
  }

  private showReplaceWeaponModal(slotIdx: number, newWeapon: Weapon) {
    if (this.weapons.length === 0) return;
    this.container.removeAll(true);
    const modalChildren: Phaser.GameObjects.GameObject[] = [];

    const mw = 360;
    const mh = 160 + this.weapons.length * 56;
    const mx = this.panelCX;
    const my = this.panelCY;

    const overlay = this.scene.add.rectangle(mx, my, PANEL_W, PANEL_H, 0x000000, 0.6).setInteractive();
    const modal = this.scene.add.rectangle(mx, my, mw, mh, 0x1a1a2e, 0.95).setStrokeStyle(1, 0x6666aa);
    const title = this.scene.add.text(mx, my - mh / 2 + 18, "选择要替换的武器", { fontSize: "15px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    modalChildren.push(overlay, modal, title);

    this.weapons.forEach((w, i) => {
      const wy = my - mh / 2 + 50 + i * 56;
      const card = this.scene.add.rectangle(mx, wy, mw - 40, 46, 0x222233).setStrokeStyle(1, 0x444488).setInteractive({ useHandCursor: true });
      const name = this.scene.add.text(mx - mw / 2 + 30, wy - 8, `${w.name} Lv.${w.level}`, { fontSize: "13px", color: "#8f8", fontStyle: "bold" });
      const stats = this.scene.add.text(mx - mw / 2 + 30, wy + 10, `伤害 ${w.damage}  射速 ${w.fireRate}ms`, { fontSize: "11px", color: "#aaa" });
      const rplBtn = this.scene.add.text(mx + mw / 2 - 26, wy, "替换", { fontSize: "12px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(0x2a2a44));
      card.on("pointerout", () => card.setFillStyle(0x222233));
      card.on("pointerdown", () => {
        this.callbacks?.replaceWeapon(i, newWeapon);
      });
      rplBtn.on("pointerdown", (p: Phaser.Input.Pointer) => { p.event.stopPropagation(); this.callbacks?.replaceWeapon(i, newWeapon); });
      modalChildren.push(card, name, stats, rplBtn);
    });

    const cancelY = my + mh / 2 - 22;
    const cancel = this.scene.add.rectangle(mx, cancelY, 80, 28, 0x444444).setInteractive({ useHandCursor: true });
    const cancelText = this.scene.add.text(mx, cancelY, "取消", { fontSize: "12px", color: "#aaa" }).setOrigin(0.5);
    cancel.on("pointerover", () => cancel.setFillStyle(0x666666));
    cancel.on("pointerout", () => cancel.setFillStyle(0x444444));
    cancel.on("pointerdown", () => this.render());
    modalChildren.push(cancel, cancelText);

    const c = this.scene.add.container(0, 0);
    c.add(modalChildren);
    c.setDepth(200);
    this.container.add(c);
  }

  private renderWeaponBar(children: Phaser.GameObjects.GameObject[]) {
    const barY = this.panelTop + 390;
    const barH = 40;
    const barCX = this.panelLeft + CONTENT_W / 2;
    const bar = this.scene.add.rectangle(barCX, barY + barH / 2, CONTENT_W, barH, 0x12121e).setStrokeStyle(1, 0x444488);
    bar.setInteractive({ useHandCursor: true });
    bar.on("pointerdown", () => this.showWeaponManagementModal());
    children.push(bar);

    if (this.weapons.length === 0) {
      const empty = this.scene.add.text(barCX, barY + barH / 2, "未装备武器", { fontSize: "13px", color: "#555" }).setOrigin(0.5);
      children.push(empty);
      return;
    }

    if (this.weapons.length === 1) {
      const w = this.weapons[0];
      const txt = this.scene.add.text(barCX, barY + barH / 2, `★ ${w.name} Lv.${w.level}  |  伤害 ${w.damage}  射速 ${w.fireRate}ms`, {
        fontSize: "12px", color: "#8f8", fontStyle: "bold",
      }).setOrigin(0.5);
      children.push(txt);
    } else {
      const w1 = this.weapons[0];
      const w2 = this.weapons[1];
      const leftText = this.scene.add.text(barCX - 120, barY + barH / 2, `★ ${w1.name} Lv.${w1.level}`, {
        fontSize: "12px", color: "#8f8", fontStyle: "bold",
      }).setOrigin(0, 0.5);
      const leftStats = this.scene.add.text(barCX - 120, barY + barH / 2 + 14, `伤害 ${w1.damage}  射速 ${w1.fireRate}ms`, {
        fontSize: "10px", color: "#aaa",
      }).setOrigin(0, 0.5);
      const sep = this.scene.add.text(barCX, barY + barH / 2, "|", { fontSize: "14px", color: "#444" }).setOrigin(0.5);
      const rightText = this.scene.add.text(barCX + 20, barY + barH / 2, `★ ${w2.name} Lv.${w2.level}`, {
        fontSize: "12px", color: "#8f8", fontStyle: "bold",
      }).setOrigin(0, 0.5);
      const rightStats = this.scene.add.text(barCX + 20, barY + barH / 2 + 14, `伤害 ${w2.damage}  射速 ${w2.fireRate}ms`, {
        fontSize: "10px", color: "#aaa",
      }).setOrigin(0, 0.5);
      children.push(leftText, leftStats, sep, rightText, rightStats);
    }

    const clickHint = this.scene.add.text(this.panelRight - 10, barY + barH / 2, "点击管理", {
      fontSize: "10px", color: "#555",
    }).setOrigin(1, 0.5);
    children.push(clickHint);
  }

  private showWeaponManagementModal() {
    if (!this.stats || this.weapons.length === 0) return;
    this.container.removeAll(true);
    const modalChildren: Phaser.GameObjects.GameObject[] = [];

    const mw = 380;
    const rowH = 64;
    const mh = 120 + this.weapons.length * rowH;
    const mx = this.panelCX;
    const my = this.panelCY;

    const overlay = this.scene.add.rectangle(mx, my, PANEL_W, PANEL_H, 0x000000, 0.6).setInteractive();
    const modal = this.scene.add.rectangle(mx, my, mw, mh, 0x1a1a2e, 0.95).setStrokeStyle(1, 0x6666aa);
    const title = this.scene.add.text(mx, my - mh / 2 + 16, "武器管理", { fontSize: "16px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    modalChildren.push(overlay, modal, title);

    this.weapons.forEach((w, i) => {
      const wy = my - mh / 2 + 46 + i * rowH;
      const card = this.scene.add.rectangle(mx, wy, mw - 30, rowH - 6, 0x222233).setStrokeStyle(1, 0x444488);
      const name = this.scene.add.text(mx - mw / 2 + 22, wy - 14, `${w.name} Lv.${w.level}`, { fontSize: "13px", color: "#8f8", fontStyle: "bold" });
      const stats = this.scene.add.text(mx - mw / 2 + 22, wy + 6, `伤害 ${w.damage}  射速 ${w.fireRate}ms  强化+${w.upgradeCount || 0}`, { fontSize: "10px", color: "#aaa" });
      modalChildren.push(card, name, stats);

      const upgradeCost = 30 + (w.upgradeCount || 0) * 15;
      const sellPrice = Math.round(w.cost * 0.4) + (w.upgradeCount || 0) * 2;

      const btnW = 54;
      const btnH = 22;
      const gap = 6;
      const totalBtnsW = btnW * 4 + gap * 3;
      const btnStartX = mx + mw / 2 - 22 - totalBtnsW;

      const upDmgColor = this.stats!.materials >= upgradeCost && (w.upgradeCount || 0) < 5 ? 0x446644 : 0x333333;
      const upDmgBtn = this.scene.add.rectangle(btnStartX, wy, btnW, btnH, upDmgColor).setStrokeStyle(1, upDmgColor === 0x446644 ? 0x66aa66 : 0x444444);
      const upDmgText = this.scene.add.text(btnStartX, wy, `💥${upgradeCost}`, { fontSize: "10px", color: upDmgColor === 0x446644 ? "#fff" : "#555", fontStyle: "bold" }).setOrigin(0.5);
      if (this.stats!.materials >= upgradeCost && (w.upgradeCount || 0) < 5) {
        upDmgBtn.setInteractive({ useHandCursor: true });
        upDmgBtn.on("pointerover", () => upDmgBtn.setFillStyle(0x558855));
        upDmgBtn.on("pointerout", () => upDmgBtn.setFillStyle(upDmgColor));
        upDmgBtn.on("pointerdown", () => {
          this.callbacks?.upgradeWeapon(i, "damage");
        });
      }
      modalChildren.push(upDmgBtn, upDmgText);

      const upFrColor = this.stats!.materials >= upgradeCost && (w.upgradeCount || 0) < 5 ? 0x446644 : 0x333333;
      const upFrBtn = this.scene.add.rectangle(btnStartX + btnW + gap, wy, btnW, btnH, upFrColor).setStrokeStyle(1, upFrColor === 0x446644 ? 0x66aa66 : 0x444444);
      const upFrText = this.scene.add.text(btnStartX + btnW + gap, wy, `⚡${upgradeCost}`, { fontSize: "10px", color: upFrColor === 0x446644 ? "#fff" : "#555", fontStyle: "bold" }).setOrigin(0.5);
      if (this.stats!.materials >= upgradeCost && (w.upgradeCount || 0) < 5) {
        upFrBtn.setInteractive({ useHandCursor: true });
        upFrBtn.on("pointerover", () => upFrBtn.setFillStyle(0x558855));
        upFrBtn.on("pointerout", () => upFrBtn.setFillStyle(upFrColor));
        upFrBtn.on("pointerdown", () => {
          this.callbacks?.upgradeWeapon(i, "fireRate");
        });
      }
      modalChildren.push(upFrBtn, upFrText);

      const sellBtn = this.scene.add.rectangle(btnStartX + (btnW + gap) * 2, wy, btnW, btnH, 0x553333).setStrokeStyle(1, 0x884444).setInteractive({ useHandCursor: true });
      const sellText = this.scene.add.text(btnStartX + (btnW + gap) * 2, wy, `💰${sellPrice}`, { fontSize: "10px", color: "#ffd700", fontStyle: "bold" }).setOrigin(0.5);
      sellBtn.on("pointerover", () => sellBtn.setFillStyle(0x664444));
      sellBtn.on("pointerout", () => sellBtn.setFillStyle(0x553333));
      sellBtn.on("pointerdown", () => {
        this.callbacks?.sellWeapon(i);
      });
      modalChildren.push(sellBtn, sellText);

      const replaceBtn = this.scene.add.rectangle(btnStartX + (btnW + gap) * 3, wy, btnW, btnH, 0x333355).setStrokeStyle(1, 0x555588).setInteractive({ useHandCursor: true });
      const replaceText = this.scene.add.text(btnStartX + (btnW + gap) * 3, wy, "替换", { fontSize: "10px", color: "#88f", fontStyle: "bold" }).setOrigin(0.5);
      replaceBtn.on("pointerover", () => replaceBtn.setFillStyle(0x444466));
      replaceBtn.on("pointerout", () => replaceBtn.setFillStyle(0x333355));
      replaceBtn.on("pointerdown", () => {
        this.showReplaceFromManagement(i);
      });
      modalChildren.push(replaceBtn, replaceText);
    });

    const cancelY = my + mh / 2 - 18;
    const cancel = this.scene.add.rectangle(mx, cancelY, 80, 26, 0x444444).setInteractive({ useHandCursor: true });
    const cancelText = this.scene.add.text(mx, cancelY, "取消", { fontSize: "12px", color: "#aaa" }).setOrigin(0.5);
    cancel.on("pointerover", () => cancel.setFillStyle(0x666666));
    cancel.on("pointerout", () => cancel.setFillStyle(0x444444));
    cancel.on("pointerdown", () => this.render());
    modalChildren.push(cancel, cancelText);

    const c = this.scene.add.container(0, 0);
    c.add(modalChildren);
    c.setDepth(200);
    this.container.add(c);
  }

  private showReplaceFromManagement(oldIdx: number) {
    this.container.removeAll(true);
    const modalChildren: Phaser.GameObjects.GameObject[] = [];

    const weaponPool = WEAPON_CONFIGS.filter(w => !this.weapons.some(we => we.id === w.id));
    if (weaponPool.length === 0) return;

    const mw = 360;
    const rowH = 46;
    const mh = 120 + Math.min(weaponPool.length, 6) * rowH;
    const mx = this.panelCX;
    const my = this.panelCY;

    const overlay = this.scene.add.rectangle(mx, my, PANEL_W, PANEL_H, 0x000000, 0.6).setInteractive();
    const modal = this.scene.add.rectangle(mx, my, mw, mh, 0x1a1a2e, 0.95).setStrokeStyle(1, 0x6666aa);
    const title = this.scene.add.text(mx, my - mh / 2 + 16, "选择新武器", { fontSize: "15px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    modalChildren.push(overlay, modal, title);

    const pool = weaponPool.slice(0, 6);
    pool.forEach((wc, i) => {
      const rarity = pickRandomRarity();
      const rarified = applyRarityToWeapon(wc, rarity);
      const wy = my - mh / 2 + 46 + i * rowH;
      const rs = rarityStyle(rarity.name);

      const card = this.scene.add.rectangle(mx, wy, mw - 30, rowH - 4, rs.bg).setStrokeStyle(1, rs.border).setInteractive({ useHandCursor: true });
      const name = this.scene.add.text(mx - mw / 2 + 22, wy - 6, `[${rarity.name}] ${wc.name}`, { fontSize: "12px", color: rs.label, fontStyle: "bold" });
      const stats = this.scene.add.text(mx - mw / 2 + 22, wy + 10, `伤害 ${rarified.damage}  射速 ${rarified.fireRate}ms  ${rarified.cost}💰`, { fontSize: "10px", color: "#aaa" });
      card.on("pointerover", () => card.setFillStyle(0x2a2a44));
      card.on("pointerout", () => card.setFillStyle(rs.bg));
      card.on("pointerdown", () => {
        this.callbacks?.replaceWeapon(oldIdx, rarified);
      });
      modalChildren.push(card, name, stats);
    });

    const cancelY = my + mh / 2 - 16;
    const cancel = this.scene.add.rectangle(mx, cancelY, 80, 26, 0x444444).setInteractive({ useHandCursor: true });
    const cancelText = this.scene.add.text(mx, cancelY, "返回", { fontSize: "12px", color: "#aaa" }).setOrigin(0.5);
    cancel.on("pointerover", () => cancel.setFillStyle(0x666666));
    cancel.on("pointerout", () => cancel.setFillStyle(0x444444));
    cancel.on("pointerdown", () => this.showWeaponManagementModal());
    modalChildren.push(cancel, cancelText);

    const c = this.scene.add.container(0, 0);
    c.add(modalChildren);
    c.setDepth(200);
    this.container.add(c);
  }

  private renderActionButtons(children: Phaser.GameObjects.GameObject[]) {
    if (!this.stats) return;
    const btnY = this.panelTop + 450;
    const btnH = 32;

    const cost = calcRerollCost(this.wave, this.rerollCount);
    const canReroll = this.stats.materials >= cost;

    const refreshStartX = this.panelLeft + 30;
    const refreshBtnX = refreshStartX + 60;
    const refreshBtn = this.scene.add.rectangle(refreshBtnX, btnY + btnH / 2, 120, btnH, canReroll ? 0x444488 : 0x333333).setStrokeStyle(1, canReroll ? 0x6666aa : 0x444444);
    const refreshLabel = this.scene.add.text(refreshBtnX, btnY + btnH / 2, `🔄 刷新 ${cost}💰`, { fontSize: "12px", color: canReroll ? "#fff" : "#666", fontStyle: "bold" }).setOrigin(0.5);
    if (canReroll) {
      refreshBtn.setInteractive({ useHandCursor: true });
      refreshBtn.on("pointerover", () => refreshBtn.setFillStyle(0x6666aa));
      refreshBtn.on("pointerout", () => refreshBtn.setFillStyle(0x444488));
      refreshBtn.on("pointerdown", () => {
        this.slots = [];
        this.callbacks?.reroll();
      });
    }
    children.push(refreshBtn, refreshLabel);

    const infoText = this.scene.add.text(refreshBtnX, btnY + btnH + 8, `刷新 ${this.rerollCount} 次 | 下次 +${2}💰`, {
      fontSize: "10px", color: "#555",
    }).setOrigin(0.5, 0);
    children.push(infoText);

    const lockBtnX = this.panelLeft + CONTENT_W / 2;
    const lockBtn = this.scene.add.rectangle(lockBtnX, btnY + btnH / 2, 90, btnH, this.lockMode ? 0x444422 : 0x333333).setStrokeStyle(1, this.lockMode ? 0x888822 : 0x444444).setInteractive({ useHandCursor: true });
    const lockLabel = this.scene.add.text(lockBtnX, btnY + btnH / 2, this.lockMode ? "🔓 解锁" : "🔒 锁定", { fontSize: "12px", color: this.lockMode ? "#ff0" : "#aaa", fontStyle: "bold" }).setOrigin(0.5);
    lockBtn.on("pointerover", () => lockBtn.setFillStyle(this.lockMode ? 0x555533 : 0x444444));
    lockBtn.on("pointerout", () => lockBtn.setFillStyle(this.lockMode ? 0x444422 : 0x333333));
    lockBtn.on("pointerdown", () => {
      this.lockMode = !this.lockMode;
      this.render();
    });

    const lockCostHint = this.scene.add.text(lockBtnX, btnY + btnH + 8, "锁定 5💰/个", { fontSize: "10px", color: "#555" }).setOrigin(0.5, 0);

    children.push(lockBtn, lockLabel, lockCostHint);

    const nextBtnX = 795;
    const nextBtn = this.scene.add.rectangle(nextBtnX, btnY + btnH / 2, 110, btnH, 0x446644).setStrokeStyle(1, 0x66aa66).setInteractive({ useHandCursor: true });
    const nextLabel = this.scene.add.text(nextBtnX, btnY + btnH / 2, "▶ 下一波", { fontSize: "13px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    nextBtn.on("pointerover", () => nextBtn.setFillStyle(0x558855));
    nextBtn.on("pointerout", () => nextBtn.setFillStyle(0x446644));
    nextBtn.on("pointerdown", () => this.callbacks?.nextWave());
    children.push(nextBtn, nextLabel);
  }
}
