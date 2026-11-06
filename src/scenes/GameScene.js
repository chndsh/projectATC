import Phaser from 'phaser';
import { Simulation } from '../domain/Simulation.js';
import { PlaneSprite } from '../ui/PlaneSprite.js';
import { HUD } from '../ui/HUD.js';
import { SoundEffects } from '../audio/SoundEffects.js';
import { CustomizationManager } from '../ui/CustomizationManager.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.sim = new Simulation();
    this.planeSprites = new Map(); // planeId -> PlaneSprite
    this.currentPlaneTextureKey = CustomizationManager.selectedPlane || 'plane';

    // Sky Background gradient
    this.skyBg = this.add.rectangle(400, 225, 800, 450, 0x0c4a6e).setDepth(-20);

    // Custom / Preset Background Image (layers directly over skyBg)
    this.bgSprite = this.add.image(400, 225, 'bg-night-radar')
      .setDisplaySize(800, 450)
      .setDepth(-10)
      .setVisible(false);

    // Restore any custom textures saved in storage
    CustomizationManager.restoreCustomTextures(this);

    // Apply active background preference
    this.applyBackground(CustomizationManager.selectedBackground || 'default');

    // Decorative clouds drifting in background
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(Phaser.Math.Between(40, 750), Phaser.Math.Between(40, 260), 'cloud');
      c.setAlpha(0.25);
      c.setScale(Phaser.Math.FloatBetween(1.0, 1.8));
      c.setDepth(-5);
      this.clouds.push(c);
    }

    // Runway (Full width 800px along bottom: y: 415)
    this.runway = this.add.image(400, 415, 'runway').setOrigin(0.5, 0.5).setDepth(1);

    // Left Gate Landing Marker (Visual landing threshold box)
    this.gateZoneMarker = this.add.rectangle(65, 415, 120, 40).setDepth(2);
    this.gateZoneMarker.setStrokeStyle(2, 0x38bdf8, 0.8);

    this.gateText = this.add.text(65, 380, '▼ LANDING ENTRY ▼', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#38bdf8',
      fontStyle: 'bold',
      backgroundColor: '#0f172a99',
      padding: { x: 3, y: 2 },
    }).setOrigin(0.5).setDepth(2);

    // Dynamic Flight Path Graphics layer
    this.pathGraphics = this.add.graphics().setDepth(5);

    // HUD Header
    this.hud = new HUD(this);

    // Path drawing state
    this.drawingPlane = null;
    this.currentPathPoints = [];

    // Pointer input listeners for drawing flight paths
    this.input.on('pointermove', (pointer) => {
      if (this.drawingPlane) {
        const last = this.currentPathPoints[this.currentPathPoints.length - 1];
        if (!last || Math.hypot(pointer.x - last.x, pointer.y - last.y) > 12) {
          this.currentPathPoints.push({ x: pointer.x, y: pointer.y });
        }
      }
    });

    this.input.on('pointerup', () => {
      if (this.drawingPlane) {
        if (this.currentPathPoints.length > 1) {
          // Connect current live position of plane to the drawn path if moved
          const pts = [{ x: this.drawingPlane.x, y: this.drawingPlane.y }, ...this.currentPathPoints];
          this.drawingPlane.assignPath(pts);
          SoundEffects.playGoAround(); // Chime for new course
        }
        const sprite = this.planeSprites.get(this.drawingPlane.id);
        if (sprite) {
          sprite.selectionRing.setStrokeStyle(1.5, 0x38bdf8, 0);
        }
        this.drawingPlane = null;
        this.currentPathPoints = [];
      }
    });

    // Low fuel alarm timer
    this.alarmTimer = 0;

    // Spawn 1 initial plane for instant action
    this.sim.spawnPlane();
  }

  applyBackground(bgKey) {
    if (!this.bgSprite || !this.skyBg) return;

    if (bgKey === 'default') {
      this.skyBg.setVisible(true);
      this.bgSprite.setVisible(false);
      this.clouds.forEach(c => c.setVisible(true));
    } else if (this.textures.exists(bgKey)) {
      this.skyBg.setVisible(false);
      this.bgSprite.setTexture(bgKey);
      this.bgSprite.setDisplaySize(800, 450);
      this.bgSprite.setVisible(true);
      // Keep clouds visible with gentle drift over the custom background
      this.clouds.forEach(c => c.setVisible(true));
    }
  }

  applyPlaneTexture(planeKey) {
    this.currentPlaneTextureKey = planeKey;
    for (const sprite of this.planeSprites.values()) {
      sprite.setPlaneTexture(planeKey);
    }
  }

  startPathDrawing(plane) {
    if (plane.state === 'LANDED') return;
    this.drawingPlane = plane;
    // Start drawing directly from current aircraft location
    this.currentPathPoints = [{ x: plane.x, y: plane.y }];
    const sprite = this.planeSprites.get(plane.id);
    if (sprite) {
      sprite.selectionRing.setStrokeStyle(2, 0x38bdf8, 1);
    }
  }

  showPopupText(x, y, message, color = '#22c55e') {
    const text = this.add.text(x, y - 20, message, {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: color,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 25,
      alpha: 0,
      duration: 800,
      ease: 'Power1',
      onComplete: () => text.destroy(),
    });
  }

  showTouchdownEffect(plane) {
    SoundEffects.playTouchdown();
    const landingScore = Math.round((15 + plane.fuel) * this.sim.combo);
    this.showPopupText(140, 395, `+${landingScore} PTS!`, '#22c55e');

    // Smoke puff emitter on runway threshold contact
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(100 + Phaser.Math.Between(-15, 15), 415 + Phaser.Math.Between(-5, 5), 'smoke-particle');
      this.tweens.add({
        targets: p,
        x: p.x - Phaser.Math.Between(20, 35),
        y: p.y - Phaser.Math.Between(5, 15),
        alpha: 0,
        scale: 2.0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  renderFlightPaths() {
    this.pathGraphics.clear();

    // 1. Draw existing assigned paths for all airborne planes
    for (const plane of this.sim.getPlanes()) {
      if (plane.path && plane.path.length > 0) {
        // Red tone if fuel low, cyan otherwise
        const lineColor = plane.fuel < 20 ? 0xef4444 : 0x38bdf8;
        this.pathGraphics.lineStyle(2, lineColor, 0.7);

        this.pathGraphics.beginPath();
        this.pathGraphics.moveTo(plane.x, plane.y);
        for (const pt of plane.path) {
          this.pathGraphics.lineTo(pt.x, pt.y);
        }
        this.pathGraphics.strokePath();

        // Draw small dot on final destination waypoint
        const endPt = plane.path[plane.path.length - 1];
        this.pathGraphics.fillStyle(lineColor, 0.9);
        this.pathGraphics.fillCircle(endPt.x, endPt.y, 3);
      }
    }

    // 2. Draw active in-progress drawing line
    if (this.drawingPlane && this.currentPathPoints.length > 0) {
      this.pathGraphics.lineStyle(2, 0xfacc15, 0.9); // Bright yellow for current draw
      this.pathGraphics.beginPath();
      this.pathGraphics.moveTo(this.currentPathPoints[0].x, this.currentPathPoints[0].y);
      for (let i = 1; i < this.currentPathPoints.length; i++) {
        this.pathGraphics.lineTo(this.currentPathPoints[i].x, this.currentPathPoints[i].y);
      }
      this.pathGraphics.strokePath();
    }
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Slowly scroll background clouds
    for (const c of this.clouds) {
      c.x -= 12 * dt;
      if (c.x < -60) c.x = 860;
    }

    if (this.sim.isGameOver) return;

    const prevLanded = this.sim.getState().landedCount;

    // Advance simulation logic
    this.sim.update(dt);
    const state = this.sim.getState();
    this.hud.update(state);

    if (state.isGameOver) {
      SoundEffects.playExplosion();
      this.cameras.main.shake(500, 0.025);
      this.time.delayedCall(800, () => {
        this.scene.start('GameOverScene', {
          reason: state.gameOverReason,
          score: state.score,
          elapsedTime: state.elapsedTime,
          landedCount: state.landedCount,
        });
      });
      return;
    }

    // If a touchdown occurred
    if (state.landedCount > prevLanded) {
      const latestLanded = this.sim.landedPlanes[this.sim.landedPlanes.length - 1];
      if (latestLanded) {
        this.showTouchdownEffect(latestLanded);
      }
    }

    // Sync sprites for active planes
    const activePlanes = this.sim.getPlanes();
    const activeIds = new Set(activePlanes.map(p => p.id));

    // Remove defunct sprites
    for (const [id, sprite] of this.planeSprites.entries()) {
      if (!activeIds.has(id)) {
        sprite.destroy();
        this.planeSprites.delete(id);
      }
    }

    // Add or update active plane sprites
    let hasCriticalFuel = false;
    for (const plane of activePlanes) {
      let sprite = this.planeSprites.get(plane.id);
      if (!sprite) {
        sprite = new PlaneSprite(this, plane);
        this.planeSprites.set(plane.id, sprite);
      }

      sprite.updateVisuals(time);

      if (plane.fuel < 20) {
        hasCriticalFuel = true;
      }
    }

    // Render path lines
    this.renderFlightPaths();

    // Alarm beep for planes with critical fuel
    if (hasCriticalFuel) {
      this.alarmTimer += dt;
      if (this.alarmTimer >= 1.2) {
        this.alarmTimer = 0;
        SoundEffects.playLowFuelBeep();
      }
    }
  }
}
