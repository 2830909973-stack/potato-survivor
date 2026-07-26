import Phaser from "phaser";

export class ScrollContainer {
  private scene: Phaser.Scene;
  private maskShape: Phaser.GameObjects.Graphics;
  private content: Phaser.GameObjects.Container;
  private slider: Phaser.GameObjects.Graphics;
  private _contentHeight = 0;
  private _viewHeight: number;
  private _viewWidth: number;
  private _maskX: number;
  private _maskY: number;
  private _ratio = 0;
  private _barColor: number;
  private _sliderH = 40;
  private dragging = false;
  private dragStartY = 0;
  private dragStartRatio = 0;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    viewWidth: number,
    viewHeight: number,
    barColor = 0x7a5cff,
  ) {
    this.scene = scene;
    this._viewHeight = viewHeight;
    this._viewWidth = viewWidth;
    this._maskX = x;
    this._maskY = y;
    this._barColor = barColor;

    this.content = scene.add.container(0, 0).setDepth(50);

    this.maskShape = scene.add.graphics();
    this.maskShape.fillStyle(0xffffff);
    this.maskShape.fillRect(x, y, viewWidth, viewHeight);
    this.maskShape.setVisible(false);

    const mask = this.maskShape.createGeometryMask();
    this.content.setMask(mask);

    this.slider = scene.add.graphics().setDepth(100);

    scene.input.on("wheel", (_p: unknown, _g: unknown, _h: unknown, deltaY: number) => {
      if (this._contentHeight <= this._viewHeight) return;
      const step = 0.08;
      this.scrollTo(this._ratio + (deltaY > 0 ? step : -step));
    });

    scene.input.on("pointerdown", (p: Phaser.Input.Pointer) => {
      const localY = p.y - this._maskY;
      if (
        p.x >= x && p.x <= x + viewWidth &&
        localY >= 0 && localY <= viewHeight
      ) {
        this.dragging = true;
        this.dragStartY = p.y;
        this.dragStartRatio = this._ratio;
      }
    });

    scene.input.on("pointermove", (p: Phaser.Input.Pointer) => {
      if (!this.dragging || this._contentHeight <= this._viewHeight) return;
      const dy = this.dragStartY - p.y;
      const maxDrag = this._contentHeight - this._viewHeight;
      if (maxDrag <= 0) return;
      this.scrollTo(this.dragStartRatio + dy / maxDrag);
    });

    scene.input.on("pointerup", () => {
      this.dragging = false;
    });
  }

  get ratio() {
    return this._ratio;
  }

  setContentHeight(h: number) {
    this._contentHeight = h;
    this.scrollTo(0);
  }

  add(child: Phaser.GameObjects.GameObject) {
    this.content.add(child);
  }

  getContainer() {
    return this.content;
  }

  removeAll(destroy?: boolean) {
    this.content.removeAll(destroy);
  }

  scrollTo(ratio: number) {
    this._ratio = Phaser.Math.Clamp(ratio, 0, 1);
    const overflow = Math.max(0, this._contentHeight - this._viewHeight);
    const contentY = -this._ratio * overflow;
    this.content.setY(this._maskY + contentY);
    this.drawSlider();
  }

  private drawSlider() {
    this.slider.clear();
    if (this._contentHeight <= this._viewHeight) return;

    const barW = 6;
    this._sliderH = Math.max(30, (this._viewHeight / this._contentHeight) * this._viewHeight);
    const barX = this._maskX + this._viewWidth - 14;
    const barY = this._maskY + this._ratio * (this._viewHeight - this._sliderH);

    this.slider.fillStyle(0x333355, 0.5);
    this.slider.fillRoundedRect(barX, barY, barW, this._sliderH, 3);
    this.slider.fillStyle(this._barColor, 0.7);
    this.slider.fillRoundedRect(barX, barY, barW, this._sliderH, 3);
  }

  destroy() {
    this.slider.destroy();
    this.maskShape.destroy();
    this.content.destroy();
  }
}
