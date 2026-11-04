import Phaser from 'phaser';

export class PlaneSprite extends Phaser.GameObjects.Container {
  constructor(scene, plane, x, y) {
    super(scene, x, y);
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

    // Drag interaction setup
    this.setSize(44, 30);
    this.setInteractive({ cursor: 'grab', draggable: true });

    this.isDragging = false;
    this.dragStartPos = { x: 0, y: 0 };

    this.on('dragstart', (pointer) => {
      if (this.plane.state !== 'CIRCLING') return;
      this.isDragging = true;
      this.dragStartPos = { x: this.x, y: this.y };
      this.setAlpha(0.85);
      this.setScale(1.1);
    });

    this.on('drag', (pointer, dragX, dragY) => {
      if (!this.isDragging) return;
      this.x = dragX;
      this.y = dragY;
    });

    this.on('dragend', (pointer) => {
      if (!this.isDragging) return;
      this.isDragging = false;
      this.setAlpha(1.0);
      this.setScale(1.0);

      // Check if dropped into approach glide zone (right side, x >= 460)
      if (this.x >= 460) {
        scene.handlePlaneDroppedToApproach(this.plane);
      } else {
        // Snap back to altitude lane
        scene.tweens.add({
          targets: this,
          x: this.dragStartPos.x,
          y: this.dragStartPos.y,
          duration: 200,
          ease: 'Power2',
        });
      }
    });

    // Right click for Go-Around / abort if approaching
    this.on('pointerdown', (pointer) => {
      if (pointer.rightButtonDown()) {
        scene.handlePlaneRightClicked(this.plane);
      }
    });

    scene.add.existing(this);
  }

  updateVisuals(time) {
    // Update fuel bar width and color
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

    // Orient heading: if approaching, nose points downward along glide path
    if (this.plane.state === 'APPROACHING') {
      this.planeImage.setRotation(0.35); // Slight pitch down
    } else {
      this.planeImage.setRotation(0);
    }
  }
}
