import Phaser from "phaser";
import { W, H } from "../types";

export class EffectsManager {
  private scene: Phaser.Scene;
  private deathEmitter: Phaser.GameObjects.Particles.ParticleEmitter | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  damageNumber(x: number, y: number, amount: number, isCrit: boolean) {
    const color = isCrit ? "#ff0" : "#fff";
    const size = isCrit ? "18px" : "14px";
    const txt = this.scene.add.text(x + Phaser.Math.Between(-8, 8), y, `${amount}`, {
      fontSize: size, color, fontStyle: "bold", stroke: "#000", strokeThickness: 2,
    }).setOrigin(0.5).setDepth(50);
    this.scene.tweens.add({
      targets: txt, y: y - 40, alpha: 0, duration: 500,
      onComplete: () => txt.destroy(),
    });
  }

  deathEffect(x: number, y: number) {
    if (!this.deathEmitter) {
      this.deathEmitter = this.scene.add.particles(0, 0, "particle", {
        speed: { min: 50, max: 150 },
        lifespan: 400,
        quantity: 8,
        scale: { start: 1, end: 0 },
        emitting: false,
      });
    }
    this.deathEmitter.setPosition(x, y);
    this.deathEmitter.explode();
  }

  splashCircle(x: number, y: number, radius: number) {
    const circle = this.scene.add.circle(x, y, radius, 0xff8800, 0.25).setDepth(35);
    this.scene.tweens.add({
      targets: circle, alpha: 0, scaleX: 1.3, scaleY: 1.3, duration: 200,
      onComplete: () => circle.destroy(),
    });
  }

  flashDamage(obj: Phaser.GameObjects.Sprite) {
    obj.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (obj.active) obj.clearTint();
    });
  }

  announce(text: string) {
    const t = this.scene.add.text(W / 2, H / 2 - 40, text, {
      fontSize: "40px", color: "#fff", fontStyle: "bold",
    }).setOrigin(0.5).setAlpha(0).setDepth(50);
    this.scene.tweens.add({
      targets: t, alpha: 0, y: H / 2 - 60, duration: 1500, ease: "Power2",
    });
  }
}
