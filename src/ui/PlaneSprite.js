import Phaser from 'phaser';

export class PlaneSprite extends Phaser.GameObjects.Container {
  constructor(scene, plane) {
    super(scene, plane.x, plane.y);
    this.plane = plane;

    // Sprite image
    this.planeImage = scene.add.image(0, 0, 'plane');
    this.add(this.planeImage);

    // Callsign Label
    this.label = scene.add.text(0, -18, plane.callSign, {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      fontStyle: 'bold',
      color: '#f8fafc',
      backgroundColor: '#0f172acc',
      padding: { x: 2, y: 1 },
    }).setOrigin(0.5);
    this.add(this.label);

    // Fuel Bar Background (gray)
    this.fuelBg = scene.add.rectangle(0, -8, 30, 4, 0x334155);
    this.add(this.fuelBg);

    // Fuel Bar Fill
    this.fuelFill = scene.add.rectangle(-15, -8, 30, 4, 0x22c55e).setOrigin(0, 0.5);
    this.add(this.fuelFill);

    // Selection / hover indicator ring
    this.selectionRing = scene.add.circle(0, 0, 18);
    this.selectionRing.setStrokeStyle(1.5, 0x38bdf8, 0);
    this.add(this.selectionRing);

    // Set interactive container hit area for click/drawing
    this.setSize(36, 24);
    this.setInteractive({ cursor: 'pointer' });

    this.on('pointerdown', (pointer) => {
      if (pointer.leftButtonDown()) {
        scene.startPathDrawing(this.plane);
      }
    });

    this.on('pointerover', () => {
      this.selectionRing.setStrokeStyle(1.5, 0x38bdf8, 0.9);
    });

    this.on('pointerout', () => {
      if (scene.drawingPlane !== this.plane) {
        this.selectionRing.setStrokeStyle(1.5, 0x38bdf8, 0);
      }
    });

    scene.add.existing(this);
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
    this.fuelFill.width = Math.max(1, 30 * fuelPct);

    if (this.plane.fuel > 50) {
      this.fuelFill.fillColor = 0x22c55e; // Green
    } else if (this.plane.fuel > 20) {
      this.fuelFill.fillColor = 0xeab308; // Yellow
    } else {
      // Flashing Red under 20%
      const flash = Math.floor(time / 200) % 2 === 0;
      this.fuelFill.fillColor = flash ? 0xef4444 : 0x7f1d1d;
    }
  }
}
