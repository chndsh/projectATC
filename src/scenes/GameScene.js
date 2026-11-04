import Phaser from 'phaser';
import { Simulation } from '../domain/Simulation.js';
import { PlaneSprite } from '../ui/PlaneSprite.js';
import { HUD } from '../ui/HUD.js';
import { SoundEffects } from '../audio/SoundEffects.js';

export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create() {
    this.sim = new Simulation();
    this.planeSprites = new Map(); // planeId -> PlaneSprite

    // Sky Background gradient
    this.skyBg = this.add.rectangle(400, 225, 800, 450, 0x0c4a6e);

    // Decorative clouds drifting in background
    this.clouds = [];
    for (let i = 0; i < 4; i++) {
      const c = this.add.image(Phaser.Math.Between(40, 750), Phaser.Math.Between(50, 300), 'cloud');
      c.setAlpha(0.3);
      c.setScale(Phaser.Math.FloatBetween(1.0, 1.8));
      this.clouds.push(c);
    }

    // Runway (bottom right)
    this.runway = this.add.image(640, 400, 'runway').setOrigin(0.5, 0.5);

    // Approach Glide Slope Guide (dashed angled line from 480, 80 down to 480, 400)
    // Glide path coordinates: Start at (480, 80), touchdown at (520, 395)
    this.glideStart = { x: 480, y: 70 };
    this.glideEnd = { x: 540, y: 395 };
    this.runwayEnd = { x: 780, y: 395 };

    this.glideGuide = this.add.graphics();
    this.drawGlideSlope();

    // Drop zone highlight area
    this.dropZone = this.add.zone(640, 240, 320, 360).setRectangleDropZone(320, 360);

    // HUD Header
    this.hud = new HUD(this);

    // Low fuel alarm timer
    this.alarmTimer = 0;

    // Spawn 1 initial plane for instant action
    this.sim.spawnPlane();
  }

  drawGlideSlope() {
    this.glideGuide.clear();
    this.glideGuide.lineStyle(2, 0x38bdf8, 0.4);

    // Dashed glide slope line
    const dx = this.glideEnd.x - this.glideStart.x;
    const dy = this.glideEnd.y - this.glideStart.y;
    const steps = 18;
    for (let i = 0; i < steps; i += 2) {
      const t1 = i / steps;
      const t2 = (i + 1) / steps;
      this.glideGuide.lineBetween(
        this.glideStart.x + dx * t1,
        this.glideStart.y + dy * t1,
        this.glideStart.x + dx * t2,
        this.glideStart.y + dy * t2
      );
    }

    // Zone label
    this.add.text(500, 52, 'APPROACH GLIDE PATH', {
      fontFamily: 'Courier New, monospace',
      fontSize: '11px',
      color: '#38bdf888',
      fontStyle: 'bold',
    });
  }

  handlePlaneDroppedToApproach(plane) {
    const success = this.sim.requestLanding(plane.id);
    if (!success) {
      // Revert position if request failed
      const sprite = this.planeSprites.get(plane.id);
      if (sprite) {
        sprite.x = sprite.dragStartPos.x;
        sprite.y = sprite.dragStartPos.y;
      }
    }
  }

  handlePlaneRightClicked(plane) {
    if (plane.state === 'APPROACHING') {
      const success = this.sim.abortLanding(plane.id);
      if (success) {
        SoundEffects.playGoAround();
        this.showPopupText(this.planeSprites.get(plane.id), 'GO-AROUND!', '#38bdf8');
      }
    }
  }

  showPopupText(source, message, color = '#22c55e') {
    if (!source) return;
    const text = this.add.text(source.x, source.y - 25, message, {
      fontFamily: 'Courier New, monospace',
      fontSize: '13px',
      fontStyle: 'bold',
      color: color,
    }).setOrigin(0.5);

    this.tweens.add({
      targets: text,
      y: text.y - 20,
      alpha: 0,
      duration: 800,
      ease: 'Power1',
      onComplete: () => text.destroy(),
    });
  }

  showTouchdownEffect(plane) {
    SoundEffects.playTouchdown();
    const landingScore = Math.round((10 + plane.fuel) * this.sim.combo);
    this.showPopupText({ x: this.glideEnd.x + 30, y: this.glideEnd.y }, `+${landingScore} PTS!`, '#22c55e');

    // Smoke puff emitter on runway contact
    for (let i = 0; i < 5; i++) {
      const p = this.add.image(this.glideEnd.x + Phaser.Math.Between(-10, 10), this.glideEnd.y + 4, 'smoke-particle');
      this.tweens.add({
        targets: p,
        x: p.x - Phaser.Math.Between(15, 30),
        y: p.y - Phaser.Math.Between(5, 15),
        alpha: 0,
        scale: 2.0,
        duration: 400,
        onComplete: () => p.destroy(),
      });
    }
  }

  update(time, delta) {
    const dt = delta / 1000;

    // Slowly scroll background clouds
    for (const c of this.clouds) {
      c.x -= 15 * dt;
      if (c.x < -60) c.x = 860;
    }

    if (this.sim.isGameOver) return;

    // Capture previous landed count to detect touchdowns this tick
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

    // Sync sprites for circling planes
    const activePlanes = [...this.sim.getAirspace(), ...this.sim.getLandingQueue().getPlanes()];
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
        // Spawn from left edge
        sprite = new PlaneSprite(this, plane, 20, plane.altitude);
        this.planeSprites.set(plane.id, sprite);
      }

      if (!sprite.isDragging) {
        if (plane.state === 'CIRCLING') {
          // Circle horizontally across the left sector (x: 40 to 440)
          sprite.x += 40 * dt;
          if (sprite.x > 440) {
            sprite.x = 20; // Wrap around
          }
          sprite.y = plane.altitude;
        } else if (plane.state === 'APPROACHING') {
          // Interpolate down the glide path: 0.0 to 1.0
          const t = plane.landingProgress;
          sprite.x = Phaser.Math.Linear(this.glideStart.x, this.glideEnd.x, t);
          sprite.y = Phaser.Math.Linear(this.glideStart.y, this.glideEnd.y, t);
        }
      }

      sprite.updateVisuals(time);

      if (plane.fuel < 20) {
        hasCriticalFuel = true;
      }
    }

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
