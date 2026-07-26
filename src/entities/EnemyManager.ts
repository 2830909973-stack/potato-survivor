import Phaser from "phaser";
import { EnemyType, SpawnGroup, HIT_RANGE, W, H } from "../types";
import { ENEMY_CONFIG, WAVE_CONFIGS, BOSS_DATA, randomEdgePos, BossStats } from "../config";

export class EnemyManager {
  group: Phaser.Physics.Arcade.Group;
  list: Phaser.Physics.Arcade.Sprite[] = [];

  private scene: Phaser.Scene;
  private poolSize = 300;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({ maxSize: this.poolSize });
    for (let i = 0; i < 100; i++) {
      const dummy = this.group.create(-200, -200, "zombie_normal") as Phaser.Physics.Arcade.Sprite;
      dummy.setActive(false).setVisible(false);
      if (dummy.body) dummy.body.enable = false;
    }
  }

  private getFromPool(x: number, y: number, key: string): Phaser.Physics.Arcade.Sprite | null {
    const e = this.group.get(x, y, key) as Phaser.Physics.Arcade.Sprite;
    if (!e) return null;
    e.setActive(true).setVisible(true);
    if (e.body) { e.body.enable = true; (e.body as Phaser.Physics.Arcade.Body).setSize(20, 20); }
    e.clearTint();
    e.setAlpha(1);
    e.setScale(1);
    e.setData("killed", false);
    e.setData("boss", false);
    e.setData("elite", false);
    e.setData("controlled", false);
    e.setData("controlledTimer", 0);
    e.setData("controlledDuration", 0);
    e.setData("controlledDmgTimer", 0);
    e.setData("bossCharging", false);
    e.setData("chargeTimer", 0);
    e.setData("chargerBurst", false);
    e.setData("lastShot", 0);
    e.setData("healTimer", 0);
    e.setData("frozen", false);
    e.setData("frozenTimer", 0);
    return e;
  }

  deactivateEnemy(e: Phaser.Physics.Arcade.Sprite) {
    if (e.body) e.body.enable = false;
    this.scene.tweens.add({
      targets: e, alpha: 0, scaleX: 0.3, scaleY: 0.3, duration: 150,
      onComplete: () => {
        e.setActive(false).setVisible(false);
        e.setVelocity(0, 0);
        e.setAlpha(1);
        e.setScale(1);
        e.setData("boss", false);
        e.setData("elite", false);
        e.setData("killed", true);
      },
    });
  }

  private getTextureForType(type: EnemyType, bossWave?: number): string {
    if (bossWave) {
      if (bossWave <= 5) return "zombie_boss1";
      if (bossWave <= 10) return "zombie_boss2";
      if (bossWave <= 15) return "zombie_boss1";
      return "zombie_boss2";
    }
    switch (type) {
      case "normal": return "zombie_normal";
      case "fast": return "zombie_fast";
      case "tank": return "zombie_tank";
      case "ranged": return "zombie_ranged";
      case "charger": return "enemy_charger";
      case "exploder": return "enemy_exploder";
      case "healer": return "skeleton_other";
      case "invisible": return "skeleton_normal";
    }
  }

  private spawnOne(eCfg: typeof ENEMY_CONFIG.normal, sg: SpawnGroup & { spdMult: number; hpMult: number }, wave: number): Phaser.Physics.Arcade.Sprite | null {
    const { x, y } = randomEdgePos();
    const offX = Phaser.Math.Between(-40, 40);
    const offY = Phaser.Math.Between(-40, 40);
    const ex = Phaser.Math.Clamp(x + offX, 0, W);
    const ey = Phaser.Math.Clamp(y + offY, 0, H);
    const texKey = sg.boss ? this.getTextureForType(sg.type, wave) : this.getTextureForType(sg.type);
    const e = this.getFromPool(ex, ey, texKey);
    if (!e) return null;

    e.setTint(sg.boss ? 0xcc0000 : sg.elite ? 0xffaa00 : eCfg.tint);
    e.setData("hp", Math.round(eCfg.hp * sg.hpMult));
    e.setData("maxHp", Math.round(eCfg.hp * sg.hpMult));
    e.setData("speed", Math.round(eCfg.speed * sg.spdMult));
    e.setData("type", sg.type);
    e.setData("dropMult", sg.dropMult || eCfg.dropMult);
    e.setData("lastShot", 0);
    if (sg.elite) e.setData("elite", true);
    if (sg.boss) e.setData("boss", true);
    if (sg.type === "charger") e.setData("chargeTimer", Phaser.Math.Between(500, 1000));
    this.list.push(e);

    if (!sg.boss) {
      const finalScale = sg.elite ? 2 : eCfg.scale;
      e.setData("baseScale", finalScale);
      e.setScale(0);
      this.scene.tweens.add({ targets: e, scaleX: finalScale, scaleY: finalScale, duration: 200, ease: "Back.easeOut" });
    }
    return e;
  }

  spawnGroup(sg: SpawnGroup, wave: number) {
    const cfg = WAVE_CONFIGS[Math.min(wave - 1, WAVE_CONFIGS.length - 1)];
    const eCfg = ENEMY_CONFIG[sg.type];
    let spdMult = cfg.speedMult;
    let hpMult = cfg.hpMult;

    if (sg.boss) {
      let bd = BOSS_DATA[wave];
      if (!bd) {
        const bossWave = Math.floor(wave / 10) * 10;
        const baseBd = BOSS_DATA[20];
        bd = {
          name: `虚空领主 Lv.${wave}`,
          hpMult: Math.round((baseBd?.hpMult ?? 40) * (1 + (wave - 20) * 0.15)),
          speed: Math.min(80, (baseBd?.speed ?? 45) + (wave - 20) * 2),
          scale: Math.min(6, (baseBd?.scale ?? 4) + (wave - 20) * 0.1),
          tint: Phaser.Display.Color.HSLToColor((wave * 0.07) % 1, 0.8, 0.4).color,
          dropMult: (baseBd?.dropMult ?? 30) + Math.floor((wave - 20) / 5) * 5,
        };
      }
      const e = this.spawnOne(eCfg, { ...sg, spdMult: 1, hpMult: bd.hpMult }, wave);
      if (e) {
        e.setTint(bd.tint);
        e.setData("speed", bd.speed);
        e.setData("bossHpMax", Math.round(eCfg.hp * bd.hpMult));
        e.setData("bossName", bd.name);
        e.setData("bossWave", wave);
        e.setData("bossTimer", 2000);
        e.setData("baseScale", bd.scale);
        e.setScale(0);
        this.scene.tweens.add({ targets: e, scaleX: bd.scale, scaleY: bd.scale, duration: 300, ease: "Back.easeOut" });
      }
      return;
    }
    else if (sg.elite) { spdMult = 0.8; hpMult = wave >= 10 ? 10 : 6; }

    const eliteChance = cfg.eliteChance ?? 0;
    for (let i = 0; i < sg.count; i++) {
      const isElite = !sg.boss && Math.random() < eliteChance;
      const eSpd = isElite ? 0.8 : spdMult;
      const eHp = isElite ? (wave >= 10 ? 10 : 6) : hpMult;
      this.spawnOne(eCfg, { ...sg, spdMult: eSpd, hpMult: eHp, elite: isElite }, wave);
    }
  }

  private updateControlledEnemy(enemy: Phaser.Physics.Arcade.Sprite, delta: number) {
    let t = enemy.getData("controlledTimer") as number || 0;
    t += delta;
    enemy.setData("controlledTimer", t);
    const dur = enemy.getData("controlledDuration") as number || 10000;
    if (t >= dur) {
      enemy.setData("controlled", false);
      enemy.clearTint();
      return;
    }
    let closest: Phaser.Physics.Arcade.Sprite | null = null;
    let closestDist = Infinity;
    for (const other of this.list) {
      if (other === enemy || !other.active || other.getData("controlled") || other.getData("boss")) continue;
      const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, other.x, other.y);
      if (d < closestDist) { closestDist = d; closest = other; }
    }
    if (closest) {
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, closest.x, closest.y);
      const spd = enemy.getData("speed") as number;
      enemy.setVelocity(Math.cos(angle) * spd * 1.2, Math.sin(angle) * spd * 1.2);
      let damageTimer = enemy.getData("controlledDmgTimer") as number || 0;
      damageTimer += delta;
      if (damageTimer >= 500 && closestDist < 40) {
        damageTimer = 0;
        const hp = (closest.getData("hp") as number) - 20;
        closest.setData("hp", hp);
      }
      enemy.setData("controlledDmgTimer", damageTimer);
    } else {
      enemy.setVelocity(0, 0);
    }
  }

  moveAllToward(tx: number, ty: number, delta: number) {
    for (const enemy of this.list) {
      if (!enemy.active) continue;
      if (enemy.getData("controlled")) {
        this.updateControlledEnemy(enemy, delta);
        continue;
      }
      if (enemy.getData("bossCharging")) continue;
      const type = enemy.getData("type") as EnemyType;
      const spd = enemy.getData("speed") as number;

      if (type === "ranged") {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, tx, ty);
        if (dist > 200) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
          enemy.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
        } else {
          enemy.setVelocity(0, 0);
        }
      } else if (type === "charger") {
        const isBurst = enemy.getData("chargerBurst") as boolean || false;
        if (isBurst) { continue; }
        let chargeTimer = enemy.getData("chargeTimer") as number || 0;
        chargeTimer -= delta;
        if (chargeTimer <= 0) {
          enemy.setData("chargeTimer", Phaser.Math.Between(1500, 3000));
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
          enemy.setVelocity(Math.cos(angle) * spd * 3, Math.sin(angle) * spd * 3);
          enemy.setData("chargerBurst", true);
          this.scene.time.delayedCall(300, () => {
            enemy.setData("chargerBurst", false);
            if (enemy.active) {
              const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
              enemy.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
            }
          });
        } else {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
          enemy.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
        }
      } else if (type === "healer") {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, tx, ty);
        let closestAlly: Phaser.Physics.Arcade.Sprite | null = null;
        let closestAllyDist = Infinity;
        for (const ally of this.list) {
          if (ally === enemy || !ally.active || ally.getData("type") === "healer") continue;
          const d = Phaser.Math.Distance.Between(enemy.x, enemy.y, ally.x, ally.y);
          if (d < closestAllyDist && d < 120) { closestAllyDist = d; closestAlly = ally; }
        }
        if (closestAlly) {
          const allyAngle = Phaser.Math.Angle.Between(enemy.x, enemy.y, closestAlly.x, closestAlly.y);
          enemy.setVelocity(Math.cos(allyAngle) * spd, Math.sin(allyAngle) * spd);
          let healTimer = enemy.getData("healTimer") as number || 0;
          healTimer += delta;
          if (healTimer >= 1000) {
            healTimer = 0;
            const maxHp = closestAlly.getData("maxHp") as number;
            const hp = Math.min((closestAlly.getData("hp") as number) + 10, maxHp);
            closestAlly.setData("hp", hp);
          }
          enemy.setData("healTimer", healTimer);
        } else if (dist > 300) {
          const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
          enemy.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
        } else {
          enemy.setVelocity(0, 0);
        }
      } else if (type === "invisible") {
        const dist = Phaser.Math.Distance.Between(enemy.x, enemy.y, tx, ty);
        const alpha = Phaser.Math.Clamp((dist - 50) / 250, 0.2, 1);
        enemy.setAlpha(alpha);
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
        enemy.setVelocity(Math.cos(angle) * spd, Math.sin(angle) * spd);
      } else {
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, tx, ty);
        let speedMult = 1;
        if (enemy.getData("frozen")) {
          const frozenTimer = (enemy.getData("frozenTimer") as number || 0) - delta;
          enemy.setData("frozenTimer", frozenTimer);
          if (frozenTimer <= 0) { enemy.setData("frozen", false); enemy.clearTint(); }
          else speedMult = 0.4;
        }
        enemy.setVelocity(Math.cos(angle) * spd * speedMult, Math.sin(angle) * spd * speedMult);
      }
    }
  }

  getBoss(): Phaser.Physics.Arcade.Sprite | null {
    for (const e of this.list) {
      if (e.active && e.getData("boss")) return e;
    }
    return null;
  }

  updateBosses(time: number, delta: number, px: number, py: number, enemyBullets: Phaser.Physics.Arcade.Group) {
    const boss = this.getBoss();
    if (!boss) return;

    const hpMax = boss.getData("bossHpMax") as number;
    const baseDmg = hpMax >= 2000 ? 15 : hpMax >= 1000 ? 12 : 10;
    const scatterCount = hpMax >= 1200 ? 5 : 3;

    let timer = boss.getData("bossTimer") as number || 0;
    timer -= delta;
    if (timer > 0) { boss.setData("bossTimer", timer); return; }

    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, px, py);
    this.bossScatter(boss, angle, scatterCount, 30, baseDmg, enemyBullets);
    boss.setData("bossTimer", 2000);
  }

  private bossScatter(boss: Phaser.Physics.Arcade.Sprite, centerAngle: number, bulletCount: number, spreadDeg: number, damage: number, enemyBullets: Phaser.Physics.Arcade.Group) {
    for (let i = 0; i < bulletCount; i++) {
      const offset = -spreadDeg / 2 + (bulletCount > 1 ? i * spreadDeg / (bulletCount - 1) : 0);
      const a = centerAngle + offset * Math.PI / 180;
      const eb = this.activateBullet(enemyBullets, boss.x, boss.y);
      if (!eb) continue;
      eb.setVelocity(Math.cos(a) * 200, Math.sin(a) * 200);
      eb.setData("damage", damage);
    }
  }

  private activateBullet(group: Phaser.Physics.Arcade.Group, x: number, y: number): Phaser.Physics.Arcade.Sprite | null {
    const b = group.get(x, y, "enemyBullet") as Phaser.Physics.Arcade.Sprite;
    if (!b) return null;
    b.setActive(true).setVisible(true);
    if (b.body) b.body.enable = true;
    return b;
  }

  rangedShoot(time: number, enemyBullets: Phaser.Physics.Arcade.Group, px: number, py: number) {
    for (const enemy of this.list) {
      if (!enemy.active) continue;
      if (enemy.getData("type") !== "ranged") continue;
      const lastShot = enemy.getData("lastShot") as number || 0;
      if (time - lastShot < 2000) continue;
      enemy.setData("lastShot", time);
      const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, px, py);
      const eb = this.activateBullet(enemyBullets, enemy.x, enemy.y);
      if (!eb) continue;
      eb.setVelocity(Math.cos(angle) * 200, Math.sin(angle) * 200);
      eb.setData("damage", 12);
    }
  }

  getAlive(): Phaser.Physics.Arcade.Sprite[] {
    return this.list.filter(e => e.active);
  }

  getNearest(px: number, py: number): Phaser.Physics.Arcade.Sprite | null {
    let nearest: Phaser.Physics.Arcade.Sprite | null = null;
    let minDist = Infinity;
    for (const enemy of this.list) {
      if (!enemy.active || enemy.getData("controlled")) continue;
      const d = Phaser.Math.Distance.Between(px, py, enemy.x, enemy.y);
      if (d < minDist) { minDist = d; nearest = enemy; }
    }
    return nearest;
  }

  getEnemiesInRange(px: number, py: number, range: number, excludeControlled = true): Phaser.Physics.Arcade.Sprite[] {
    return this.list.filter(e =>
      e.active && !(excludeControlled && e.getData("controlled")) && Phaser.Math.Distance.Between(px, py, e.x, e.y) < range
    );
  }

  get count(): number {
    return this.list.filter(e => e.active).length;
  }

  clearAll() {
    for (const e of this.list) {
      if (e.active) this.deactivateEnemy(e);
    }
    this.list = [];
  }
}