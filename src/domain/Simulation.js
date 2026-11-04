import { Plane, PlaneState } from './Plane.js';

export class Simulation {
  constructor(options = {}) {
    this.maxPlanes = options.maxPlanes || Infinity; // No arbitrary cap on active planes!
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

    // Available cruising altitude corridors (well below HUD, above runway)
    this.altitudeCorridors = [100, 150, 200, 250, 300];

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

  getFreeAltitude() {
    const used = new Set(this.planes.map(p => p.targetAltitude));
    const free = this.altitudeCorridors.filter(a => !used.has(a));
    if (free.length > 0) {
      return free[Math.floor(Math.random() * free.length)];
    }
    return this.altitudeCorridors[Math.floor(Math.random() * this.altitudeCorridors.length)];
  }

  spawnPlane(overrides = {}) {
    const callSign = overrides.callSign || this.generateCallSign();
    const fuel = overrides.fuel !== undefined ? overrides.fuel : (30 + Math.floor(Math.random() * 50));

    // Choose target altitude
    const targetAltitude = overrides.targetAltitude !== undefined
      ? overrides.targetAltitude
      : (overrides.y !== undefined ? overrides.y : this.getFreeAltitude());

    // Spawn origin:
    // Either from below HUD (y = 52) with graceful angular descent,
    // or from right edge at an altitude corridor
    const spawnType = overrides.spawnType || (Math.random() < 0.5 ? 'TOP_ANGULAR' : 'RIGHT_EDGE');
    let x, y, heading, isLevelFlight;

    if (overrides.x !== undefined && overrides.y !== undefined) {
      x = overrides.x;
      y = overrides.y;
      heading = overrides.heading !== undefined ? overrides.heading : Math.PI;
      isLevelFlight = overrides.isLevelFlight !== undefined ? overrides.isLevelFlight : true;
    } else if (spawnType === 'TOP_ANGULAR') {
      // Spawn safely below the HUD (dashboard is y: 0 to 45)
      x = overrides.x !== undefined ? overrides.x : (200 + Math.floor(Math.random() * 500));
      y = overrides.y !== undefined ? overrides.y : 52;
      // Realistic graceful shallow ingress angle (~15-20 degrees descent pitch: 0.88*PI to 0.94*PI)
      heading = overrides.heading !== undefined ? overrides.heading : (Math.PI * 0.90 + Math.random() * 0.05);
      isLevelFlight = false;
    } else {
      // Right edge
      x = overrides.x !== undefined ? overrides.x : 785;
      y = overrides.y !== undefined ? overrides.y : targetAltitude;
      heading = overrides.heading !== undefined ? overrides.heading : Math.PI; // Westbound
      isLevelFlight = true;
    }

    const plane = new Plane(callSign, fuel, {
      x,
      y,
      heading,
      targetAltitude,
      isLevelFlight,
      ...overrides,
    });

    this.planes.push(plane);
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
        // Fuel only burns while airborne
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

        // Screen edge wrapping & circulation:
        // When unassigned plane flies off left side (< 0), it rounds and re-enters from right side
        // at an available altitude corridor to avoid blocking new spawns!
        if (!plane.hasPath() && plane.state === PlaneState.CRUISING) {
          if (plane.x < -10) {
            plane.x = 790;
            plane.targetAltitude = this.getFreeAltitude();
            plane.y = plane.targetAltitude;
            plane.heading = Math.PI; // Fly leftward across new corridor
            plane.isLevelFlight = true;
          } else if (plane.x > 820) {
            plane.x = 790;
            plane.heading = Math.PI;
          }
        }
      }
    }

    // 2. Check 2D Proximity Collisions between all active airborne planes
    for (let i = 0; i < this.planes.length; i++) {
      for (let j = i + 1; j < this.planes.length; j++) {
        const p1 = this.planes[i];
        const p2 = this.planes[j];

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
