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

    const H = this.height;

    // Available cruising altitude corridors (relative to screen height)
    this.altitudeCorridors = [
      Math.round(H * 0.22),
      Math.round(H * 0.33),
      Math.round(H * 0.44),
      Math.round(H * 0.56),
      Math.round(H * 0.67),
    ];

    // Runway configuration (Full width along bottom)
    this.runwayY = H - 55;
    // Left landing entry gate: x: 0 to 140, y: near runway
    this.landingGate = {
      minX: 0,
      maxX: 140,
      minY: H - 90,
      maxY: H - 20,
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
    // Planes spawn from left edge, right edge, and top (safely below HUD)
    const defaultSpawnTypes = ['TOP_ANGULAR', 'LEFT_EDGE', 'RIGHT_EDGE'];
    const spawnType = overrides.spawnType || defaultSpawnTypes[Math.floor(Math.random() * defaultSpawnTypes.length)];
    let x, y, heading, isLevelFlight;

    if (overrides.x !== undefined && overrides.y !== undefined) {
      x = overrides.x;
      y = overrides.y;
      heading = overrides.heading !== undefined ? overrides.heading : Math.PI;
      isLevelFlight = overrides.isLevelFlight !== undefined ? overrides.isLevelFlight : true;
    } else if (spawnType === 'LEFT_EDGE') {
      // Left edge ingress heading East into airspace
      x = overrides.x !== undefined ? overrides.x : 15;
      y = overrides.y !== undefined ? overrides.y : targetAltitude;
      heading = overrides.heading !== undefined ? overrides.heading : 0; // Eastbound
      isLevelFlight = true;
    } else if (spawnType === 'RIGHT_EDGE') {
      // Right edge ingress heading West into airspace
      x = overrides.x !== undefined ? overrides.x : this.width - 15;
      y = overrides.y !== undefined ? overrides.y : targetAltitude;
      heading = overrides.heading !== undefined ? overrides.heading : Math.PI; // Westbound
      isLevelFlight = true;
    } else {
      // TOP_ANGULAR: Spawn safely below the HUD area spanning across the full screen width
      x = overrides.x !== undefined
        ? overrides.x
        : (Math.round(this.width * 0.10) + Math.floor(Math.random() * Math.round(this.width * 0.80)));
      y = overrides.y !== undefined
        ? overrides.y
        : Math.max(62, Math.min(75, Math.round(this.height * 0.14)));

      // Ingress heading: angled downward towards the center of airspace
      if (overrides.heading !== undefined) {
        heading = overrides.heading;
      } else if (x > this.width * 0.5) {
        // From right side: shallow descent heading down-left (~18 degrees pitch)
        heading = Math.PI * 0.90 + Math.random() * 0.03;
      } else {
        // From left side: shallow descent heading down-right (~18 degrees pitch)
        heading = Math.PI * 0.10 - Math.random() * 0.03;
      }
      isLevelFlight = false;
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

        // 1. Check if plane enters left runway landing entry gate
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
        } else if (
          plane.state !== PlaneState.LANDING &&
          plane.state !== PlaneState.LANDED &&
          plane.y >= this.runwayY - 15
        ) {
          // Crashed: Touched down on the runway ground outside the designated landing entry gate!
          plane.state = PlaneState.CRASHED;
          this.triggerGameOver(
            `Plane ${plane.callSign} crashed on the runway! Aircraft must touch down inside the left landing entry gate.`
          );
          return;
        }

        // Check if finished runway rollout (x > width + 20)
        if (plane.state === PlaneState.LANDING && plane.x > this.width + 20) {
          plane.finishLanding();
          const landingScore = Math.round((15 + plane.fuel) * this.combo);
          this.score += landingScore;
          this.combo = Math.min(5, this.combo + 1);
          this.landedPlanes.push(plane);
        }

        // Screen edge wrapping & circulation:
        // Westbound aircraft wrap to right side; Eastbound aircraft wrap to left side
        if (!plane.hasPath() && plane.state === PlaneState.CRUISING) {
          if (plane.x < -10) {
            // Flying left off-screen: wrap to right edge flying left at fresh altitude
            plane.x = this.width - 10;
            plane.targetAltitude = this.getFreeAltitude();
            plane.y = plane.targetAltitude;
            plane.heading = Math.PI;
            plane.isLevelFlight = true;
          } else if (plane.x > this.width + 20) {
            // Flying right off-screen: wrap to left edge flying right at fresh altitude
            plane.x = 10;
            plane.targetAltitude = this.getFreeAltitude();
            plane.y = plane.targetAltitude;
            plane.heading = 0;
            plane.isLevelFlight = true;
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
