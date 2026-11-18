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
    this.sim = new Simulation({ width: this.scale.width, height: this.scale.height });
    this.planeSprites = new Map(); // planeId -> PlaneSprite

    // Ensure safe plane texture key with fallback to default 'plane'
    let planeTex = CustomizationManager.selectedPlane || 'plane';
    if (!this.textures.exists(planeTex)) {
      planeTex = 'plane';
    }
    this.currentPlaneTextureKey = planeTex;

    const W = this.scale.width;
    const H = this.scale.height;

    // Sky Background gradient (Always exists as reliable default base)
    this.skyBg = this.add.rectangle(W / 2, H / 2, W, H, 0x1c3d5a);

    // Custom / Preset Background Image (layers over skyBg if active)
    this.bgSprite = this.add.image(W / 2, H / 2, 'runway').setVisible(false);

    // Restore any custom textures saved in storage
    CustomizationManager.restoreCustomTextures(this);

    // Apply active background preference (safely falls back to default sky if no custom texture)
    this.applyBackground(CustomizationManager.selectedBackground || 'default');

    // Decorative clouds drifting in background
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(Phaser.Math.Between(40, W - 50), Phaser.Math.Between(40, H * 0.6), 'cloud');
      c.setAlpha(0.25);
      c.setScale(Phaser.Math.FloatBetween(1.0, 1.8));
      this.clouds.push(c);
    }

    // Runway (Full width along bottom)
    this.runway = this.add.image(W / 2, H - 35, 'runway').setOrigin(0.5, 0.5).setDisplaySize(W, 70);

    // Left Gate Landing Marker (Visual landing threshold box with Stardew gold)
    this.gateZoneMarker = this.add.rectangle(65, H - 35, 120, 40);
    this.gateZoneMarker.setStrokeStyle(2, 0xe8c56a, 0.9);

    this.gateText = this.add.text(65, H - 70, '▼ LANDING ENTRY ▼', {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '8px',
      color: '#e8c56a',
      backgroundColor: '#2a1c10cc',
      padding: { x: 4, y: 3 },
    }).setOrigin(0.5);

    // Dynamic Flight Path Graphics layer (drawn above background, below planes & HUD)
    this.pathGraphics = this.add.graphics();
    this.pathGraphics.setDepth(10);

    // HUD Header (depth 100 - always top layer)
    this.hud = new HUD(this);

    // Path drawing state
    this.drawingPlane = null;
    this.currentPathPoints = [];

    // Flight boundary: flight path cannot be drawn under or into the HUD area (y < 46)
    const MIN_FLIGHT_Y = 46;

    // Pointer input listeners for drawing flight paths
    this.input.on('pointermove', (pointer) => {
      if (this.drawingPlane) {
        // Enforce boundary: clamp flight path strictly below the HUD area
        const safeY = Math.max(MIN_FLIGHT_Y, pointer.y);
        const last = this.currentPathPoints[this.currentPathPoints.length - 1];
        if (!last) {
          this.currentPathPoints.push({ x: pointer.x, y: safeY });
        } else {
          const dist = Math.hypot(pointer.x - last.x, safeY - last.y);
          if (dist > 10) {
            // Interpolate rapid pointer movements to keep curves smooth and unbroken
            if (dist > 20) {
              const steps = Math.min(6, Math.floor(dist / 10));
              for (let s = 1; s < steps; s++) {
                const t = s / steps;
                this.currentPathPoints.push({
                  x: last.x + (pointer.x - last.x) * t,
                  y: last.y + (safeY - last.y) * t,
                });
              }
            }
            this.currentPathPoints.push({ x: pointer.x, y: safeY });
          }
        }
      }
    });

    this.input.on('pointerup', () => {
      if (this.drawingPlane) {
        if (this.currentPathPoints.length > 1) {
          const pts = this.currentPathPoints.map(p => ({
            x: p.x,
            y: Math.max(MIN_FLIGHT_Y, p.y),
          }));
          this.drawingPlane.assignPath(pts);
          SoundEffects.playGoAround(); // Chime for new course
        }
        const sprite = this.planeSprites.get(this.drawingPlane.id);
        if (sprite) {
          sprite.selectionRing.setStrokeStyle(1.5, 0xe8c56a, 0);
        }
        this.drawingPlane = null;
        this.currentPathPoints = [];
      }
    });

    // Low fuel alarm timer
    this.alarmTimer = 0;

    // Spawn 1 initial plane for instant action
    this.sim.spawnPlane();

    // Handle window/container resize
    this.scale.on('resize', (gameSize) => {
      this._handleResize(gameSize.width, gameSize.height);
    });
  }

  _handleResize(W, H) {
    // Update simulation dimensions
    if (this.sim) {
      this.sim.width = W;
      this.sim.height = H;
      this.sim.runwayY = H - 55;
      this.sim.landingGate = {
        minX: 0,
        maxX: 140,
        minY: H - 90,
        maxY: H - 20,
      };
    }

    // Reposition background
    if (this.skyBg) this.skyBg.setPosition(W / 2, H / 2).setSize(W, H);
    if (this.bgSprite) {
      this.bgSprite.setPosition(W / 2, H / 2).setDisplaySize(W, H);
    }

    // Reposition runway
    if (this.runway) {
      this.runway.setPosition(W / 2, H - 35).setDisplaySize(W, 70);
    }

    // Reposition gate
    if (this.gateZoneMarker) this.gateZoneMarker.setPosition(65, H - 35);
    if (this.gateText) this.gateText.setPosition(65, H - 70);

    // Reposition HUD
    if (this.hud) this.hud.resize(W, H);

    // Rescale active aircraft sprites proportionally
    for (const sprite of this.planeSprites.values()) {
      if (sprite.adjustScale) sprite.adjustScale();
    }
  }

  applyBackground(bgKey) {
    if (!this.skyBg) return;
    const W = this.scale.width;
    const H = this.scale.height;

    if (bgKey && bgKey !== 'default' && this.textures.exists(bgKey)) {
      if (!this.bgSprite) {
        this.bgSprite = this.add.image(W / 2, H / 2, bgKey).setDisplaySize(W, H);
        this.children.sendToBack(this.bgSprite);
        this.children.sendToBack(this.skyBg);
      } else {
        this.bgSprite.setTexture(bgKey);
        this.bgSprite.setDisplaySize(W, H);
        this.bgSprite.setVisible(true);
      }
      this.skyBg.setVisible(false);
    } else {
      if (this.bgSprite) this.bgSprite.setVisible(false);
      this.skyBg.setVisible(true);
    }

    if (this.clouds) {
      this.clouds.forEach(c => c.setVisible(true));
    }
  }

  applyPlaneTexture(planeKey) {
    if (!this.textures.exists(planeKey)) {
      planeKey = 'plane';
    }
    this.currentPlaneTextureKey = planeKey;
    for (const sprite of this.planeSprites.values()) {
      sprite.setPlaneTexture(planeKey);
    }
  }

  startPathDrawing(plane) {
    if (plane.state === 'LANDED') return;
    this.drawingPlane = plane;
    // Start drawing directly from current aircraft location, strictly below the HUD
    const startY = Math.max(46, plane.y);
    this.currentPathPoints = [{ x: plane.x, y: startY }];
    const sprite = this.planeSprites.get(plane.id);
    if (sprite) {
      sprite.selectionRing.setStrokeStyle(2, 0xe8c56a, 1);
    }
  }

  showPopupText(x, y, message, color = '#e8c56a') {
    const text = this.add.text(x, y - 20, message, {
      fontFamily: "'Press Start 2P', monospace",
      fontSize: '11px',
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
    const H = this.scale.height;
    this.showPopupText(140, H - 55, `+${landingScore} PTS!`, '#e8c56a');

    // Smoke puff emitter on runway threshold contact
    for (let i = 0; i < 6; i++) {
      const p = this.add.image(100 + Phaser.Math.Between(-15, 15), H - 35 + Phaser.Math.Between(-5, 5), 'smoke-particle');
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
        // Red tone if fuel low, warm Stardew gold otherwise
        const lineColor = plane.fuel < 20 ? 0xc0392b : 0xe8c56a;
        this.pathGraphics.lineStyle(2, lineColor, 0.85);

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
      this.pathGraphics.lineStyle(2, 0x7ec892, 0.95); // Stardew vibrant green for active draw
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
      if (c.x < -60) c.x = this.scale.width + 60;
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
