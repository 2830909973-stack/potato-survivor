import Phaser from "phaser";
import { PlayerStats, Weapon, Character, W, H, HIT_RANGE, MAX_WEAPONS, Power, MAX_POWERS, PowerConfig } from "../types";
import { BASE_STATS, WEAPON_CONFIGS } from "../config";
import { MetaProgress } from "../utils/MetaProgress";
import { AudioManager } from "../utils/AudioManager";

export class Player {
  sprite: Phaser.Physics.Arcade.Sprite;
  stats: PlayerStats;
  weapons: Weapon[];
  activeWeaponIdx = 0;
  iFrameTimer = 0;
  ownedItems = new Set<string>();
  grenadeCount = 0;
  grenadeCooldown = 0;

  charId = "";
  abilityCooldown = 0;
  abilityActive = false;
  abilityTimer = 0;
  abilityBonusCrit = false;
  abilityBonusDrops = false;
  abilityArmorBonus = 0;
  abilityDmgMult = 1;
  invincible = false;

  powers: (Power | null)[] = [null, null];
  powerCooldowns: number[] = [0, 0];
  powerActive: boolean[] = [false, false];
  powerTimers: number[] = [0, 0];
  powerOriginalDodge = 0;

  private regenTimer = 0;
  speedBuffTimer = 0;
  fireRateBuffTimer = 0;
  private originalFireRate: number[] | null = null;
  private scene: Phaser.Scene;
  readonly grenadeCooldownDuration = 8000;
  abilityCooldownDuration: number;

  constructor(scene: Phaser.Scene, character?: Character) {
    this.scene = scene;

    if (character) {
      this.charId = character.id;
      this.abilityCooldownDuration = character.abilityCooldown;
      this.stats = {
        ...BASE_STATS,
        hp: Math.round(BASE_STATS.maxHp * character.hpMult),
        maxHp: Math.round(BASE_STATS.maxHp * character.hpMult),
        speed: Math.round(BASE_STATS.speed * character.speedMult),
      };
      this.weapons = character.startWeapons.map(id => {
        const wc = WEAPON_CONFIGS.find(w => w.id === id) || WEAPON_CONFIGS[0];
        return { ...wc, level: 1, lastFired: 0 };
      });
      character.passive(this.stats, this.weapons);
      MetaProgress.applyUpgrades(this.stats);
      const metaDmg = MetaProgress.dmgMult;
      if (metaDmg > 1) {
        for (const w of this.weapons) w.damage = Math.round(w.damage * metaDmg);
      }
    } else {
      this.stats = { ...BASE_STATS, hp: BASE_STATS.maxHp };
      MetaProgress.applyUpgrades(this.stats);
      const wc = WEAPON_CONFIGS[0];
      this.weapons = [{ ...wc, level: 1, lastFired: 0 }];
      const metaDmg = MetaProgress.dmgMult;
      if (metaDmg > 1) {
        for (const w of this.weapons) w.damage = Math.round(w.damage * metaDmg);
      }
    }

    const texKey = character ? `player_${character.id}` : "player_merc";
    this.sprite = scene.physics.add.sprite(W / 2, H / 2, texKey);
    this.sprite.setCircle(10);
    this.sprite.setCollideWorldBounds(true);
  }

  get x(): number { return this.sprite.x; }
  get y(): number { return this.sprite.y; }
  get activeWeapon(): Weapon | null {
    return this.weapons[this.activeWeaponIdx] || null;
  }

  resetState() {
    this.activeWeaponIdx = 0;
    this.iFrameTimer = 0;
    this.ownedItems = new Set<string>();
    this.grenadeCount = 0;
    this.grenadeCooldown = 0;

    this.abilityCooldown = 0;
    this.abilityActive = false;
    this.abilityTimer = 0;
    this.abilityBonusCrit = false;
    this.abilityBonusDrops = false;
    this.abilityArmorBonus = 0;
    this.abilityDmgMult = 1;
    this.invincible = false;
    this.powers = [null, null];
    this.powerCooldowns = [0, 0];
    this.powerActive = [false, false];
    this.powerTimers = [0, 0];
    this.powerOriginalDodge = 0;
  }

  applyAdrenaline() {
    this.speedBuffTimer = 15000;
    this.fireRateBuffTimer = 15000;
    this.originalFireRate = this.weapons.map(w => w.fireRate);
    for (const w of this.weapons) {
      w.fireRate = Math.round(w.fireRate * 0.8);
    }
  }

  get speedMult(): number {
    return this.speedBuffTimer > 0 ? 1.2 : 1;
  }

  update(time: number, delta: number) {
    if (this.speedBuffTimer > 0) {
      this.speedBuffTimer -= delta;
      if (this.speedBuffTimer <= 0) this.speedBuffTimer = 0;
    }
    if (this.fireRateBuffTimer > 0) {
      this.fireRateBuffTimer -= delta;
      if (this.fireRateBuffTimer <= 0) {
        this.fireRateBuffTimer = 0;
        if (this.originalFireRate) {
          for (let i = 0; i < this.weapons.length && i < this.originalFireRate.length; i++) {
            this.weapons[i].fireRate = this.originalFireRate[i];
          }
          this.originalFireRate = null;
        }
      }
    }
    this.grenadeCooldown = Math.max(0, this.grenadeCooldown - delta);
    this.abilityCooldown = Math.max(0, this.abilityCooldown - delta);
    if (this.abilityActive) {
      this.abilityTimer -= delta;
      if (this.abilityTimer <= 0) this.deactivateAbility();
    }
    for (let i = 0; i < MAX_POWERS; i++) {
      this.powerCooldowns[i] = Math.max(0, this.powerCooldowns[i] - delta);
      if (this.powerActive[i]) {
        this.powerTimers[i] -= delta;
        if (this.powerTimers[i] <= 0) this.deactivatePower(i);
      }
    }
    if (this.stats.hpRegen && this.stats.hp < this.stats.maxHp) {
      this.regenTimer += delta;
      if (this.regenTimer >= 1000) {
        this.regenTimer -= 1000;
        this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + 3);
      }
    }
  }

  switchWeapon() {
    if (this.weapons.length < 2) return;
    this.activeWeaponIdx = this.activeWeaponIdx === 0 ? 1 : 0;
    AudioManager.switchWeapon();
  }

  takeDamage(amount: number, time: number): boolean {
    if (this.invincible) return false;
    if (time - this.iFrameTimer < 500) return false;
    if (this.stats.dodge > 0 && Math.random() < this.stats.dodge) return false;
    this.iFrameTimer = time;
    this.stats.hp -= Math.max(1, amount - this.stats.armor);
    this.flashDamage();
    if (this.stats.hp <= 0) {
      this.stats.hp = 0;
      return true;
    }
    return false;
  }

  heal(amount: number) {
    this.stats.hp = Math.min(this.stats.maxHp, this.stats.hp + amount);
  }

  addWeapon(w: Weapon) {
    const existing = this.weapons.find(we => we.id === w.id);
    if (existing) {
      existing.level++;
      existing.damage = Math.round(existing.damage * 1.15);
      existing.fireRate = Math.round(existing.fireRate * 0.92);
      return;
    }
    if (this.weapons.length >= MAX_WEAPONS) return;
    this.weapons.push({ ...w, level: 1, lastFired: 0 });
  }

  addPower(powerCfg: PowerConfig): number {
    const existing = this.powers.findIndex(p => p?.id === powerCfg.id);
    if (existing >= 0 && this.powers[existing]) {
      const p = this.powers[existing]!;
      if (p.level < p.maxLevel) {
        p.level++;
        return existing;
      }
      return -1;
    }
    const slot = this.powers.indexOf(null);
    if (slot < 0) return -1;
    this.powers[slot] = { ...powerCfg, level: 1 };
    return slot;
  }

  activatePower(idx: number) {
    if (idx < 0 || idx >= MAX_POWERS) return;
    const p = this.powers[idx];
    if (!p || this.powerCooldowns[idx] > 0 || this.powerActive[idx]) return;
    this.powerCooldowns[idx] = p.cooldown;
    this.powerActive[idx] = true;
    this.powerTimers[idx] = p.baseDuration;
    this.sprite.setAlpha(0.6);
    if (p.id === "precognition") {
      this.powerOriginalDodge = this.stats.dodge;
      this.stats.dodge = 1;
    }
  }

  deactivatePower(idx: number) {
    if (idx < 0 || idx >= MAX_POWERS) return;
    const p = this.powers[idx];
    if (!p) return;
    this.powerActive[idx] = false;
    this.powerTimers[idx] = 0;
    if (p.id === "precognition") {
      this.stats.dodge = this.powerOriginalDodge;
      this.powerOriginalDodge = 0;
    }
    const stillActive = this.powerActive.some(a => a);
    if (!stillActive) this.sprite.setAlpha(1);
  }

  flashDamage() {
    this.sprite.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (this.sprite.active) this.sprite.clearTint();
    });
  }

  awardXP(amount: number) {
    const mult = this.stats.xpMult ?? 1;
    this.stats.xp += Math.round(amount * mult);
    let leveled = 0;
    while (this.stats.xp >= this.stats.xpToNext) {
      this.stats.xp -= this.stats.xpToNext;
      this.stats.level++;
      this.stats.xpToNext = 30 + this.stats.level * 20;
      leveled++;
    }
    return leveled;
  }

  private lastFireRateMult = 1;

  activateAbility(config: { duration: number, bonusCrit?: boolean, bonusDrops?: boolean, armorBonus?: number, invincible?: boolean, dmgMult?: number, fireRateBoost?: number }) {
    this.abilityActive = true;
    this.abilityTimer = config.duration;
    if (config.bonusCrit) this.abilityBonusCrit = true;
    if (config.bonusDrops) this.abilityBonusDrops = true;
    if (config.armorBonus) { this.abilityArmorBonus = config.armorBonus; this.stats.armor += config.armorBonus; }
    if (config.invincible) this.invincible = true;
    if (config.dmgMult) this.abilityDmgMult = config.dmgMult;
    if (config.fireRateBoost && config.fireRateBoost !== 1) {
      this.lastFireRateMult = config.fireRateBoost;
      for (const w of this.weapons) w.fireRate = Math.round(w.fireRate / config.fireRateBoost);
    }
    this.sprite.setAlpha(0.7);
  }

  private deactivateAbility() {
    this.abilityActive = false;
    this.abilityBonusCrit = false;
    this.abilityBonusDrops = false;
    this.invincible = false;
    this.abilityDmgMult = 1;
    if (this.abilityArmorBonus > 0) {
      this.stats.armor = Math.max(0, this.stats.armor - this.abilityArmorBonus);
      this.abilityArmorBonus = 0;
    }
    if (this.lastFireRateMult !== 1) {
      for (const w of this.weapons) w.fireRate = Math.round(w.fireRate * this.lastFireRateMult);
      this.lastFireRateMult = 1;
    }
    this.sprite.setAlpha(1);
  }
}
