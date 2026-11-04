import { Plane, PlaneState } from './Plane.js';

export class Simulation {
  constructor(options = {}) {
    this.maxPlanes = options.maxPlanes || 10;
    this.baseSpawnInterval = options.baseSpawnInterval !== undefined ? options.baseSpawnInterval : 6.5;
    this.minSpawnInterval = options.minSpawnInterval !== undefined ? options.minSpawnInterval : 3.0;
    this.spawnTimer = 0;
    this.elapsedTime = 0;
    this.score = 0;
    this.combo = 1;
    this.isGameOver = false;
    this.gameOverReason = '';

    this.planes = []; // All active aircraft
    this.landedPlanes = [];

    // Screen dimensions
    this.width = options.width || 800;
    this.height = options.height || 450;

    // Runway configuration (Full width along bottom)
    this.runwayY = 395;
    // Left landing entry gate: x: 0 to 140, y: 360 to 430
    this.landingGate = {
      minX: 0,
      maxX: 140,
      minY: 360,
      maxY: 430,
    };

    // Collision threshold
    this.collisionDistance = 26; // Pixels
  }

  generateCallSign() {
    let cs = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 4; i++) {
      cs += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return cs;
  }

  spawnPlane(overrides = {}) {
    const callSign = overrides.callSign || this.generateCallSign();
    const fuel = overrides.fuel !== undefined ? overrides.fuel : (30 + Math.floor(Math.random() * 50));

    // Choose spawn edge: TOP or RIGHT
    const edge = overrides.spawnEdge || (Math.random() < 0.5 ? 'TOP' : 'RIGHT');
    let x, y, heading;

    if (edge === 'TOP') {
      x = overrides.x !== undefined ? overrides.x : (100 + Math.floor(Math.random() * 600));
      y = overrides.y !== undefined ? overrides.y : 15;
      // Heading down-left or down-right (between 0.4*PI and 0.6*PI)
      heading = overrides.heading !== undefined ? overrides.heading : (Math.PI * 0.35 + Math.random() * Math.PI * 0.3);
    } else {
      // RIGHT edge
      x = overrides.x !== undefined ? overrides.x : 785;
      y = overrides.y !== undefined ? overrides.y : (50 + Math.floor(Math.random() * 260));
      // Heading westward / southwest (between 0.9*PI and 1.1*PI)
      heading = overrides.heading !== undefined ? overrides.heading : (Math.PI * 0.9 + Math.random() * Math.PI * 0.2);
    }

    const plane = new Plane(callSign, fuel, {
      x,
      y,
      heading,
      ...overrides,
    });

    this.planes.push(plane);

    if (this.planes.length > this.maxPlanes) {
      this.triggerGameOver(`Overcrowding: More than ${this.maxPlanes} aircraft active!`);
    }

    return plane;
  }

  triggerGameOver(reason) {
    this.isGameOver = true;
    this.gameOverReason = reason;
  }

  update(dt) {
    if (this.isGameOver) return;

    this.elapsedTime += dt;
    this.spawnTimer += dt;

    // Progressive spawn pacing
    const currentSpawnInterval = Math.max(
      this.minSpawnInterval,
      this.baseSpawnInterval - Math.floor(this.score / 75)
    );

    if (this.spawnTimer >= currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnPlane();
      if (this.isGameOver) return;
    }

    // Fuel consumption rate
    const fuelDrainRate = 1.0 + Math.floor(this.score / 150) * 0.5;
    const fuelToBurn = fuelDrainRate * dt;

    // 1. Move planes, drain fuel, check bounds
    for (const plane of this.planes) {
      if (plane.state !== PlaneState.LANDED) {
        // Fuel only burns while airborne (stops immediately as soon as plane touches landing zone / starts rollout!)
        if (plane.state !== PlaneState.LANDING) {
          plane.timeInFlight += dt;
          plane.burnFuel(fuelToBurn);

          if (plane.isOutOfFuel()) {
            this.triggerGameOver(`Plane ${plane.callSign} ran out of fuel!`);
            return;
          }
        }

        plane.updateMovement(dt);

        // Check if plane enters left runway landing entry gate
        if (
          plane.state !== PlaneState.LANDING &&
          plane.state !== PlaneState.LANDED &&
          plane.x >= this.landingGate.minX &&
          plane.x <= this.landingGate.maxX &&
          plane.y >= this.landingGate.minY &&
          plane.y <= this.landingGate.maxY
        ) {
          // Locked into landing!
          plane.startLanding();
          plane.y = this.runwayY;
        }

        // Check if finished runway rollout (x > 820)
        if (plane.state === PlaneState.LANDING && plane.x > 820) {
          plane.finishLanding();
          const landingScore = Math.round((15 + plane.fuel) * this.combo);
          this.score += landingScore;
          this.combo = Math.min(5, this.combo + 1);
          this.landedPlanes.push(plane);
        }

        // Soft screen bounce for unassigned cruising planes so they stay in bounds
        if (!plane.hasPath() && plane.state === PlaneState.CRUISING) {
          if (plane.x < 25) { plane.x = 25; plane.heading = Math.PI - plane.heading; }
          if (plane.x > 780) { plane.x = 780; plane.heading = Math.PI - plane.heading; }
          if (plane.y < 25) { plane.y = 25; plane.heading = -plane.heading; }
          if (plane.y > 360) { plane.y = 360; plane.heading = -plane.heading; }
        }
      }
    }

    // 2. Check 2D Proximity Collisions between all active airborne planes
    for (let i = 0; i < this.planes.length; i++) {
      for (let j = i + 1; j < this.planes.length; j++) {
        const p1 = this.planes[i];
        const p2 = this.planes[j];

        // Only check planes that are still airborne (not finished rollout)
        if (p1.state !== PlaneState.LANDED && p2.state !== PlaneState.LANDED) {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < this.collisionDistance) {
            this.triggerGameOver(
              `Mid-air collision between ${p1.callSign} and ${p2.callSign}!`
            );
            return;
          }
        }
      }
    }

    // Remove finished landed planes from active array
    this.planes = this.planes.filter(p => p.state !== PlaneState.LANDED);
  }

  getPlanes() {
    return [...this.planes];
  }

  getState() {
    return {
      score: this.score,
      combo: this.combo,
      elapsedTime: Math.floor(this.elapsedTime),
      activePlanesCount: this.planes.length,
      landedCount: this.landedPlanes.length,
      isGameOver: this.isGameOver,
      gameOverReason: this.gameOverReason,
    };
  }
}
