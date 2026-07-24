import Phaser from "phaser";

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
        speed: { min: 60, max: 200 },
        lifespan: 500,
        quantity: 12,
        scale: { start: 1.5, end: 0 },
        tint: [0xff4444, 0xff8800, 0xffcc00],
        emitting: false,
      });
    }
    this.deathEmitter.setPosition(x, y);
    this.deathEmitter.explode();
  }

  flashDamage(obj: Phaser.GameObjects.Sprite) {
    if (!this.scene.isActive() || !obj.active) return;
    obj.setTint(0xff0000);
    this.scene.time.delayedCall(100, () => {
      if (obj.active) obj.clearTint();
    });
  }

  }
