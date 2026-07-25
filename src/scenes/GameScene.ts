import Phaser from "phaser";
import { Weapon, SpawnRule, W, H, PICKUP_RANGE, Power, MAX_POWERS, PowerConfig, Character, EnemyType, WaveConfig } from "../types";
import { Settings } from "../utils/Settings";
import { SettingsUI } from "../ui/SettingsUI";
import { VictoryUI } from "../ui/VictoryUI";
import { WAVE_CONFIGS, getWaveDuration, calcRerollCost, ITEMS, XP_PER_KILL, BOSS_DATA, CONSUMABLES, EVOLUTIONS, getBiome } from "../config";
import { AudioManager } from "../utils/AudioManager";
import { Achievements } from "../utils/Achievements";
import { MetaProgress } from "../utils/MetaProgress";
import { EffectsManager } from "../utils/EffectsManager";
import { Player } from "../entities/Player";
import { EnemyManager } from "../entities/EnemyManager";
import { ProjectileManager } from "../entities/ProjectileManager";
import { HUD } from "../ui/HUD";
import { ShopUI, ShopCallback } from "../ui/ShopUI";
import { LevelUpUI } from "../ui/LevelUpUI";
import { GameOverUI } from "../ui/GameOverUI";

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemyMgr!: EnemyManager;
  private projectileMgr!: ProjectileManager;
  private hud!: HUD;
  private shopUI!: ShopUI;
  private levelUpUI!: LevelUpUI;
  private gameOverUI!: GameOverUI;
  private victoryUI!: VictoryUI;
  private effects!: EffectsManager;

  private wave = 0;
  private waveTimer = 0;
  private gameOver = false;
  private paused = false;
  private inShop = false;
  private levelingUp = false;
  private bossActive = false;
  private bossPhase = false;
  private spawnRules: SpawnRule[] = [];
  private pendingLevelUps = 0;
  private rerollCount = 0;
  private stats_kills = 0;
  private stats_bossKills = 0;
  private stats_peakAlive = 0;
  private stats_materialsEarned = 0;
  private dropList: Phaser.GameObjects.Image[] = [];
  private xpDropList: Phaser.GameObjects.Image[] = [];
  private obstacles: Phaser.Physics.Arcade.StaticGroup | null = null;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private settingsUI!: SettingsUI;
  private endlessMode = false;

  constructor() {
    super("GameScene");
  }

  create() {
    const charData = (this.scene.settings.data as { character?: Character })?.character;
    this.player = new Player(this, charData);
    this.enemyMgr = new EnemyManager(this);
    this.projectileMgr = new ProjectileManager(this);
    this.hud = new HUD(this);
    this.shopUI = new ShopUI(this);
    this.levelUpUI = new LevelUpUI(this);
    this.gameOverUI = new GameOverUI(this);
    this.victoryUI = new VictoryUI(this);
    this.effects = new EffectsManager(this);
    this.settingsUI = new SettingsUI(this);

    const sceneData = this.scene.settings.data as { character?: Character; endlessMode?: boolean } | undefined;
    this.endlessMode = sceneData?.endlessMode ?? false;

    this.wave = 0;
    this.gameOver = false;
    this.paused = false;
    this.inShop = false;
    this.levelingUp = false;
    this.waveTimer = 0;
    this.bossActive = false;
    this.bossPhase = false;
    this.spawnRules = [];
    this.pendingLevelUps = 0;
    this.rerollCount = 0;
    this.stats_kills = 0;
    this.stats_bossKills = 0;
    this.stats_peakAlive = 0;
    this.stats_materialsEarned = 0;
    this.dropList = [];
    this.xpDropList = [];
    this.player.resetState();

    this.pauseContainer = this.add.container(0, 0).setVisible(false).setDepth(200);

    this.physics.world.setBounds(0, 0, W, H);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.setupWASD();
    this.setupKeys();

    AudioManager.startBGM();

    this.obstacles = this.physics.add.staticGroup();
    for (let i = 0; i < 8; i++) {
      const ox = Phaser.Math.Between(150, W - 150);
      const oy = Phaser.Math.Between(150, H - 150);
      const ow = Phaser.Math.Between(50, 90);
      const oh = Phaser.Math.Between(50, 90);
      const gfx = this.add.graphics();
      gfx.fillStyle(0x555555, 0.6);
      gfx.fillRect(ox - ow / 2, oy - oh / 2, ow, oh);
      gfx.lineStyle(2, 0x777777);
      gfx.strokeRect(ox - ow / 2, oy - oh / 2, ow, oh);
      const zone = this.add.zone(ox, oy, ow, oh);
      this.physics.add.existing(zone, true);
      this.obstacles.add(zone);
    }
    this.physics.add.collider(this.player.sprite, this.obstacles);
    this.physics.add.collider(this.enemyMgr.group, this.obstacles);
    this.physics.add.collider(this.projectileMgr.bullets, this.obstacles, (_b) => {
      const b = _b as Phaser.Physics.Arcade.Sprite;
      this.projectileMgr.deactivate(b);
    });
    this.physics.add.collider(this.projectileMgr.enemyBullets, this.obstacles, (_b) => {
      const b = _b as Phaser.Physics.Arcade.Sprite;
      this.projectileMgr.deactivate(b);
    });

    this.showControlsHint();
    this.startNextWave();
  }

  private showControlsHint() {
    const hint = this.add.text(W / 2, H - 40, "Q 切枪  R 换弹  G 手雷  1/2 异能  F 技能 ESC 暂停", {
      fontSize: "13px", color: "#fff", fontStyle: "bold",
      stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: hint, alpha: 0, delay: 4000, duration: 1000,
      onComplete: () => hint.destroy(),
    });
  }

  update(time: number, delta: number) {
    if (this.gameOver || this.inShop || this.levelingUp || this.paused) return;

    this.waveTimer -= delta;
    if (this.waveTimer <= 0) {
      if (this.bossActive && this.enemyMgr.getBoss() && !this.bossPhase) {
        this.enterBossPhase();
        this.waveTimer = 0;
      } else if (this.bossPhase) {
        this.waveTimer = 0;
      } else {
        this.onWaveTimeout();
        return;
      }
    }

    this.player.update(time, delta);
    this.player.handleInput(this.cursors);

    this.enemyMgr.moveAllToward(this.player.x, this.player.y, delta);
    this.enemyMgr.rangedShoot(time, this.projectileMgr.enemyBullets, this.player.x, this.player.y);

    this.projectileMgr.checkHitsAgainst(this.enemyMgr.list, (b, e) => this.onBulletHit(b, e));
    this.projectileMgr.checkEnemyHits(this.player.x, this.player.y, time, this.player.iFrameTimer, (b) => this.onEnemyBulletHit(b));
    this.projectileMgr.checkPlayerContact(this.enemyMgr.list, this.player.x, this.player.y, time, this.player.iFrameTimer, (e) => this.onPlayerContact(e));
    this.projectileMgr.cleanupOffscreen();

    this.processSpawnSchedule(delta);
    if (!this.bossPhase && this.spawnRules.every(r => r.remaining <= 0) && this.enemyMgr.count === 0) {
      this.onWaveTimeout();
      return;
    }
    this.checkPickup();
    this.checkXpPickup();
    this.autoShoot(time);

    this.enemyMgr.updateBosses(time, delta, this.player.x, this.player.y, this.projectileMgr.enemyBullets);
    this.checkControlledKills();

    if (this.player.invincible) {
      const auraNearby = this.enemyMgr.getEnemiesInRange(this.player.x, this.player.y, 80);
      for (const e of auraNearby) {
        const hp = (e.getData("hp") as number) - 2;
        e.setData("hp", hp);
        if (hp <= 0) this.onEnemyKilled(e);
      }
    }
    this.updatePowerAuras(delta);
    const boss = this.enemyMgr.getBoss();
    if (boss) {
      const hp = boss.getData("hp") as number;
      const maxHp = boss.getData("bossHpMax") as number;
      const name = boss.getData("bossName") as string || "BOSS";
      this.hud.showBossHP(name, hp, maxHp);
    } else {
      this.hud.hideBossHP();
    }

    const w = this.player.activeWeapon;
    const isReloading = w ? w.reloading : false;
    this.hud.update(this.player.stats, this.player.weapons, this.player.activeWeaponIdx, isReloading, this.wave, this.waveTimer, this.bossPhase, this.player.grenadeCount, this.player.grenadeCooldown, this.enemyMgr.count, getWaveDuration(this.wave), this.player.abilityCooldown, this.player.powers, this.player.powerCooldowns, this.player.powerActive);
  }

  private startNextWave() {
    this.wave++;
    this.waveTimer = getWaveDuration(this.wave);
    this.bossActive = this.wave % 5 === 0;
    this.spawnRules = [];
    this.player.refillAmmo();

    const maxDefinedWave = WAVE_CONFIGS.length;
    let cfg: WaveConfig;
    if (this.wave <= maxDefinedWave) {
      cfg = WAVE_CONFIGS[this.wave - 1];
    } else {
      const base = WAVE_CONFIGS[maxDefinedWave - 1];
      const extraMult = 1 + (this.wave - maxDefinedWave) * 0.1;
      cfg = {
        enemies: base.enemies.map(e => ({ ...e, count: Math.round(e.count * extraMult) })),
        speedMult: base.speedMult * extraMult,
        hpMult: base.hpMult * extraMult,
        eliteChance: Math.min(0.5, (base.eliteChance ?? 0.2) + (this.wave - maxDefinedWave) * 0.02),
      };
    }
    const waveDuration = getWaveDuration(this.wave);
    const lastBatchTime = waveDuration - 2000;

    cfg.enemies.forEach((eg, index) => {
      const batchSize = Math.min(eg.count, 10);
      const batches = Math.ceil(eg.count / batchSize);
      const interval = batches > 1 ? Math.floor(lastBatchTime / batches) : lastBatchTime;
      const firstDelay = 500 + index * 1000;
      this.spawnRules.push({
        type: eg.type, batchSize, interval,
        timer: firstDelay, remaining: eg.count,
      });
    });

    if (this.bossActive && BOSS_DATA[this.wave]) {
      this.spawnRules.push({ type: "tank", batchSize: 1, interval: 0, timer: Math.round(lastBatchTime * 0.5), remaining: 1, boss: true, dropMult: BOSS_DATA[this.wave].dropMult });
    } else if (this.bossActive && this.wave > 30) {
      const dynamicDropMult = 30 + Math.floor((this.wave - 30) / 5) * 5;
      this.spawnRules.push({ type: "tank", batchSize: 1, interval: 0, timer: Math.round(lastBatchTime * 0.5), remaining: 1, boss: true, dropMult: dynamicDropMult });
    }
    if (this.player.ownedItems.has("medkit")) {
      this.player.heal(20);
    }

    const biome = getBiome(this.wave);
    this.cameras.main.setBackgroundColor(biome.bgColor);

    if (this.bossActive) AudioManager.bossWarning();
    this.hud.announce(this.bossActive ? '[BOSS]' : 'Wave ' + this.wave + ' - ' + biome.name);
    this.cameras.main.flash(200, 255, 255, 255);
  }

  private processSpawnSchedule(delta: number) {
    for (const rule of this.spawnRules) {
      if (rule.remaining <= 0) continue;
      rule.timer -= delta;
      if (rule.timer > 0) continue;
      const count = Math.min(rule.batchSize, rule.remaining);
      this.enemyMgr.spawnGroup({
        type: rule.type, count,
        elite: rule.elite, boss: rule.boss, dropMult: rule.dropMult,
      }, this.wave);
      rule.remaining -= count;
      if (rule.remaining > 0 && rule.interval > 0)
        rule.timer += rule.interval;
      else
        rule.timer = Infinity;
    }
  }

  private enterBossPhase() {
    this.bossPhase = true;
    this.waveTimer = 0;
    this.spawnRules = [];
    const toRemove: Phaser.Physics.Arcade.Sprite[] = [];
    for (const enemy of this.enemyMgr.list) {
      if (!enemy.active || enemy.getData("boss")) continue;
      toRemove.push(enemy);
    }
    for (const enemy of toRemove) {
      this.effects.deathEffect(enemy.x, enemy.y);
      const mult = enemy.getData("dropMult") as number || 1;
      this.spawnMaterialDrop(enemy.x, enemy.y, mult);
      this.enemyMgr.deactivateEnemy(enemy);
    }
    this.enemyMgr.list = this.enemyMgr.list.filter(e => e.getData("boss"));
    this.hud.announce("消灭 Boss!");
  }

  private onBossKilled() {
    this.spawnRules = [];
    this.collectAllDrops();
    this.bossPhase = false;
    this.bossActive = false;
    this.onWaveClear();
  }

  private onWaveTimeout() {
    for (const enemy of this.enemyMgr.list) {
      if (!enemy.active) continue;
      this.effects.deathEffect(enemy.x, enemy.y);
      const mult = enemy.getData("dropMult") as number || 1;
      this.spawnMaterialDrop(enemy.x, enemy.y, mult);
      this.enemyMgr.deactivateEnemy(enemy);
    }
    this.enemyMgr.list = [];
    this.collectAllDrops();
    this.onWaveClear();
  }

  private collectAllDrops() {
    let total = 0;
    for (const m of this.dropList) {
      total += m.getData("value") as number;
      m.destroy();
    }
    this.dropList = [];
    if (total > 0) {
      this.player.stats.materials += total;
      this.stats_materialsEarned += total;
      const text = this.add.text(W / 2, H / 2, `+${total} 材料`, {
        fontSize: "24px", color: "#0f8", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(200);
      this.tweens.add({
        targets: text, y: text.y - 50, alpha: 0, duration: 1000,
        onComplete: () => text.destroy(),
      });
    }

    let totalXp = 0;
    for (const orb of this.xpDropList) {
      totalXp += orb.getData("xp") as number;
      orb.destroy();
    }
    this.xpDropList = [];
    if (totalXp > 0) {
      const leveled = this.player.awardXP(totalXp);
      this.pendingLevelUps += leveled;
    }
  }

  private checkEvolutions(itemId: string) {
    const recipe = EVOLUTIONS.find(r => r.itemId === itemId && this.player.weapons.some(w => w.id === r.weaponId));
    if (!recipe) return;
    const idx = this.player.weapons.findIndex(w => w.id === recipe.weaponId);
    if (idx === -1) return;
    const oldW = this.player.weapons[idx];
    const evolved: Weapon = {
      ...recipe.result,
      level: oldW.level,
      lastFired: 0,
      ammo: recipe.result.ammoMax,
      reloading: false,
      reloadTimer: 0,
      mods: [...oldW.mods],
    };
    this.player.weapons[idx] = evolved;
    AudioManager.evolve();
    this.hud.announce(`进化! ${recipe.resultName}!`);
    this.cameras.main.flash(300, 255, 255, 100);
    this.shakeScreen(300, 0.015);
  }

  private onWaveClear() {
    if (this.gameOver) return;
    if (this.wave >= 30 && !this.endlessMode) {
      this.showVictory();
      return;
    }
    if (this.wave >= 30 && this.endlessMode) {
      this.hud.announce(`无尽模式 · 第 ${this.wave} 波!`);
    }
    if (this.pendingLevelUps > 0) {
      this.showLevelUpCards();
    } else {
      this.showShop();
    }
  }

  private showVictory() {
    this.gameOver = true;
    AudioManager.stopBGM();
    this.physics.pause();

    const newAchievements = Achievements.check({
      wave: this.wave, kills: this.stats_kills, bossKills: this.stats_bossKills,
      peakAlive: this.stats_peakAlive, materialsEarned: this.stats_materialsEarned,
      charId: this.player.charId, won: true,
    });
    const newChars = MetaProgress.checkCharUnlocks({
      kills: this.stats_kills, materialsEarned: this.stats_materialsEarned,
      wave: this.wave, won: true,
    });
    const allNew = [...newAchievements, ...newChars.map(id => {
      const r = MetaProgress.getCharUnlockRequirement(id);
      return r ? `🔓 解锁角色: ${r.name}` : "";
    }).filter(Boolean)];
    for (let i = 0; i < allNew.length; i++) {
      const txt = this.add.text(W / 2, H / 2 + 40 * i, `${allNew[i]}`, {
        fontSize: "16px", color: "#ff0", fontStyle: "bold", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5).setDepth(300);
    }

    this.victoryUI.show(this.wave, this.player.stats.level, this.stats_kills, this.stats_bossKills, this.stats_peakAlive, this.stats_materialsEarned,
      () => {
        this.cleanUpAndExit();
        this.scene.start("TitleScene");
      },
      () => {
        this.cleanUpAndExit();
        this.scene.start("CharacterSelectScene");
      },
    );
  }

  private cleanUpAndExit() {
    this.shopUI.hide();
    this.gameOverUI = null!;
    this.victoryUI = null!;
    this.enemyMgr.clearAll();
    this.projectileMgr.clearAll();
    this.dropList.forEach(m => m.destroy());
    this.dropList = [];
    this.xpDropList.forEach(o => o.destroy());
    this.xpDropList = [];
  }

  private showShop() {
    this.inShop = true;
    this.physics.pause();
    this.rerollCount = 0;
    this.shopUI.show(
      this.player.stats, this.player.weapons, this.player.activeWeaponIdx,
      this.player.ownedItems, this.player.powers, this.rerollCount, this.shopCallbacks
    );
  }

  private get shopCallbacks(): ShopCallback {
    return {
      buyWeapon: (w) => {
        this.player.addWeapon(w);
        this.closeShopAndNextWave();
      },
      buyMod: (mod) => {
        this.player.addModToActive(mod);
        this.closeShopAndNextWave();
      },
      buyItem: (itemId) => {
        this.player.ownedItems.add(itemId);
        const item = ITEMS.find(i => i.id === itemId);
        if (item?.apply) item.apply(this.player.stats, this.player.weapons);
        this.checkEvolutions(itemId);
        this.closeShopAndNextWave();
      },
      buyPower: (powerCfg) => {
        this.player.addPower(powerCfg);
        this.closeShopAndNextWave();
      },
      buyConsumable: (itemId) => {
        if (itemId === "adrenaline") {
          this.player.applyAdrenaline();
        } else if (itemId === "grenade") {
          this.player.grenadeCount += 3;
        } else {
          const c = CONSUMABLES.find(i => i.id === itemId);
          if (c?.apply) c.apply(this.player.stats, this.player.weapons);
        }
        this.closeShopAndNextWave();
      },
      reroll: () => {
        const cost = calcRerollCost(this.player.stats.level, this.rerollCount);
        this.player.stats.materials -= cost;
        this.rerollCount++;
        this.shopUI.show(
          this.player.stats, this.player.weapons, this.player.activeWeaponIdx,
          this.player.ownedItems, this.player.powers, this.rerollCount, this.shopCallbacks
        );
      },
      nextWave: () => {
        this.closeShopAndNextWave();
      },
      removeMod: (idx) => {
        const w = this.player.activeWeapon;
        if (!w) return;
        w.mods[idx].remove(w);
        w.mods.splice(idx, 1);
        this.shopUI.show(
          this.player.stats, this.player.weapons, this.player.activeWeaponIdx,
          this.player.ownedItems, this.player.powers, this.rerollCount, this.shopCallbacks
        );
      },
      discardWeapon: (idx) => {
        if (idx < 0 || idx >= this.player.weapons.length) return;
        this.player.weapons.splice(idx, 1);
        if (this.player.activeWeaponIdx >= this.player.weapons.length) {
          this.player.activeWeaponIdx = 0;
        }
        this.shopUI.show(
          this.player.stats, this.player.weapons, this.player.activeWeaponIdx,
          this.player.ownedItems, this.player.powers, this.rerollCount, this.shopCallbacks
        );
      },
    };
  }

  private closeShopAndNextWave() {
    this.shopUI.hide();
    this.inShop = false;
    this.physics.resume();
    this.startNextWave();
  }

  private showLevelUpCards() {
    AudioManager.levelUp();
    this.levelingUp = true;
    this.physics.pause();
    this.levelUpUI.show(
      this.player.stats, this.player.weapons, this.wave, this.player.charId,
      (upgrade) => {
        upgrade.apply(this.player.stats, this.player.weapons);
        this.pendingLevelUps--;
        this.levelUpUI.hide();
        this.levelingUp = false;
        this.physics.resume();
        if (this.pendingLevelUps > 0) {
          this.showLevelUpCards();
        } else {
          this.showShop();
        }
      }
    );
  }

  private splashHitEnemy(e: Phaser.Physics.Arcade.Sprite, dmg: number) {
    const hp = (e.getData("hp") as number) - dmg;
    e.setData("hp", hp);
    this.effects.damageNumber(e.x, e.y, dmg, false);
    if (hp <= 0) {
      this.onEnemyKilled(e);
    } else {
      this.effects.flashDamage(e);
    }
  }

  private onBulletHit(b: Phaser.Physics.Arcade.Sprite, e: Phaser.Physics.Arcade.Sprite): boolean | void {
    let dmg = b.getData("damage") as number;
    const range = b.getData("range") as number;
    if (range > 0) {
      const ox = b.getData("originX") as number;
      const oy = b.getData("originY") as number;
      const dist = Phaser.Math.Distance.Between(ox, oy, b.x, b.y);
      const falloff = 1 - 0.7 * Math.min(1, dist / range);
      dmg = Math.round(dmg * falloff);
    }
    const isCrit = (this.player.abilityBonusCrit || (this.player.stats.critChance > 0 && Math.random() < this.player.stats.critChance));
    if (isCrit) dmg *= 2;
    dmg = Math.round(dmg * this.player.abilityDmgMult);

    const splashRadius = b.getData("splashRadius") as number | undefined;
    if (splashRadius) {
      const splashDmg = Math.round(dmg * 0.5);
      this.projectileMgr.doSplashDamage(b.x, b.y, splashRadius, splashDmg, this.enemyMgr.list, (enemy, sdmg) => {
        this.splashHitEnemy(enemy, sdmg);
      }, e);
      const splashCircle = this.add.circle(b.x, b.y, splashRadius, 0xff8800, 0.25).setDepth(35);
      this.tweens.add({ targets: splashCircle, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 200, onComplete: () => splashCircle.destroy() });
    }

    const bId = b.getData("weaponId") as string;
    if (bId === "freeze") {
      e.setData("frozen", true);
      e.setData("frozenTimer", 2000);
      e.setTint(0x88ddff);
    }

    const penetrate = b.getData("penetrate") as number | undefined;
    this.effects.damageNumber(e.x, e.y, dmg, isCrit);
    AudioManager.hit();
    const hp = (e.getData("hp") as number) - dmg;
    e.setData("hp", hp);
    if (hp <= 0) {
      this.onEnemyKilled(e);
    } else {
      this.effects.flashDamage(e);
      const angle = Phaser.Math.Angle.Between(b.x, b.y, e.x, e.y);
      e.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      this.time.delayedCall(80, () => { if (e.active) e.setVelocity(0, 0); });
    }
    if (penetrate && penetrate > 0) {
      b.setData("penetrate", penetrate - 1);
      return false;
    }
    this.projectileMgr.deactivate(b);
  }

  private onEnemyBulletHit(b: Phaser.Physics.Arcade.Sprite): boolean {
    const dmg = b.getData("damage") as number;
    AudioManager.hit();
    const dead = this.player.takeDamage(dmg, this.time.now);
    if (dead) { this.endGame(); return true; }
    this.shakeScreen(120, 0.008);
    return false;
  }

  private onPlayerContact(e: Phaser.Physics.Arcade.Sprite): boolean {
    AudioManager.hit();
    const dead = this.player.takeDamage(10, this.time.now);
    if (dead) { this.endGame(); return true; }
    this.shakeScreen(120, 0.008);
    return false;
  }

  private onEnemyKilled(e: Phaser.Physics.Arcade.Sprite) {
    if (e.getData("killed")) return;
    e.setData("killed", true);
    this.effects.deathEffect(e.x, e.y);
    const mult = e.getData("dropMult") as number || 1;
    this.spawnMaterialDrop(e.x, e.y, mult);
    this.shakeScreen(80, 0.005);

    if (this.player.charId === "berserker") {
      this.player.heal(5);
    }

    AudioManager.kill();
    const eType = e.getData("type") as string;
    if (eType === "exploder") {
      AudioManager.explosion();
      const nearby = this.enemyMgr.getEnemiesInRange(e.x, e.y, 60);
      const toKill: Phaser.Physics.Arcade.Sprite[] = [];
      for (const other of nearby) {
        if (other === e) continue;
        const hp = (other.getData("hp") as number) - 30;
        other.setData("hp", hp);
        if (hp <= 0) toKill.push(other);
        else this.effects.flashDamage(other);
      }
      for (const tk of toKill) this.onEnemyKilled(tk);
      const dToPlayer = Phaser.Math.Distance.Between(e.x, e.y, this.player.x, this.player.y);
      if (dToPlayer < 60) {
        const dead = this.player.takeDamage(20, this.time.now);
        if (dead) { this.endGame(); return; }
      }
      this.effects.deathEffect(e.x, e.y);
      this.shakeScreen(150, 0.012);
    }

    const xpGain = XP_PER_KILL[eType as keyof typeof XP_PER_KILL] || 5;
    this.spawnXpDrop(e.x, e.y, xpGain);

    this.stats_kills++;
    this.stats_peakAlive = Math.max(this.stats_peakAlive, this.enemyMgr.count);
    if (e.getData("boss")) {
      this.stats_bossKills++;
      AudioManager.explosion();
      this.shakeScreen(300, 0.02);
      this.cameras.main.flash(300, 255, 0, 0);
      this.effects.deathEffect(e.x, e.y);
      this.effects.deathEffect(e.x - 20, e.y - 20);
      this.effects.deathEffect(e.x + 20, e.y + 20);
      this.time.delayedCall(200, () => this.onBossKilled());
    }

    this.enemyMgr.deactivateEnemy(e);
    const idx = this.enemyMgr.list.indexOf(e);
    if (idx !== -1) this.enemyMgr.list.splice(idx, 1);
  }

  private spawnMaterialDrop(x: number, y: number, mult: number) {
    const value = Phaser.Math.Between(1, 3) * mult;
    const drop = this.add.image(x, y, "material").setDepth(10);
    drop.setData("value", Math.round(value));
    this.dropList.push(drop);
  }

  private spawnXpDrop(x: number, y: number, xpAmount: number) {
    const orb = this.add.image(x, y, "xp_orb").setDepth(10);
    orb.setData("xp", xpAmount);
    this.xpDropList.push(orb);
  }

  private autoShoot(time: number) {
    const nearest = this.enemyMgr.getNearest(this.player.x, this.player.y);
    if (!nearest) return;

    for (const w of this.player.weapons) {
      if (w.reloading) continue;
      if (time - w.lastFired < w.fireRate) continue;

      const distToTarget = Phaser.Math.Distance.Between(this.player.x, this.player.y, nearest.x, nearest.y);
      if (distToTarget > w.range) continue;

      if (w.weaponType === "melee") {
        w.lastFired = time;
        const meleeDmg = Math.round(w.damage * this.player.abilityDmgMult);
        const nearby = this.enemyMgr.getEnemiesInRange(this.player.x, this.player.y, w.range);
        for (const e of nearby) {
          const hp = (e.getData("hp") as number) - meleeDmg;
          e.setData("hp", hp);
          this.effects.damageNumber(e.x, e.y, meleeDmg, false);
          if (hp <= 0) this.onEnemyKilled(e);
          else this.effects.flashDamage(e);
        }
        if (nearby.length > 0) {
          this.effects.deathEffect(nearest.x, nearest.y);
          this.shakeScreen(60, 0.003);
        }
        continue;
      }

      if (w.ammo <= 0) {
        this.player.startReload(w);
        continue;
      }

      w.lastFired = time;
      w.ammo--;

      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, nearest.x, nearest.y);
      const startAngle = angle - (w.spread * (w.bulletCount - 1)) / 2 * Math.PI / 180;

      const texKey = w.id === "laser" || w.id === "evolved_laser" ? "bullet_laser" : w.id === "freeze" || w.id === "evolved_freeze" ? "bullet_freeze" : "bullet";
      const isFreeze = w.id === "freeze" || w.id === "evolved_freeze";

      for (let i = 0; i < w.bulletCount; i++) {
        const a = startAngle + w.spread * i * Math.PI / 180;
        const bullet = this.projectileMgr.fireBullet(this.player.x, this.player.y, a, w.bulletSpeed, w.damage, w.range, w.splashRadius, w.penetrate, texKey);
        if (bullet && isFreeze) bullet.setData("weaponId", "freeze");
      }

      AudioManager.shoot();
      const muzzle = this.add.circle(this.player.x, this.player.y, 8, 0xffff88, 1).setDepth(40);
      this.tweens.add({ targets: muzzle, alpha: 0, scaleX: 2, scaleY: 2, duration: 120, onComplete: () => muzzle.destroy() });

      if (w.ammo <= 0) {
        this.player.startReload(w);
      }
    }
  }

  private checkPickup() {
    this.pullPickupList(this.dropList, "value", (m, val) => {
      this.player.stats.materials += val;
      this.stats_materialsEarned += val;
    }, "#0f8", 12);
  }

  private checkXpPickup() {
    this.pullPickupList(this.xpDropList, "xp", (orb, xpVal) => {
      const leveled = this.player.awardXP(xpVal);
      this.pendingLevelUps += leveled;
    }, "#4f4", 10);
  }

  private pullPickupList(
    list: Phaser.GameObjects.Image[],
    dataKey: string,
    onCollect: (obj: Phaser.GameObjects.Image, val: number) => void,
    color: string,
    fontSize: number,
  ) {
    const magnetRange = PICKUP_RANGE + this.player.stats.pickupRangeBonus + 100;
    const pullSpeed = 0.08;
    for (let i = list.length - 1; i >= 0; i--) {
      const obj = list[i];
      if (!obj.active) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
      if (d < PICKUP_RANGE + this.player.stats.pickupRangeBonus) {
        AudioManager.pickup();
        const val = obj.getData(dataKey) as number;
        onCollect(obj, val);
        const text = this.add.text(obj.x, obj.y, `+${val}`, {
          fontSize: `${fontSize}px`, color,
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({
          targets: text, y: text.y - 25, alpha: 0, duration: fontSize > 10 ? 600 : 400,
          onComplete: () => text.destroy(),
        });
        obj.destroy();
        list.splice(i, 1);
      } else if (d < magnetRange) {
        obj.x += (this.player.x - obj.x) * pullSpeed;
        obj.y += (this.player.y - obj.y) * pullSpeed;
      }
    }
  }

  
  private endGame() {
    this.gameOver = true;
    AudioManager.stopBGM();
    this.physics.pause();

    const newAchievements = Achievements.check({
      wave: this.wave, kills: this.stats_kills, bossKills: this.stats_bossKills,
      peakAlive: this.stats_peakAlive, materialsEarned: this.stats_materialsEarned,
      charId: this.player.charId, won: this.wave >= 30,
    });
    const newChars = MetaProgress.checkCharUnlocks({
      kills: this.stats_kills, materialsEarned: this.stats_materialsEarned,
      wave: this.wave, won: this.wave >= 30,
    });
    const allNew = [...newAchievements, ...newChars.map(id => {
      const r = MetaProgress.getCharUnlockRequirement(id);
      return r ? `🔓 解锁角色: ${r.name}` : "";
    }).filter(Boolean)];
    for (let i = 0; i < allNew.length; i++) {
      const txt = this.add.text(W / 2, H / 2 + 40 * i, `${allNew[i]}`, {
        fontSize: "18px", color: "#ff0", fontStyle: "bold", stroke: "#000", strokeThickness: 3,
      }).setOrigin(0.5).setDepth(300);
    }

    this.gameOverUI.show(this.wave, this.player.stats.level, this.stats_kills, this.stats_bossKills, this.stats_peakAlive, this.stats_materialsEarned,
      () => {
        this.cleanUpAndExit();
        this.scene.restart();
      },
      () => {
        this.cleanUpAndExit();
        this.scene.start("TitleScene");
      },
    );
  }

  private wasdKeys: Record<string, Phaser.Input.Keyboard.Key> = {};

  private setupWASD() {
    const kb = this.input.keyboard!;
    for (const k of ["A", "W", "S", "D"]) {
      const key = kb.addKey(Phaser.Input.Keyboard.KeyCodes[k as keyof typeof Phaser.Input.Keyboard.KeyCodes]);
      key.on("down", () => { this.player.wasd[k] = true; });
      key.on("up", () => { this.player.wasd[k] = false; });
    }
  }

  private pauseContainer!: Phaser.GameObjects.Container;

  private togglePause() {
    if (this.gameOver) return;
    this.paused = !this.paused;
    if (this.paused) {
      this.physics.pause();
      this.showPauseOverlay();
    } else {
      this.physics.resume();
      this.pauseContainer.setVisible(false);
    }
  }

  private showPauseOverlay() {
    this.pauseContainer.removeAll(true);
    this.pauseContainer.setVisible(true);

    const bg = this.add.rectangle(W / 2, H / 2, W, H, 0x000000, 0.65).setOrigin(0.5);
    const title = this.add.text(W / 2, 30, "游戏暂停", { fontSize: "36px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);

    const statsX = 240;
    const s = this.player.stats;
    const charName = (this.scene.settings.data as { character?: { name?: string } } | undefined)?.character?.name ?? "";
    const endlessTag = this.endlessMode ? "  [无尽模式]" : "";
    const statsLines = [
      `${charName}  Lv.${s.level}  波次 ${this.wave}${endlessTag}  击杀 ${this.stats_kills}`,
      `HP: ${s.hp}/${s.maxHp}  护甲: ${s.armor}  材料: ${s.materials}`,
      `移速: ${s.speed}  暴击: ${Math.round(s.critChance * 100)}%  闪避: ${Math.round(s.dodge * 100)}%`,
      `经验: ${s.xp}/${s.xpToNext}`,
    ];
    const statsPanel = this.add.rectangle(statsX, 200, 420, 120, 0x111122, 0.85).setStrokeStyle(1, 0x4466aa);
    const statsText = this.add.text(statsX - 195, 155, statsLines.join("\n"), { fontSize: "13px", color: "#ccc", lineSpacing: 8 });

    const weaponY = 290;
    const weaponLabel = this.add.text(statsX - 195, weaponY, "━ 武器 ━", { fontSize: "13px", color: "#ff0" });
    const wpLines = this.player.weapons.map((w, i) => {
      const active = i === this.player.activeWeaponIdx ? "★ " : "  ";
      const ammoStr = w.weaponType === "ranged" ? ` ${w.ammo}/${w.ammoMax}` : "";
      const modStr = w.mods.length > 0 ? ` [${w.mods.map(m => m.name).join(",")}]` : "";
      return `${active}Lv.${w.level} ${w.name} 伤害${w.damage} 射速${w.fireRate}ms${ammoStr}${modStr}`;
    });
    const weaponText = this.add.text(statsX - 195, weaponY + 20, wpLines.join("\n"), { fontSize: "12px", color: "#aaa", lineSpacing: 6 });

    const powerY = weaponY + 20 + this.player.weapons.length * 22 + 10;
    const ownedPower = this.player.powers.filter(p => p);
    if (ownedPower.length > 0) {
      const powerLabel = this.add.text(statsX - 195, powerY, "━ 异能 ━", { fontSize: "13px", color: "#f4f" });
      const pwLines = ownedPower.map(p => `  ${p!.name} Lv.${p!.level}/${p!.maxLevel}`);
      const powerText = this.add.text(statsX - 195, powerY + 20, pwLines.join("\n"), { fontSize: "12px", color: "#aaa", lineSpacing: 6 });
      this.pauseContainer.add([powerLabel, powerText]);
    }

    const ownedItems = [...this.player.ownedItems].map(id => {
      const item = ITEMS.find(i => i.id === id);
      return item ? item.name : id;
    });
    if (ownedItems.length > 0) {
      const itemY = powerY + (ownedPower.length > 0 ? 20 + ownedPower.length * 22 : 0) + 10;
      const itemLabel = this.add.text(statsX - 195, itemY, "━ 道具 ━", { fontSize: "13px", color: "#4f8" });
      const itemText = this.add.text(statsX - 195, itemY + 20, `  ${ownedItems.join(" · ")}`, { fontSize: "12px", color: "#aaa" });
      this.pauseContainer.add([itemLabel, itemText]);
    }

    const achY = Math.max(460, powerY + (ownedPower.length > 0 ? 20 + ownedPower.length * 22 : 0) + (ownedItems.length > 0 ? 40 : 0));
    const achUnlocked = Achievements.unlocked;
    const achTotal = Achievements.getAll().length;
    const achText = this.add.text(statsX - 195, achY, `成就: ${achUnlocked.length}/${achTotal}`, { fontSize: "13px", color: "#ff0" });
    this.pauseContainer.add([achText]);

    const btnX = 900;
    const resumeBtn = this.add.rectangle(btnX, 140, 200, 50, 0x44aa44).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0x66cc66);
    const resumeLabel = this.add.text(btnX, 140, "继续游戏", { fontSize: "18px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    resumeBtn.on("pointerover", () => resumeBtn.setFillStyle(0x55cc55));
    resumeBtn.on("pointerout", () => resumeBtn.setFillStyle(0x44aa44));
    resumeBtn.on("pointerdown", () => this.togglePause());

    const setBtn = this.add.rectangle(btnX, 210, 200, 50, 0x884488).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xaa66aa);
    const setLabel = this.add.text(btnX, 210, "设置", { fontSize: "18px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    setBtn.on("pointerover", () => setBtn.setFillStyle(0xaa55aa));
    setBtn.on("pointerout", () => setBtn.setFillStyle(0x884488));
    setBtn.on("pointerdown", () => {
      this.settingsUI.show(() => { this.pauseContainer.setVisible(true); });
      this.pauseContainer.setVisible(false);
    });

    const menuBtn = this.add.rectangle(btnX, 280, 200, 50, 0xaa4444).setInteractive({ useHandCursor: true }).setStrokeStyle(2, 0xcc6666);
    const menuLabel = this.add.text(btnX, 280, "返回主菜单", { fontSize: "18px", color: "#fff", fontStyle: "bold" }).setOrigin(0.5);
    menuBtn.on("pointerover", () => menuBtn.setFillStyle(0xcc5555));
    menuBtn.on("pointerout", () => menuBtn.setFillStyle(0xaa4444));
    menuBtn.on("pointerdown", () => {
      this.physics.resume();
      this.settingsUI.hide();
      this.enemyMgr.clearAll();
      this.projectileMgr.clearAll();
      this.dropList.forEach(m => m.destroy());
      this.dropList = [];
      AudioManager.stopBGM();
      this.scene.start("TitleScene");
    });

    this.pauseContainer.add([bg, title, statsPanel, statsText, weaponLabel, weaponText, resumeBtn, resumeLabel, setBtn, setLabel, menuBtn, menuLabel]);
  }

  private setupKeys() {
    const kb = this.input.keyboard!;
    const escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    const qKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.Q);
    const rKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    const gKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.G);
    const fKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    escKey.on("down", () => this.togglePause());

    qKey.on("down", () => this.player.switchWeapon());
    rKey.on("down", () => {
      const w = this.player.activeWeapon;
      if (w && !w.reloading && w.weaponType === "ranged" && w.ammo < w.ammoMax) {
        this.player.startReload(w);
      }
    });
    gKey.on("down", () => {
      if (this.player.grenadeCount <= 0 || this.player.grenadeCooldown > 0) return;
      this.player.grenadeCount--;
      this.player.grenadeCooldown = this.player.grenadeCooldownDuration;
      const nearest = this.enemyMgr.getNearest(this.player.x, this.player.y);
      const angle = Phaser.Math.Angle.Between(
        this.player.x, this.player.y,
        nearest?.x ?? this.player.x + 1, nearest?.y ?? this.player.y
      );
      const g = this.add.circle(this.player.x, this.player.y, 6, 0x44ff44).setDepth(10);
      this.tweens.add({
        targets: g,
        x: this.player.x + Math.cos(angle) * 200,
        y: this.player.y + Math.sin(angle) * 200,
        duration: 500,
        ease: "Power1",
        onComplete: () => {
          const nearby = this.enemyMgr.getEnemiesInRange(g.x, g.y, 100);
          for (const e of nearby) {
            const hp = (e.getData("hp") as number) - 70;
            e.setData("hp", hp);
            if (hp <= 0) this.onEnemyKilled(e);
            else this.effects.flashDamage(e);
          }
          this.effects.deathEffect(g.x, g.y);
          g.destroy();
        },
      });
    });
    fKey.on("down", () => this.useAbility());
    const oneKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE);
    const twoKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO);
    oneKey.on("down", () => this.usePower(0));
    twoKey.on("down", () => this.usePower(1));
  }

  private powerAuraTimers = [0, 0];

  private updatePowerAuras(delta = this.game.loop.delta) {
    for (let i = 0; i < MAX_POWERS; i++) {
      if (!this.player.powerActive[i]) continue;
      const p = this.player.powers[i];
      if (!p) continue;
      if (p.id !== "psychicStorm" && p.id !== "lifeDrain") continue;
      this.powerAuraTimers[i] -= delta;
      if (this.powerAuraTimers[i] > 0) continue;
      this.powerAuraTimers[i] = 500;
      const dmg = p.id === "psychicStorm"
        ? p.baseDamage + (p.level - 1) * 5
        : p.baseDamage + (p.level - 1) * 3;
      const nearby = this.enemyMgr.getEnemiesInRange(this.player.x, this.player.y, 80);
      for (const e of nearby) {
        const hp = (e.getData("hp") as number) - dmg;
        e.setData("hp", hp);
        if (hp <= 0) this.onEnemyKilled(e);
        else this.effects.flashDamage(e);
      }
      if (p.id === "lifeDrain") {
        const totalDmg = dmg * nearby.length;
        if (totalDmg > 0) this.player.heal(Math.round(totalDmg * 0.5));
      }
    }
  }

  private shakeScreen(duration: number, intensity: number) {
    if (Settings.screenShake) this.cameras.main.shake(duration, intensity);
  }

  private checkControlledKills() {
    const dead: Phaser.Physics.Arcade.Sprite[] = [];
    for (const e of this.enemyMgr.list) {
      if (!e.active || e.getData("controlled")) continue;
      if ((e.getData("hp") as number) <= 0) dead.push(e);
    }
    for (const e of dead) this.onEnemyKilled(e);
  }

  private usePower(slot: number) {
    if (this.gameOver || this.paused || this.inShop || this.levelingUp) return;
    const p = this.player.powers[slot];
    if (!p || this.player.powerCooldowns[slot] > 0 || this.player.powerActive[slot]) return;

    if (p.id === "zombieControl") {
      const nearest = this.enemyMgr.getNearest(this.player.x, this.player.y);
      if (!nearest) return;
    }

    this.player.activatePower(slot);

    switch (p.id) {
      case "telekineticWave": {
        const dmg = p.baseDamage + (p.level - 1) * 10;
        const range = 120 + (p.level - 1) * 10;
        const nearby = this.enemyMgr.getEnemiesInRange(this.player.x, this.player.y, range);
        for (const e of nearby) {
          const hp = (e.getData("hp") as number) - dmg;
          e.setData("hp", hp);
          if (hp <= 0) { this.onEnemyKilled(e); continue; }
          this.effects.flashDamage(e);
          const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, e.x, e.y);
          const body = e.body as Phaser.Physics.Arcade.Body;
          if (body) { body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400); }
          this.time.delayedCall(200, () => {
            if (body) { body.setVelocity(0, 0); }
          });
        }
        const ring = this.add.circle(this.player.x, this.player.y, 10, 0x88aaff, 0.5).setDepth(35);
        this.tweens.add({ targets: ring, scaleX: range / 5, scaleY: range / 5, alpha: 0, duration: 300, onComplete: () => ring.destroy() });
        break;
      }
      case "zombieControl": {
        const nearest = this.enemyMgr.getNearest(this.player.x, this.player.y);
        if (nearest) {
          nearest.setTint(0x88aaff);
          nearest.setData("controlled", true);
          nearest.setData("controlledDuration", p.baseDuration + (p.level - 1) * 2000);
          nearest.setData("controlledTimer", 0);
          this.hud.announce("🧠 丧尸控制!");
        }
        break;
      }
      case "psychicStorm": {
        this.hud.announce("精神风暴!");
        this.powerAuraTimers[slot] = 500;
        const stormGfx = this.add.circle(this.player.x, this.player.y, 80, 0xaa44ff, 0.15).setDepth(30);
        const checkId = this.time.addEvent({
          delay: 50, loop: true,
          callback: () => {
            if (!this.scene.isActive() || !this.player.powerActive[slot]) { checkId.destroy(); if (stormGfx.active) stormGfx.destroy(); return; }
            stormGfx.setPosition(this.player.x, this.player.y);
          },
        });
        break;
      }
      case "precognition": {
        this.hud.announce("预知!");
        this.player.sprite.setTint(0x8888ff);
        const clearTint = () => {
          if (this.player.sprite.active && !this.player.powerActive[slot]) this.player.sprite.clearTint();
        };
        this.time.delayedCall(p.baseDuration + (p.level - 1) * 1000, clearTint);
        break;
      }
      case "gravityField": {
        const dmg = p.baseDamage + (p.level - 1) * 15;
        const range = 120;
        const target = this.enemyMgr.getNearest(this.player.x, this.player.y);
        const tx = target?.x ?? this.player.x + 100;
        const ty = target?.y ?? this.player.y;
        const nearby = this.enemyMgr.getEnemiesInRange(tx, ty, range);
        for (const e of nearby) {
          const hp = (e.getData("hp") as number) - dmg;
          e.setData("hp", hp);
          if (hp <= 0) { this.onEnemyKilled(e); continue; }
          this.effects.flashDamage(e);
          const angle = Phaser.Math.Angle.Between(e.x, e.y, tx, ty);
          const body = e.body as Phaser.Physics.Arcade.Body;
          if (body) { body.setVelocity(Math.cos(angle) * 350, Math.sin(angle) * 350); }
          this.time.delayedCall(150, () => {
            if (body) { body.setVelocity(0, 0); }
          });
        }
        const hole = this.add.circle(tx, ty, 20, 0x4400aa, 0.6).setDepth(35);
        this.tweens.add({ targets: hole, scaleX: 4, scaleY: 4, alpha: 0, duration: 400, onComplete: () => hole.destroy() });
        this.hud.announce("重力场!");
        break;
      }
      case "lifeDrain": {
        this.hud.announce("💀 生命汲取!");
        this.powerAuraTimers[slot] = 500;
        const drainGfx = this.add.circle(this.player.x, this.player.y, 80, 0xff2266, 0.12).setDepth(30);
        const checkId = this.time.addEvent({
          delay: 50, loop: true,
          callback: () => {
            if (!this.scene.isActive() || !this.player.powerActive[slot]) { checkId.destroy(); if (drainGfx.active) drainGfx.destroy(); return; }
            drainGfx.setPosition(this.player.x, this.player.y);
          },
        });
        break;
      }
    }
  }

  private useAbility() {
    if (this.gameOver || this.paused || this.inShop || this.levelingUp) return;
    if (this.player.abilityCooldown > 0 || this.player.abilityActive) return;
    this.player.abilityCooldown = this.player.abilityCooldownDuration;

    switch (this.player.charId) {
      case "merc":
        this.player.activateAbility({ duration: 6000, bonusCrit: true });
        break;
      case "spec":
        this.player.activateAbility({ duration: 4000, fireRateBoost: 2 });
        break;
      case "sniper":
        this.player.activateAbility({ duration: 5000, dmgMult: 1.5 });
        break;
      case "fireman":
        this.player.activateAbility({ duration: 3000, invincible: true });
        break;
      case "lucky":
        this.player.activateAbility({ duration: 5000, bonusDrops: true });
        break;
      case "tank":
        this.player.activateAbility({ duration: 5000, armorBonus: 10 });
        break;
      case "berserker":
        this.player.activateAbility({ duration: 4000, fireRateBoost: 1.8 });
        break;
    }
    this.hud.announce("技能发动!");
  }
}
