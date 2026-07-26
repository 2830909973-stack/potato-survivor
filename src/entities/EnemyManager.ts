import Phaser from "phaser";
import { EnemyType } from "../types";

export class EnemyManager {
  group: Phaser.Physics.Arcade.Group;
  list: Phaser.Physics.Arcade.Sprite[] = [];

  private scene: Phaser.Scene;
  private poolSize = 300;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.group = scene.physics.add.group({ maxSize: this.poolSize });
  }

  getFromPool(x: number, y: number, key: string): Phaser.Physics.Arcade.Sprite | null {
    const e = this.group.get(x, y, key) as Phaser.Physics.Arcade.Sprite;
    if (!e) return null;
    e.setActive(true).setVisible(true);
    if (e.body) { e.body.enable = true; (e.body as Phaser.Physics.Arcade.Body).setSize(20, 20); }
    e.clearTint();
    e.setAlpha(1);
    e.setScale(1);
    e.setData("killed", false);
    e.setData("controlled", false);
    e.setData("controlledTimer", 0);
    e.setData("controlledDuration", 0);
    e.setData("controlledDmgTimer", 0);
    e.setData("chargeTimer", 0);
    e.setData("chargerBurst", false);
    e.setData("lastShot", 0);
    e.setData("healTimer", 0);
    e.setData("frozen", false);
    e.setData("frozenTimer", 0);
    return e;
  }

  addToList(e: Phaser.Physics.Arcade.Sprite) {
    if (!this.list.includes(e)) this.list.push(e);
  }

  removeFromList(e: Phaser.Physics.Arcade.Sprite) {
    const idx = this.list.indexOf(e);
    if (idx !== -1) this.list.splice(idx, 1);
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
        e.setData("killed", true);
      },
    });
  }

  getTextureForType(type: EnemyType): string {
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

  activateBullet(group: Phaser.Physics.Arcade.Group, x: number, y: number): Phaser.Physics.Arcade.Sprite | null {
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

  clearAll() {
    for (const e of this.list) {
      if (e.active) this.deactivateEnemy(e);
    }
    this.list = [];
  }
}