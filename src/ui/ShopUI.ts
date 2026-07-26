import Phaser from "phaser";
import { PlayerStats, Weapon, W, H, MAX_WEAPONS } from "../types";
import { WEAPON_CONFIGS, ITEMS, calcRerollCost, applyRarityToWeapon, pickRandomRarity } from "../config";

export interface ShopCallback {
  buyWeapon: (w: Weapon) => void;
  buyItem: (itemId: string) => void;
  buyHpSmall: () => void;
  sellWeapon: (idx: number) => void;
  reroll: () => void;
  nextWave: () => void;
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

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setVisible(false).setDepth(100);
  }

  show(
    stats: PlayerStats, weapons: Weapon[], ownedItems: Set<string>, rerollCount: number, callbacks: ShopCallback
  ) {
    this.stats = stats;
    this.weapons = weapons;
    this.ownedItems = ownedItems;
    this.rerollCount = rerollCount;
    this.callbacks = callbacks;
    this.visible = true;
    this.render();
  }

  hide() {
    this.container.removeAll(true);
    this.container.setVisible(false);
    this.visible = false;
    this.callbacks = null;
    this.stats = null;
  }

  destroy() {
    this.container.removeAll(true);
    this.container.destroy();
    this.visible = false;
    this.callbacks = null;
    this.stats = null;
  }

  private rerollCost(): number {
    if (!this.stats) return 999;
    return calcRerollCost(this.stats.level, this.rerollCount);
  }

  private render() {
    this.container.removeAll(true);
    this.container.setVisible(true);
    if (!this.stats) return;

    const children: Phaser.GameObjects.GameObject[] = [];
    const bg = this.scene.add.rectangle(W / 2, H / 2, 540, 520, 0x000000, 0.88).setOrigin(0.5);
    const title = this.scene.add.text(W / 2, H / 2 - 230, "商店", { fontSize: "26px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    const matLabel = this.scene.add.text(W / 2, H / 2 - 200, `材料: ${this.stats.materials}`, { fontSize: "16px", color: "#0f8" }).setOrigin(0.5);
    children.push(bg, title, matLabel);

    this.populateShopItems(children);
    this.showOwnedWeapons(children);
    this.addRerollButton(children);
    this.addNextWaveButton(children);

    this.container.add(children);
  }

  private populateShopItems(children: Phaser.GameObjects.GameObject[]) {
    if (!this.stats) return;

    const weaponItems = WEAPON_CONFIGS.filter(w => !this.weapons.some(we => we.id === w.id)).map(w => {
      const rarity = pickRandomRarity();
      const rarified = applyRarityToWeapon(w, rarity);
      return {
        id: w.id, name: `[${rarity.name}] ${w.name}`,
        desc: `伤害 ${rarified.damage} 射速 ${rarified.fireRate}ms`,
        cost: Math.round(rarified.cost), rarityColor: rarity.color, type: "weapon" as const, weapon: rarified,
      };
    });

    const passiveItems = ITEMS.filter(item => !this.ownedItems!.has(item.id)).map(item => ({
      ...item, type: "item" as const,
    }));

    const hpItem = { id: "hpSmall", name: "医疗包(小)", desc: "回复 30HP", cost: 10, type: "consumable" as const };

    const pool = [...weaponItems, ...passiveItems, hpItem];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const allItems = pool.slice(0, 4);

    allItems.forEach((item, i) => {
      const y = H / 2 - 130 + i * 72;
      const isWeapon = item.type === "weapon";
      const isConsumable = item.type === "consumable";
      const weaponSlotsFull = isWeapon && this.weapons.length >= MAX_WEAPONS;
      const canBuy = !weaponSlotsFull && this.stats!.materials >= item.cost;
      const btnColor = canBuy ? 0x335533 : 0x333333;
      const btn = this.scene.add.rectangle(W / 2, y, 420, 55, btnColor).setInteractive({ useHandCursor: !!canBuy });

      const typeTag = isWeapon ? "[武器]" : (isConsumable ? "[消耗]" : "[道具]");
      const tagColor = isWeapon ? "#f80" : (isConsumable ? "#f84" : "#4f8");

      const label = this.scene.add.text(W / 2 - 190, y - 10, typeTag, { fontSize: "13px", color: tagColor, fontStyle: "bold" });
      const nameText = this.scene.add.text(W / 2 - 140, y - 10, item.name, { fontSize: "14px", color: item.rarityColor || "#fff", fontStyle: "bold" });
      const desc = this.scene.add.text(W / 2 - 190, y + 14, item.desc, { fontSize: "11px", color: "#aaa" });
      const costText = this.scene.add.text(W / 2 + 190, y, `${item.cost}💰`, { fontSize: "14px", color: canBuy ? "#0f8" : "#666" }).setOrigin(1, 0.5);

      if (!canBuy && weaponSlotsFull) {
        const fullText = this.scene.add.text(W / 2 + 150, y + 14, "出售武器以腾出空位", { fontSize: "10px", color: "#f84" }).setOrigin(1, 0.5);
        children.push(fullText);
      }

      children.push(btn, label, nameText, desc, costText);

      if (canBuy && isWeapon && item.weapon) {
        btn.on("pointerover", () => btn.setFillStyle(0x447744));
        btn.on("pointerout", () => btn.setFillStyle(0x335533));
        btn.on("pointerdown", () => {
          this.stats!.materials -= item.cost;
          this.callbacks?.buyWeapon(item.weapon!);
        });
      } else if (canBuy && isConsumable) {
        btn.on("pointerover", () => btn.setFillStyle(0x447744));
        btn.on("pointerout", () => btn.setFillStyle(0x335533));
        btn.on("pointerdown", () => {
          this.stats!.materials -= item.cost;
          this.callbacks?.buyHpSmall();
        });
      } else if (canBuy && !isWeapon && !isConsumable) {
        btn.on("pointerover", () => btn.setFillStyle(0x447744));
        btn.on("pointerout", () => btn.setFillStyle(0x335533));
        btn.on("pointerdown", () => {
          this.stats!.materials -= item.cost;
          this.callbacks?.buyItem(item.id);
        });
      }
    });
  }

  private showOwnedWeapons(children: Phaser.GameObjects.GameObject[]) {
    if (this.weapons.length === 0) return;
    const wy = H / 2 + 150;
    const label = this.scene.add.text(W / 2, wy, "出售武器 (返还50%)", { fontSize: "11px", color: "#fc8" }).setOrigin(0.5);
    children.push(label);
    const totalW = this.weapons.length * 130 + (this.weapons.length - 1) * 8;
    const startX = (W - totalW) / 2 + 65;
    this.weapons.forEach((w, i) => {
      const wx = startX + i * 138;
      const sellPrice = Math.max(1, Math.round(w.cost * 0.5));
      const card = this.scene.add.rectangle(wx, wy + 18, 125, 28, 0x335533).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x66aa66);
      const name = this.scene.add.text(wx - 16, wy + 18, w.name, { fontSize: "11px", color: "#8f8" }).setOrigin(0, 0.5);
      const sellBtn = this.scene.add.text(wx + 42, wy + 18, `${sellPrice}💰`, { fontSize: "11px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(0x447744));
      card.on("pointerout", () => card.setFillStyle(0x335533));
      sellBtn.on("pointerdown", () => {
        this.callbacks?.sellWeapon(i);
      });
      children.push(card, name, sellBtn);
    });
  }

  private addRerollButton(children: Phaser.GameObjects.GameObject[]) {
    if (!this.stats) return;
    const cost = this.rerollCost();
    const canReroll = this.stats.materials >= cost;
    const btn = this.scene.add.rectangle(W - 70, H / 2 + 215, 100, 30, canReroll ? 0x444488 : 0x333333).setInteractive({ useHandCursor: !!canReroll });
    const label = this.scene.add.text(W - 70, H / 2 + 215, `刷新 ${cost}💰`, { fontSize: "13px", color: canReroll ? "#fff" : "#666", fontStyle: "bold" }).setOrigin(0.5);
    children.push(btn, label);

    if (canReroll) {
      btn.on("pointerover", () => btn.setFillStyle(0x6666aa));
      btn.on("pointerout", () => btn.setFillStyle(0x444488));
      btn.on("pointerdown", () => {
        this.callbacks?.reroll();
      });
    }
  }

  private addNextWaveButton(children: Phaser.GameObjects.GameObject[]) {
    const nextBtn = this.scene.add.rectangle(W / 2, H / 2 + 225, 200, 40, 0x444488).setInteractive({ useHandCursor: true });
    const nextLabel = this.scene.add.text(W / 2, H / 2 + 225, "开始下一波", { fontSize: "16px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    nextBtn.on("pointerover", () => nextBtn.setFillStyle(0x6666aa));
    nextBtn.on("pointerout", () => nextBtn.setFillStyle(0x444488));
    nextBtn.on("pointerdown", () => this.callbacks?.nextWave());
    children.push(nextBtn, nextLabel);
  }
}
