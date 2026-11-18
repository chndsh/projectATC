import Phaser from 'phaser';

// Base reference resolution for scaling (original design was 800px wide)
const BASE_WIDTH = 800;

export class PlaneSprite extends Phaser.GameObjects.Container {
  constructor(scene, plane) {
    super(scene, plane.x, plane.y);
    this.plane = plane;

    // Sprite image (uses active scene texture preference or 'plane' fallback)
    let textureKey = scene.currentPlaneTextureKey || 'plane';
    if (!scene.textures.exists(textureKey)) {
      textureKey = 'plane';
    }
    this.planeImage = scene.add.image(0, 0, textureKey);
    this.adjustScale();
    this.add(this.planeImage);

    // Scale-aware sizes
    const sf = this._scaleFactor();

    // Callsign Label
    this.label = scene.add.text(0, Math.round(-20 * sf), plane.callSign, {
      fontFamily: 'Courier New, monospace',
      fontSize: `${Math.max(10, Math.round(11 * sf))}px`,
      fontStyle: 'bold',
      color: '#f5e6c8',
      backgroundColor: '#2a1c10cc',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5);
    this.add(this.label);

    // Fuel Bar Background (Stardew wood/parchment tone)
    const barW = Math.round(32 * sf);
    const barH = Math.max(4, Math.round(5 * sf));
    this.fuelBg = scene.add.rectangle(0, Math.round(-9 * sf), barW, barH, 0x5c3d1e);
    this.add(this.fuelBg);

    // Fuel Bar Fill (Stardew green)
    this.fuelFill = scene.add.rectangle(-barW / 2, Math.round(-9 * sf), barW, barH, 0x4a7c59).setOrigin(0, 0.5);
    this._barW = barW;
    this.add(this.fuelFill);

    // Selection / hover indicator ring (Stardew gold)
    const ringR = Math.round(20 * sf);
    this.selectionRing = scene.add.circle(0, 0, ringR);
    this.selectionRing.setStrokeStyle(Math.max(1.5, 2 * sf), 0xe8c56a, 0);
    this.add(this.selectionRing);

    // Interactive hit area (comfortable touch target, at least 44x44 for touch accessibility)
    const hitW = Math.max(44, Math.round(40 * sf));
    const hitH = Math.max(44, Math.round(30 * sf));
    this.setSize(hitW, hitH);
    this.setInteractive({ cursor: 'pointer' });

    this.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        scene.startPathDrawing(this.plane);
      }
    });

    this.on('pointerover', () => {
      this.selectionRing.setStrokeStyle(Math.max(1.5, 2 * sf), 0xe8c56a, 0.9);
    });

    this.on('pointerout', () => {
      if (scene.drawingPlane !== this.plane) {
        this.selectionRing.setStrokeStyle(Math.max(1.5, 2 * sf), 0xe8c56a, 0);
      }
    });

    this.setDepth(20);
    scene.add.existing(this);

    // Graceful fade-in ingress transition
    this.setAlpha(0);
    scene.tweens.add({
      targets: this,
      alpha: 1,
      duration: 800,
      ease: 'Sine.easeOut',
    });
  }

  _scaleFactor() {
    // Scale proportionally: at 800px wide = 1.0, at 1600px wide = 2.0
    // Clamped between 0.75 and 2.5 so it never becomes microscopic or enormous
    const W = this.scene && this.scene.scale ? this.scene.scale.width : BASE_WIDTH;
    return Math.max(0.75, Math.min(2.5, W / BASE_WIDTH));
  }

  setPlaneTexture(textureKey) {
    if (!this.scene || !this.scene.textures) return;
    if (!this.scene.textures.exists(textureKey)) {
      textureKey = 'plane';
    }
    if (this.planeImage) {
      this.planeImage.setTexture(textureKey);
      this.adjustScale();
    }
  }

  adjustScale() {
    if (!this.planeImage) return;
    const baseW = this.planeImage.width || 36;
    const baseH = this.planeImage.height || 20;
    if (baseW > 0 && baseH > 0) {
      const sf = this._scaleFactor();
      const targetW = 42 * sf;
      const targetH = 28 * sf;
      const scale = Math.min(targetW / baseW, targetH / baseH, 1.3 * sf);
      this.planeImage.setScale(Number.isFinite(scale) ? scale : 1.0);
    }
  }

  updateVisuals(time) {
    // Sync position with plane domain coordinates
    this.x = this.plane.x;
    this.y = this.plane.y;

    // Orient sprite along flight heading with upright flight visuals:
    // If heading leftwards (|heading| > PI/2), flip Y so the aircraft is never upside-down
    const isHeadingLeft = Math.cos(this.plane.heading) < 0;
    if (isHeadingLeft) {
      this.planeImage.setFlipY(true);
      this.planeImage.setRotation(this.plane.heading);
    } else {
      this.planeImage.setFlipY(false);
      this.planeImage.setRotation(this.plane.heading);
    }

    // Update fuel bar
    const fuelPct = Math.max(0, this.plane.fuel / 100);
    this.fuelFill.width = Math.max(1, this._barW * fuelPct);

    if (this.plane.fuel > 50) {
      this.fuelFill.fillColor = 0x4a7c59; // Stardew green
    } else if (this.plane.fuel > 20) {
      this.fuelFill.fillColor = 0xe8c56a; // Stardew gold
    } else {
      // Flashing Red under 20%
      const flash = Math.floor(time / 200) % 2 === 0;
      this.fuelFill.fillColor = flash ? 0xc0392b : 0x7f1d1d;
    }
  }
}
