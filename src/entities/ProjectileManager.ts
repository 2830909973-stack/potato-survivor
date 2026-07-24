import Phaser from "phaser";
import { HIT_RANGE, W, H } from "../types";

export class ProjectileManager {
  bullets: Phaser.Physics.Arcade.Group;
  enemyBullets: Phaser.Physics.Arcade.Group;

  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.bullets = scene.physics.add.group({ maxSize: 200 });
    this.enemyBullets = scene.physics.add.group({ maxSize: 200 });
  }

  private deactivateBullet(b: Phaser.Physics.Arcade.Sprite) {
    b.setActive(false).setVisible(false);
    b.setVelocity(0, 0);
    if (b.body) b.body.enable = false;
  }

  private getBullet(group: Phaser.Physics.Arcade.Group, x: number, y: number, key: string): Phaser.Physics.Arcade.Sprite | null {
    const b = group.get(x, y, key) as Phaser.Physics.Arcade.Sprite;
    if (!b) return null;
    b.setActive(true).setVisible(true);
    b.body!.enable = true;
    return b;
  }

  fireBullet(x: number, y: number, angle: number, speed: number, damage: number, range: number, splashRadius?: number, penetrate?: number) {
    const b = this.getBullet(this.bullets, x, y, "bullet");
    if (!b) return;
    b.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
    b.setData("damage", damage);
    b.setData("range", range);
    b.setData("originX", x);
    b.setData("originY", y);
    if (splashRadius) b.setData("splashRadius", splashRadius);
    if (penetrate) b.setData("penetrate", penetrate);
  }

  doSplashDamage(
    x: number, y: number, radius: number, damage: number,
    enemyList: Phaser.Physics.Arcade.Sprite[],
    onHit: (enemy: Phaser.Physics.Arcade.Sprite, dmg: number) => void,
    exclude?: Phaser.Physics.Arcade.Sprite
  ) {
    for (const e of enemyList) {
      if (!e.active || e === exclude) continue;
      const d = Phaser.Math.Distance.Between(x, y, e.x, e.y);
      if (d < radius) {
        onHit(e, damage);
      }
    }
  }

  checkHitsAgainst(
    enemyList: Phaser.Physics.Arcade.Sprite[],
    onHit: (bullet: Phaser.Physics.Arcade.Sprite, enemy: Phaser.Physics.Arcade.Sprite) => boolean | void
  ) {
    const bullets = this.bullets.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const b of bullets) {
      if (!b.active) continue;
      for (const e of enemyList) {
        if (!e.active) continue;
        const d = Phaser.Math.Distance.Between(b.x, b.y, e.x, e.y);
        if (d < HIT_RANGE) {
          const shouldStop = onHit(b, e);
          if (shouldStop || !b.active) break;
        }
      }
    }
  }

  checkEnemyHits(
    px: number, py: number, time: number, iFrameTimer: number,
    onHit: (bullet: Phaser.Physics.Arcade.Sprite) => boolean
  ) {
    if (time - iFrameTimer < 500) return;
    const bullets = this.enemyBullets.getChildren() as Phaser.Physics.Arcade.Sprite[];
    for (const b of bullets) {
      if (!b.active) continue;
      const d = Phaser.Math.Distance.Between(px, py, b.x, b.y);
      if (d < HIT_RANGE) {
        this.deactivateBullet(b);
        const dead = onHit(b);
        if (dead) break;
      }
    }
  }

  checkPlayerContact(
    enemyList: Phaser.Physics.Arcade.Sprite[],
    px: number, py: number, time: number, iFrameTimer: number,
    onContact: (enemy: Phaser.Physics.Arcade.Sprite) => boolean
  ) {
    if (time - iFrameTimer < 500) return;
    for (const e of enemyList) {
      if (!e.active) continue;
      const d = Phaser.Math.Distance.Between(px, py, e.x, e.y);
      if (d < HIT_RANGE) {
        const dead = onContact(e);
        if (dead) break;
      }
    }
  }

  cleanupOffscreen() {
    for (const group of [this.bullets, this.enemyBullets]) {
      group.getChildren().forEach((b) => {
        const bullet = b as Phaser.Physics.Arcade.Sprite;
        if (!bullet.active) return;
        const range = bullet.getData("range") as number;
        if (range && range > 0) {
          const ox = bullet.getData("originX") as number;
          const oy = bullet.getData("originY") as number;
          if (ox != null && Phaser.Math.Distance.Between(ox, oy, bullet.x, bullet.y) >= range) {
            this.deactivateBullet(bullet);
            return;
          }
        }
        if (bullet.x < -50 || bullet.x > W + 50 || bullet.y < -50 || bullet.y > H + 50) {
          this.deactivateBullet(bullet);
        }
      });
    }
  }

  deactivate(b: Phaser.Physics.Arcade.Sprite) {
    this.deactivateBullet(b);
  }

  clearAll() {
    this.bullets.clear(true, true);
    this.enemyBullets.clear(true, true);
  }
}
