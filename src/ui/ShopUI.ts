import Phaser from "phaser";
import { PlayerStats, Weapon, W, H, MAX_WEAPONS, MAX_POWERS, Power, PowerConfig } from "../types";
import { WEAPON_CONFIGS, MOD_CONFIGS, ITEMS, CONSUMABLES, POWER_CONFIGS, calcRerollCost, applyRarityToWeapon, pickRandomRarity } from "../config";

export interface ShopCallback {
  buyWeapon: (w: Weapon) => void;
  buyMod: (mod: { apply: (w: Weapon) => void; remove: (w: Weapon) => void }) => void;
  buyItem: (itemId: string) => void;
  buyConsumable: (itemId: string) => void;
  buyPower: (powerCfg: PowerConfig) => void;
  reroll: () => void;
  nextWave: () => void;
  removeMod: (idx: number) => void;
  discardWeapon: (idx: number) => void;
}

export class ShopUI {
  private container: Phaser.GameObjects.Container;
  private scene: Phaser.Scene;
  private callbacks: ShopCallback | null = null;
  private stats: PlayerStats | null = null;
  private weapons: Weapon[] = [];
  private activeWeaponIdx = 0;
  private ownedItems = new Set<string>();
  private powers: (Power | null)[] = [];
  private rerollCount = 0;
  visible = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.container = scene.add.container(0, 0).setVisible(false).setDepth(100);
  }

  show(
    stats: PlayerStats, weapons: Weapon[], activeWeaponIdx: number,
    ownedItems: Set<string>, powers: (Power | null)[], rerollCount: number, callbacks: ShopCallback
  ) {
    this.stats = stats;
    this.weapons = weapons;
    this.activeWeaponIdx = activeWeaponIdx;
    this.ownedItems = ownedItems;
    this.powers = powers;
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

  private rerollCost(): number {
    if (!this.stats) return 999;
    return calcRerollCost(this.stats.level, this.rerollCount);
  }

  private render() {
    this.container.removeAll(true);
    this.container.setVisible(true);

    if (!this.stats) return;

    const children: Phaser.GameObjects.GameObject[] = [];
    const bg = this.scene.add.rectangle(W / 2, H / 2, 500, 540, 0x000000, 0.88).setOrigin(0.5);
    const title = this.scene.add.text(W / 2, H / 2 - 250, "商店", { fontSize: "26px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    const matLabel = this.scene.add.text(W / 2, H / 2 - 220, `材料: ${this.stats.materials}`, { fontSize: "16px", color: "#0f8" }).setOrigin(0.5);
    children.push(bg, title, matLabel);

    this.populateShopItems(children);
    this.showOwnedWeapons(children);
    this.showCurrentMods(children);
    this.addRerollButton(children);
    this.addNextWaveButton(children);

    this.container.add(children);
  }

  private populateShopItems(children: Phaser.GameObjects.GameObject[]) {
    if (!this.stats) return;

    const ownedWeaponIds = new Set(this.weapons.map(w => w.id));
    const weaponItems = WEAPON_CONFIGS.filter(w => true).map(w => {
      const existing = this.weapons.find(we => we.id === w.id);
      const rarity = pickRandomRarity();
      const rarityColor = rarity.color;
      const rarified = applyRarityToWeapon(w, rarity);
      const isUpgrade = !!existing;
      return {
        id: w.id,
        name: isUpgrade ? `${existing!.name} Lv.${existing!.level + 1}` : `[${rarity.name}] ${w.name}`,
        desc: isUpgrade ? `升级! 伤害+15% 射速+8%` : `伤害 ${rarified.damage} 射速 ${rarified.fireRate}ms 弹匣 ${rarified.ammoMax}`,
        cost: isUpgrade ? Math.round(rarified.cost * 0.6 * (existing!.level + 1)) : Math.round(rarified.cost),
        rarityColor: isUpgrade ? "#ffaa00" : rarityColor,
        type: "weapon" as const,
        weapon: rarified,
      };
    });

    const modItems = MOD_CONFIGS.map(m => ({
      id: m.id,
      name: m.name,
      desc: m.desc,
      cost: m.cost,
      type: "mod" as const,
      mod: m,
    }));

    const ownedPowerIds = this.powers.filter(p => p !== null).map(p => p!.id);
    const powerItems = POWER_CONFIGS.filter(pc => {
      const existing = this.powers.find(p => p?.id === pc.id);
      return !existing || existing.level < existing.maxLevel;
    }).map(pc => {
      const existing = this.powers.find(p => p?.id === pc.id);
      const level = existing ? existing.level + 1 : 1;
      return {
        id: pc.id, name: pc.name, desc: `Lv.${level}/${pc.maxLevel} · ${pc.desc}`,
        cost: pc.cost * level, type: "power" as const, powerCfg: pc,
      };
    });

    const passiveItems = ITEMS.filter(item => !this.ownedItems!.has(item.id));
    const consumableItems = CONSUMABLES.map(c => ({ ...c, type: "consumable" as const }));

    const pool = [...weaponItems, ...modItems, ...powerItems, ...passiveItems, ...consumableItems];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const allItems = pool.slice(0, 5);

    allItems.forEach((item, i) => {
      const y = H / 2 - 150 + i * 75;
      const isWeapon = item.type === "weapon";
      const isMod = item.type === "mod";
      const isPower = item.type === "power";
      const isPassive = item.type === "item";
      const isConsumable = item.type === "consumable";
      const ownedWeapon = isWeapon && this.weapons.some(w => w.id === item.id);
      const weaponSlotsFull = isWeapon && !ownedWeapon && this.weapons.length >= MAX_WEAPONS;
      const powerSlotsFull = isPower && this.powers.filter(p => p !== null).length >= MAX_POWERS && !this.powers.some(p => p?.id === item.id);
      const canBuy = !weaponSlotsFull && !powerSlotsFull && this.stats!.materials >= item.cost;
      const btnColor = canBuy ? 0x335533 : 0x333333;
      const btn = this.scene.add.rectangle(W / 2, y, 420, 55, btnColor).setInteractive({ useHandCursor: !!canBuy });

      let typeTag: string;
      let tagColor: string;
      if (isWeapon) { typeTag = "[武器]"; tagColor = "#f80"; }
      else if (isMod) { typeTag = "[改装]"; tagColor = "#8cf"; }
      else if (isPower) { typeTag = "[异能]"; tagColor = "#f4f"; }
      else if (isConsumable) { typeTag = "[消耗]"; tagColor = "#f84"; }
      else { typeTag = "[道具]"; tagColor = "#4f8"; }

      const label = this.scene.add.text(W / 2 - 190, y - 10, typeTag, { fontSize: "13px", color: tagColor, fontStyle: "bold" });
      const nameColor = item.rarityColor || "#fff";
      const nameText = this.scene.add.text(W / 2 - 140, y - 10, item.name, { fontSize: "14px", color: nameColor, fontStyle: "bold" });
      const desc = this.scene.add.text(W / 2 - 190, y + 14, item.desc, { fontSize: "11px", color: "#aaa" });
      const costText = this.scene.add.text(W / 2 + 190, y, `${item.cost}💰`, { fontSize: "14px", color: canBuy ? "#0f8" : "#666" }).setOrigin(1, 0.5);

      if (!canBuy && weaponSlotsFull) {
        const fullText = this.scene.add.text(W / 2 + 150, y + 14, "丢弃已有武器以购买", { fontSize: "10px", color: "#f84" }).setOrigin(1, 0.5);
        children.push(fullText);
      }
      if (!canBuy && powerSlotsFull) {
        const fullText = this.scene.add.text(W / 2 + 150, y + 14, "异能栏已满", { fontSize: "10px", color: "#f84" }).setOrigin(1, 0.5);
        children.push(fullText);
      }

      children.push(btn, label, nameText, desc, costText);

      const onBtnOver = () => btn.setFillStyle(0x447744);
      const onBtnOut = () => btn.setFillStyle(0x335533);

      if (canBuy && isWeapon && item.weapon) {
        btn.on("pointerover", onBtnOver);
        btn.on("pointerout", onBtnOut);
        btn.on("pointerdown", () => {
          this.stats!.materials -= item.cost;
          this.callbacks?.buyWeapon(item.weapon!);
        });
      } else if (canBuy && isMod && item.mod) {
        btn.on("pointerover", onBtnOver);
        btn.on("pointerout", onBtnOut);
        btn.on("pointerdown", () => {
          this.stats!.materials -= item.cost;
          this.callbacks?.buyMod(item.mod!);
        });
      } else if (canBuy && isPower && item.powerCfg) {
        btn.on("pointerover", onBtnOver);
        btn.on("pointerout", onBtnOut);
        btn.on("pointerdown", () => {
          this.stats!.materials -= item.cost;
          this.callbacks?.buyPower(item.powerCfg!);
        });
      } else if (canBuy && isPassive) {
        btn.on("pointerover", onBtnOver);
        btn.on("pointerout", onBtnOut);
        btn.on("pointerdown", () => {
          this.stats!.materials -= item.cost;
          this.callbacks?.buyItem(item.id);
        });
      } else if (canBuy && isConsumable) {
        btn.on("pointerover", onBtnOver);
        btn.on("pointerout", onBtnOut);
        btn.on("pointerdown", () => {
          this.stats!.materials -= item.cost;
          this.callbacks?.buyConsumable(item.id);
        });
      }
    });
  }

  private showOwnedWeapons(children: Phaser.GameObjects.GameObject[]) {
    if (this.weapons.length < 2) return;
    const wy = H / 2 + 170;
    const label = this.scene.add.text(W / 2, wy, "丢弃武器以腾出空位", { fontSize: "11px", color: "#f84" }).setOrigin(0.5);
    children.push(label);
    const totalW = this.weapons.length * 130 + (this.weapons.length - 1) * 8;
    const startX = (W - totalW) / 2 + 65;
    this.weapons.forEach((w, i) => {
      const wx = startX + i * 138;
      const card = this.scene.add.rectangle(wx, wy + 18, 125, 28, 0x553333).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0xaa6666);
      const name = this.scene.add.text(wx, wy + 18, w.name, { fontSize: "11px", color: "#f88" }).setOrigin(0.5);
      const dropBtn = this.scene.add.text(wx + 54, wy + 18, " ✕", { fontSize: "12px", color: "#f44", fontStyle: "bold" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(0x774444));
      card.on("pointerout", () => card.setFillStyle(0x553333));
      dropBtn.on("pointerdown", () => {
        this.callbacks?.discardWeapon(i);
      });
      children.push(card, name, dropBtn);
    });
  }

  private showCurrentMods(children: Phaser.GameObjects.GameObject[]) {
    const w = this.weapons[this.activeWeaponIdx];
    if (!w) return;
    const modY = H / 2 + 200;
    const modLabel = this.scene.add.text(W / 2, modY, `当前: ${w.name}`, { fontSize: "13px", color: "#ff0", fontStyle: "bold" }).setOrigin(0.5);
    children.push(modLabel);

    if (w.mods.length === 0) {
      const empty = this.scene.add.text(W / 2, modY + 20, "未安装改装件", { fontSize: "11px", color: "#666" }).setOrigin(0.5);
      children.push(empty);
      return;
    }

    const startX = W / 2 - (w.mods.length * 130 + (w.mods.length - 1) * 8) / 2 + 65;
    w.mods.forEach((m, i) => {
      const mx = startX + i * 138;
      const my = modY + 20;
      const card = this.scene.add.rectangle(mx, my, 125, 28, 0x333355).setInteractive({ useHandCursor: true }).setStrokeStyle(1, 0x6666aa);
      const name = this.scene.add.text(mx, my, m.name, { fontSize: "11px", color: "#8cf" }).setOrigin(0.5);
      const removeBtn = this.scene.add.text(mx + 54, my, " ✕", { fontSize: "12px", color: "#f66", fontStyle: "bold" }).setOrigin(0.5).setInteractive({ useHandCursor: true });
      card.on("pointerover", () => card.setFillStyle(0x444477));
      card.on("pointerout", () => card.setFillStyle(0x333355));
      removeBtn.on("pointerdown", () => {
        this.callbacks?.removeMod(i);
      });
      children.push(card, name, removeBtn);
    });
  }

  private addRerollButton(children: Phaser.GameObjects.GameObject[]) {
    if (!this.stats) return;
    const cost = this.rerollCost();
    const canReroll = this.stats.materials >= cost;
    const btn = this.scene.add.rectangle(W - 70, H / 2 + 230, 100, 30, canReroll ? 0x444488 : 0x333333).setInteractive({ useHandCursor: !!canReroll });
    const label = this.scene.add.text(W - 70, H / 2 + 230, `刷新 ${cost}💰`, { fontSize: "13px", color: canReroll ? "#fff" : "#666", fontStyle: "bold" }).setOrigin(0.5);
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
    const nextBtn = this.scene.add.rectangle(W / 2, H / 2 + 240, 200, 40, 0x444488).setInteractive({ useHandCursor: true });
    const nextLabel = this.scene.add.text(W / 2, H / 2 + 240, "开始下一波", { fontSize: "16px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    nextBtn.on("pointerover", () => nextBtn.setFillStyle(0x6666aa));
    nextBtn.on("pointerout", () => nextBtn.setFillStyle(0x444488));
    nextBtn.on("pointerdown", () => this.callbacks?.nextWave());
    children.push(nextBtn, nextLabel);
  }
}
