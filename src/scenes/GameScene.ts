import Phaser from "phaser";
import { Weapon, W, H, PICKUP_RANGE, Power, MAX_POWERS, PowerConfig, Character, EnemyType } from "../types";
import { Settings, DEFAULT_KEY_BINDINGS } from "../utils/Settings";
import { SettingsUI } from "../ui/SettingsUI";
import { VictoryUI } from "../ui/VictoryUI";
import { calcRerollCost, ITEMS, XP_PER_KILL, EVOLUTIONS, getBiome, DIFFICULTY_TIERS, ENEMY_CONFIG, randomEdgePos } from "../config";
import { AudioManager } from "../utils/AudioManager";
import { Achievements } from "../utils/Achievements";
import { MetaProgress } from "../utils/MetaProgress";
import { EffectsManager } from "../utils/EffectsManager";
import { Player } from "../entities/Player";
import { EnemyManager } from "../entities/EnemyManager";
import { ProjectileManager } from "../entities/ProjectileManager";
import { HUDManager } from "../ui/HUDManager";
import { ShopUI, ShopCallback } from "../ui/ShopUI";
import { LevelUpUI } from "../ui/LevelUpUI";
import { GameOverUI } from "../ui/GameOverUI";

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private enemyMgr!: EnemyManager;
  private projectileMgr!: ProjectileManager;
  private hud!: HUDManager;
  private shopUI!: ShopUI;
  private levelUpUI!: LevelUpUI;
  private gameOverUI!: GameOverUI;
  private victoryUI!: VictoryUI;
  private effects!: EffectsManager;

  private wave = 1;
  private enemiesInWave = 0;
  private enemiesSpawned = 0;
  private enemiesAlive = 0;
  private isWaveActive = false;
  private isWaveDelay = true;
  private waveDelayTimer = 0;
  private spawnTimer = 0;
  private spawnInterval = 800;
  private attackCooldown = 0;
  private materialDropRate = 0.6;
  private activeEnemies: Phaser.Physics.Arcade.Sprite[] = [];

  private gameOver = false;
  private paused = false;
  private inShop = false;
  private levelingUp = false;

  private pendingLevelUps = 0;
  private rerollCount = 0;
  private stats_kills = 0;
  private stats_bossKills = 0;
  private stats_peakAlive = 0;
  private stats_materialsEarned = 0;
  private dropList: Phaser.GameObjects.Image[] = [];
  private materialPool!: Phaser.GameObjects.Group;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private settingsUI!: SettingsUI;
  private endlessMode = false;
  private difficultyLevel = 1;
  private difficultyDmgMult = 1;

  constructor() {
    super("GameScene");
  }

  create() {
    const charData = (this.scene.settings.data as { character?: Character })?.character;
    this.player = new Player(this, charData);
    this.enemyMgr = new EnemyManager(this);
    this.projectileMgr = new ProjectileManager(this);
    this.hud = new HUDManager(this, {
      onUseAbility: () => this.useAbility(),
      onUsePower: (slot) => this.usePower(slot),
    });
    this.shopUI = new ShopUI(this);
    this.levelUpUI = new LevelUpUI(this);
    this.gameOverUI = new GameOverUI(this);
    this.victoryUI = new VictoryUI(this);
    this.effects = new EffectsManager(this);
    this.settingsUI = new SettingsUI(this);

    const sceneData = this.scene.settings.data as { character?: Character; endlessMode?: boolean; difficulty?: number } | undefined;
    this.endlessMode = sceneData?.endlessMode ?? false;
    const diffId = sceneData?.difficulty ?? 1;
    this.difficultyLevel = Phaser.Math.Clamp(diffId, 0, DIFFICULTY_TIERS.length - 1);
    this.difficultyDmgMult = DIFFICULTY_TIERS[this.difficultyLevel].dmgMult;

    this.wave = 1;
    this.enemiesInWave = 0;
    this.enemiesSpawned = 0;
    this.enemiesAlive = 0;
    this.isWaveActive = false;
    this.isWaveDelay = true;
    this.waveDelayTimer = 0;
    this.spawnTimer = 0;
    this.spawnInterval = 800;
    this.attackCooldown = 0;
    this.activeEnemies = [];
    this.gameOver = false;
    this.paused = false;
    this.inShop = false;
    this.levelingUp = false;
    this.pendingLevelUps = 0;
    this.rerollCount = 0;
    this.stats_kills = 0;
    this.stats_bossKills = 0;
    this.stats_peakAlive = 0;
    this.stats_materialsEarned = 0;
    this.dropList = [];
    this.player.resetState();

    this.pauseContainer = this.add.container(0, 0).setVisible(false).setDepth(200);

    this.physics.world.setBounds(0, 0, W, H);
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.setupWASD();
    this.setupKeys();

    AudioManager.init();
    AudioManager.startBGM();

    this.materialPool = this.add.group({ classType: Phaser.GameObjects.Image, maxSize: 300 });


    this.physics.add.overlap(
      this.projectileMgr.bullets,
      this.enemyMgr.group,
      (_b, _e) => {
        this.onBulletHit(_b as Phaser.Physics.Arcade.Sprite, _e as Phaser.Physics.Arcade.Sprite);
      }
    );

    this.showControlsHint();
    this.startWave();
  }

  private showControlsHint() {
    const b = Settings.getAllBindings();
    const hint = this.add.text(W / 2, H - 45, `${b.switch} 切枪  ${b.reload} 换弹  ${b.grenade} 手雷  ${b.power1}/${b.power2} 异能  ${b.ability} 技能 ${b.pause} 暂停`, {
      fontSize: "12px", color: "#fff", fontStyle: "bold",
      stroke: "#000", strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({
      targets: hint, alpha: 0, delay: 4000, duration: 1000,
      onComplete: () => hint.destroy(),
    });
  }

  update(time: number, delta: number) {
    if (this.gameOver || this.inShop || this.levelingUp || this.paused) return;

    this.player.update(time, delta);

    this.handleMovement();

    this.attackCooldown -= delta;
    if (this.attackCooldown <= 0 && this.isWaveActive) {
      this.autoShoot(time);
      const w = this.player.activeWeapon;
      if (w) this.attackCooldown = w.fireRate;
    }

    if (this.isWaveActive && this.enemiesSpawned < this.enemiesInWave) {
      this.spawnTimer -= delta;
      if (this.spawnTimer <= 0) {
        this.spawnEnemy();
        this.spawnTimer = this.spawnInterval;
      }
    }

    if (this.isWaveDelay) {
      this.waveDelayTimer -= delta;
      if (this.waveDelayTimer <= 0) {
        this.isWaveDelay = false;
        this.startWave();
      }
    }

    this.enemyMgr.moveAllToward(this.player.x, this.player.y, delta);
    this.enemyMgr.rangedShoot(time, this.projectileMgr.enemyBullets, this.player.x, this.player.y);

    this.projectileMgr.checkEnemyHits(this.player.x, this.player.y, time, this.player.iFrameTimer, (b) => this.onEnemyBulletHit(b));
    this.projectileMgr.checkPlayerContact(this.activeEnemies, this.player.x, this.player.y, time, this.player.iFrameTimer, (e) => this.onPlayerContact(e));
    this.projectileMgr.cleanupOffscreen();

    this.checkPickup();
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
    this.hud.hideBossHP();

    if (this.isWaveActive && this.enemiesAlive <= 0 && this.enemiesSpawned >= this.enemiesInWave) {
      this.onWaveComplete();
    }

    const buffs: { label: string; color: number }[] = [];
    if (this.player.abilityActive) {
      const abilityLabels: Record<string, string> = {
        merc: "精准射击", spec: "速射", sniper: "锁定",
        fireman: "火焰盾", lucky: "聚宝", tank: "铁壁", berserker: "狂暴",
      };
      buffs.push({ label: abilityLabels[this.player.charId] || "技能", color: 0xaa44ff });
    }
    if (this.player.invincible) buffs.push({ label: "无敌", color: 0xffaa00 });
    if (this.player.speedBuffTimer > 0) buffs.push({ label: "加速", color: 0x44aaff });
    if (this.player.fireRateBuffTimer > 0) buffs.push({ label: "速射", color: 0xff6644 });
    this.hud.update(this.player.stats, this.player.weapons, this.player.activeWeaponIdx, this.wave, 0, this.player.grenadeCount, this.player.grenadeCooldown, this.activeEnemies.filter(e => e.active).length, 0, this.player.abilityCooldown, this.player.powers, this.player.powerCooldowns, this.player.powerActive, buffs);
  }

  private handleMovement() {
    const speed = Math.round(this.player.stats.speed * this.player.speedMult);
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasdKeys.A) vx -= 1;
    if (this.cursors.right.isDown || this.wasdKeys.D) vx += 1;
    if (this.cursors.up.isDown || this.wasdKeys.W) vy -= 1;
    if (this.cursors.down.isDown || this.wasdKeys.S) vy += 1;

    if (vx !== 0) this.player.sprite.setFlipX(vx < 0);

    if (vx !== 0 || vy !== 0) {
      const len = Math.sqrt(vx * vx + vy * vy);
      this.player.sprite.setVelocity((vx / len) * speed, (vy / len) * speed);
    } else {
      this.player.sprite.setVelocity(0, 0);
    }
  }

  private startWave() {
    this.enemiesInWave = Math.min(40, 6 + this.wave * 2);
    this.enemiesSpawned = 0;
    this.enemiesAlive = 0;
    this.isWaveActive = true;
    this.spawnInterval = Math.max(400, 800 - this.wave * 10);
    this.spawnTimer = 1000;

    if (this.player.ownedItems.has("medkit")) {
      this.player.heal(20);
    }

    const biome = getBiome(this.wave);
    this.cameras.main.setBackgroundColor(biome.bgColor);

    this.hud.announce('Wave ' + this.wave + ' - ' + biome.name);
    this.cameras.main.flash(200, 255, 255, 255);
  }

  private spawnEnemy() {
    const types: EnemyType[] = ["normal"];
    if (this.wave >= 2) types.push("fast");
    if (this.wave >= 4) types.push("ranged");
    if (this.wave >= 5) types.push("tank");
    if (this.wave >= 8) types.push("charger");
    if (this.wave >= 10) types.push("exploder");
    if (this.wave >= 12) types.push("healer");
    if (this.wave >= 14) types.push("invisible");

    const type = types[Math.floor(Math.random() * types.length)];
    const eCfg = ENEMY_CONFIG[type];
    const diff = DIFFICULTY_TIERS[this.difficultyLevel];
    const hpMult = (0.8 + this.wave * 0.06) * diff.hpMult;
    const spdMult = (0.9 + this.wave * 0.04) * diff.speedMult;

    const pos = randomEdgePos();
    const texKey = this.enemyMgr.getTextureForType(type);
    const e = this.enemyMgr.getFromPool(pos.x, pos.y, texKey);
    if (!e) return;

    e.setTint(eCfg.tint);
    e.setData("hp", Math.round(eCfg.hp * hpMult));
    e.setData("maxHp", Math.round(eCfg.hp * hpMult));
    e.setData("speed", Math.round(eCfg.speed * spdMult));
    e.setData("type", type);
    e.setData("contactDamage", Math.round(5 + this.wave * 0.5));
    e.setData("dropMult", eCfg.dropMult);
    if (type === "charger") e.setData("chargeTimer", Phaser.Math.Between(500, 1000));

    const finalScale = eCfg.scale;
    e.setScale(0);
    this.tweens.add({ targets: e, scaleX: finalScale, scaleY: finalScale, duration: 200, ease: "Back.easeOut" });

    this.enemyMgr.addToList(e);
    this.activeEnemies.push(e);
    this.enemiesSpawned++;
    this.enemiesAlive++;
  }

  private onWaveComplete() {
    this.isWaveActive = false;
    this.collectAllDrops();
    this.onWaveClear();
  }

  private collectAllDrops() {
    let total = 0;
    for (const m of this.dropList) {
      total += m.getData("value") as number;
      m.setActive(false).setVisible(false);
    }
    this.dropList = [];
    if (total > 0) {
      this.player.stats.materials += total;
      this.stats_materialsEarned += total;
      const text = this.add.text(W / 2, H / 2, `+${total} 材料`, {
        fontSize: "22px", color: "#0f8", fontStyle: "bold",
      }).setOrigin(0.5).setDepth(200);
      this.tweens.add({
        targets: text, y: text.y - 50, alpha: 0, duration: 1000,
        onComplete: () => text.destroy(),
      });
    }
  }

  private checkEvolutions(itemId: string) {
    const recipe = EVOLUTIONS.find(r => r.itemId === itemId && this.player.weapons.some(w => w.id === r.weaponId));
    if (!recipe) return;
    const idx = this.player.weapons.findIndex(w => w.id === recipe.weaponId);
    if (idx === -1) return;
    const oldW = this.player.weapons[idx];
    const base = WEAPON_CONFIGS.find(w => w.id === recipe.weaponId);
    const dmgMult = base ? oldW.damage / base.damage : 1;
    const frMult = base ? base.fireRate / oldW.fireRate : 1;
    const evolved: Weapon = {
      ...recipe.result,
      damage: Math.round(recipe.result.damage * dmgMult),
      fireRate: Math.round(recipe.result.fireRate / frMult),
      bulletSpeed: recipe.result.bulletSpeed ? Math.round(recipe.result.bulletSpeed * dmgMult) : 0,
      range: Math.round(recipe.result.range * (base ? oldW.range / base.range : 1)),
      level: oldW.level,
      lastFired: 0,
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
    this.isWaveDelay = true;
    this.waveDelayTimer = 3000;
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

    const nextDiff = this.difficultyLevel + 1;
    if (nextDiff < DIFFICULTY_TIERS.length) {
      MetaProgress.setUnlockedDifficulty(nextDiff);
    }

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
    this.shopUI.destroy();
    this.levelUpUI.destroy();
    this.gameOverUI.destroy();
    this.victoryUI.destroy();
    this.settingsUI.hide();
    this.hud.destroy();
    this.effects.destroy();
    this.enemyMgr.clearAll();
    this.projectileMgr.clearAll();
    this.dropList.forEach(m => { if (m.active) m.setActive(false).setVisible(false); });
    this.dropList = [];
    this.pauseContainer.removeAll(true);

  }

  private showShop() {
    this.inShop = true;
    this.physics.pause();
    this.rerollCount = 0;
    this.shopUI.show(
      this.player.stats, this.player.weapons, this.player.ownedItems,
      this.rerollCount, this.shopCallbacks
    );
  }

  private get shopCallbacks(): ShopCallback {
    return {
      buyWeapon: (w) => {
        this.player.addWeapon(w);
        this.closeShopAndNextWave();
      },
      buyItem: (itemId) => {
        this.player.ownedItems.add(itemId);
        const item = ITEMS.find(i => i.id === itemId);
        if (item?.apply) item.apply(this.player.stats, this.player.weapons);
        this.checkEvolutions(itemId);
        this.closeShopAndNextWave();
      },
      buyHpSmall: () => {
        this.player.heal(30);
        this.closeShopAndNextWave();
      },
      sellWeapon: (idx) => {
        if (idx < 0 || idx >= this.player.weapons.length) return;
        const w = this.player.weapons[idx];
        this.player.stats.materials += Math.max(1, Math.round(w.cost * 0.5));
        this.player.weapons.splice(idx, 1);
        if (this.player.activeWeaponIdx >= this.player.weapons.length) {
          this.player.activeWeaponIdx = 0;
        }
        this.shopUI.show(
          this.player.stats, this.player.weapons, this.player.ownedItems,
          this.rerollCount, this.shopCallbacks
        );
      },
      reroll: () => {
        const cost = calcRerollCost(this.player.stats.level, this.rerollCount);
        this.player.stats.materials -= cost;
        this.rerollCount++;
        this.shopUI.show(
          this.player.stats, this.player.weapons, this.player.ownedItems,
          this.rerollCount, this.shopCallbacks
        );
      },
      nextWave: () => {
        this.closeShopAndNextWave();
      },
    };
  }

  private closeShopAndNextWave() {
    this.shopUI.hide();
    this.inShop = false;
    this.physics.resume();
    this.wave++;
    this.startWave();
  }

  private showLevelUpCards() {
    AudioManager.levelUp();
    this.cameras.main.flash(400, 255, 215, 0);
    this.hud.announce("升级!");
    const ring = this.add.circle(this.player.x, this.player.y, 20, 0xffd700, 0.4).setDepth(35);
    this.tweens.add({ targets: ring, scaleX: 5, scaleY: 5, alpha: 0, duration: 500, onComplete: () => ring.destroy() });
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

  private onBulletHit(b: Phaser.Physics.Arcade.Sprite, e: Phaser.Physics.Arcade.Sprite): void {
    if (e.getData("controlled")) return;

    const penetrate = b.getData("penetrate") as number | undefined;
    if (penetrate !== undefined) {
      let hitSet: Set<Phaser.Physics.Arcade.Sprite> = b.getData("hitSet");
      if (!hitSet) {
        hitSet = new Set();
        b.setData("hitSet", hitSet);
      }
      if (hitSet.has(e)) return;
      hitSet.add(e);
    }

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
      this.projectileMgr.doSplashDamage(b.x, b.y, splashRadius, splashDmg, this.activeEnemies, (enemy, sdmg) => {
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
    if (penetrate !== undefined && penetrate > 0) {
      b.setData("penetrate", penetrate - 1);
      return;
    }
    this.projectileMgr.deactivate(b);
  }

  private onEnemyBulletHit(b: Phaser.Physics.Arcade.Sprite): boolean {
    const dmg = Math.round((b.getData("damage") as number) * this.difficultyDmgMult);
    AudioManager.hit();
    const dead = this.player.takeDamage(dmg, this.time.now);
    if (dead) { this.endGame(); return true; }
    this.shakeScreen(120, 0.008);
    return false;
  }

  private onPlayerContact(e: Phaser.Physics.Arcade.Sprite): boolean {
    AudioManager.hit();
    const dmg = (e.getData("contactDamage") as number) || 10;
    const dead = this.player.takeDamage(Math.round(dmg * this.difficultyDmgMult), this.time.now);
    if (dead) { this.endGame(); return true; }
    this.shakeScreen(120, 0.008);
    return false;
  }

  private onEnemyKilled(e: Phaser.Physics.Arcade.Sprite) {
    if (e.getData("killed")) return;
    e.setData("killed", true);
    this.effects.deathEffect(e.x, e.y);
    const eType = e.getData("type") as string;
    const mult = e.getData("dropMult") as number || 1;
    const xpGain = XP_PER_KILL[eType as keyof typeof XP_PER_KILL] || 5;
    this.spawnDrop(e.x, e.y, mult, xpGain);
    this.shakeScreen(80, 0.005);

    this.enemiesAlive--;

    if (this.player.charId === "berserker") {
      this.player.heal(5);
    }

    AudioManager.kill();
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
        const dead = this.player.takeDamage(Math.round(20 * this.difficultyDmgMult), this.time.now);
        if (dead) { this.endGame(); return; }
      }
      this.effects.deathEffect(e.x, e.y);
      this.shakeScreen(150, 0.012);
    }

    this.stats_kills++;
    this.stats_peakAlive = Math.max(this.stats_peakAlive, this.activeEnemies.filter(a => a.active).length);

    this.enemyMgr.deactivateEnemy(e);
    this.enemyMgr.removeFromList(e);
    const idx = this.activeEnemies.indexOf(e);
    if (idx !== -1) this.activeEnemies.splice(idx, 1);
  }

  private spawnDrop(x: number, y: number, mult: number, xpAmount: number) {
    const value = Math.round(Phaser.Math.Between(1, 3) * mult);
    const drop = this.materialPool.get(x, y, "material") as Phaser.GameObjects.Image | null;
    if (!drop) return;
    drop.setDepth(10);
    drop.setData("value", value);
    drop.setData("xp", xpAmount);
    this.dropList.push(drop);
  }

  private autoShoot(time: number) {
    const nearest = this.enemyMgr.getNearest(this.player.x, this.player.y);
    if (!nearest) return;

    const w = this.player.activeWeapon;
    if (!w) return;
    if (time - w.lastFired < w.fireRate) return;

    const distToTarget = Phaser.Math.Distance.Between(this.player.x, this.player.y, nearest.x, nearest.y);
    if (distToTarget > w.range) return;

    if (w.weaponType === "melee") {
      const nearby = this.enemyMgr.getEnemiesInRange(this.player.x, this.player.y, w.range);
      if (nearby.length === 0) return;
      w.lastFired = time;
      const meleeDmg = Math.round(w.damage * this.player.abilityDmgMult);
      for (const e of nearby) {
        const hp = (e.getData("hp") as number) - meleeDmg;
        e.setData("hp", hp);
        this.effects.damageNumber(e.x, e.y, meleeDmg, false);
        if (hp <= 0) this.onEnemyKilled(e);
        else this.effects.flashDamage(e);
      }
      this.effects.deathEffect(nearby[0].x, nearby[0].y);
      this.shakeScreen(60, 0.003);
      return;
    }

    w.lastFired = time;

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
  }

  private checkPickup() {
    for (let i = this.dropList.length - 1; i >= 0; i--) {
      const obj = this.dropList[i];
      if (!obj.active) continue;
      const d = Phaser.Math.Distance.Between(this.player.x, this.player.y, obj.x, obj.y);
      const magnetRange = PICKUP_RANGE + this.player.stats.pickupRangeBonus + 100;
      if (d < PICKUP_RANGE + this.player.stats.pickupRangeBonus) {
        AudioManager.pickup();
        const val = obj.getData("value") as number;
        const xpVal = obj.getData("xp") as number;
        this.player.stats.materials += val;
        this.stats_materialsEarned += val;
        const leveled = this.player.awardXP(xpVal);
        this.pendingLevelUps += leveled;
        const text = this.add.text(obj.x, obj.y, `+${val}`, {
          fontSize: "12px", color: "#0f8",
        }).setOrigin(0.5).setDepth(50);
        this.tweens.add({
          targets: text, y: text.y - 25, alpha: 0, duration: 400,
          onComplete: () => text.destroy(),
        });
        obj.setActive(false).setVisible(false);
        this.dropList.splice(i, 1);
      } else if (d < magnetRange) {
        obj.x += (this.player.x - obj.x) * 0.08;
        obj.y += (this.player.y - obj.y) * 0.08;
      }
    }
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
        obj.setActive(false).setVisible(false);
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

    const won = this.wave >= 30;
    if (won) {
      const nextDiff = this.difficultyLevel + 1;
      if (nextDiff < DIFFICULTY_TIERS.length) {
        MetaProgress.setUnlockedDifficulty(nextDiff);
      }
    }

    const newAchievements = Achievements.check({
      wave: this.wave, kills: this.stats_kills, bossKills: this.stats_bossKills,
      peakAlive: this.stats_peakAlive, materialsEarned: this.stats_materialsEarned,
      charId: this.player.charId, won,
    });
    const newChars = MetaProgress.checkCharUnlocks({
      kills: this.stats_kills, materialsEarned: this.stats_materialsEarned,
      wave: this.wave, won,
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
    const KC = Phaser.Input.Keyboard.KeyCodes;
    this.wasdKeys.A = kb.addKey(KC.A);
    this.wasdKeys.W = kb.addKey(KC.W);
    this.wasdKeys.S = kb.addKey(KC.S);
    this.wasdKeys.D = kb.addKey(KC.D);
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
      const wpType = w.weaponType === "melee" ? "近战" : "远程";
      return `${active}Lv.${w.level} ${w.name} [${wpType}] 伤害${w.damage} 射速${w.fireRate}ms`;
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
    const KC = Phaser.Input.Keyboard.KeyCodes;
    const keyNameToCode = (name: string): number => {
      const map: Record<string, number> = {
        A: KC.A, B: KC.B, C: KC.C, D: KC.D, E: KC.E, F: KC.F, G: KC.G, H: KC.H,
        I: KC.I, J: KC.J, K: KC.K, L: KC.L, M: KC.M, N: KC.N, O: KC.O, P: KC.P,
        Q: KC.Q, R: KC.R, S: KC.S, T: KC.T, U: KC.U, V: KC.V, W: KC.W, X: KC.X,
        Y: KC.Y, Z: KC.Z,
        ONE: KC.ONE, TWO: KC.TWO, THREE: KC.THREE, FOUR: KC.FOUR,
        FIVE: KC.FIVE, SIX: KC.SIX, SEVEN: KC.SEVEN, EIGHT: KC.EIGHT,
        NINE: KC.NINE, ZERO: KC.ZERO,
        SPACE: KC.SPACE, SHIFT: KC.SHIFT, CTRL: KC.CTRL, ALT: KC.ALT,
        TAB: KC.TAB, ENTER: KC.ENTER, ESC: KC.ESC,
        LEFT: KC.LEFT, RIGHT: KC.RIGHT, UP: KC.UP, DOWN: KC.DOWN,
      };
      return map[name] ?? KC.ESC;
    };

    const bindings = Settings.getAllBindings();

    const togglePauseKey = kb.addKey(keyNameToCode(bindings.pause));
    const switchKey = kb.addKey(keyNameToCode(bindings.switch));
    const grenadeKey = kb.addKey(keyNameToCode(bindings.grenade));
    const abilityKey = kb.addKey(keyNameToCode(bindings.ability));
    const power1Key = kb.addKey(keyNameToCode(bindings.power1));
    const power2Key = kb.addKey(keyNameToCode(bindings.power2));

    togglePauseKey.on("down", () => this.togglePause());
    switchKey.on("down", () => this.player.switchWeapon());
    grenadeKey.on("down", () => {
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
    abilityKey.on("down", () => this.useAbility());
    power1Key.on("down", () => this.usePower(0));
    power2Key.on("down", () => this.usePower(1));
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
    for (const e of this.activeEnemies) {
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
