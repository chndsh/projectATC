import { Plane, PlaneState } from './Plane.js';
import { LandingQueue } from './LandingQueue.js';

export class Simulation {
  constructor(options = {}) {
    this.maxPlanes = options.maxPlanes || 10;
    this.baseSpawnInterval = options.baseSpawnInterval !== undefined ? options.baseSpawnInterval : 7.0; // Friendly initial pacing (7s)
    this.minSpawnInterval = options.minSpawnInterval !== undefined ? options.minSpawnInterval : Math.min(3.5, this.baseSpawnInterval);
    this.spawnTimer = 0;
    this.elapsedTime = 0;
    this.score = 0;
    this.combo = 1;
    this.landedPlanes = [];
    this.isGameOver = false;
    this.gameOverReason = '';

    this.airspace = []; // Circling planes
    this.landingQueue = new LandingQueue(); // Approach queue

    // Assigned altitudes for visual separation (e.g. 80, 130, 180, 230, 280)
    this.altitudeSlots = [80, 130, 180, 230, 280];
  }

  generateCallSign() {
    let cs = '';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for (let i = 0; i < 4; i++) {
      cs += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return cs;
  }

  getAvailableAltitude() {
    const used = new Set(this.airspace.map(p => p.altitude));
    const available = this.altitudeSlots.filter(a => !used.has(a));
    if (available.length > 0) {
      return available[Math.floor(Math.random() * available.length)];
    }
    return 80 + Math.floor(Math.random() * 200);
  }

  spawnPlane(overrides = {}) {
    const callSign = overrides.callSign || this.generateCallSign();
    const fuel = overrides.fuel !== undefined ? overrides.fuel : (25 + Math.floor(Math.random() * 55));
    const landingDuration = overrides.landingDuration || (4 + Math.floor(Math.random() * 5));
    const altitude = overrides.altitude || this.getAvailableAltitude();

    const plane = new Plane(callSign, fuel, {
      altitude,
      landingDuration,
      ...overrides,
    });

    this.airspace.push(plane);

    // Overcrowding check
    if (this.getTotalActivePlanes() > this.maxPlanes) {
      this.triggerGameOver(`Overcrowding: More than ${this.maxPlanes} aircraft active in airspace!`);
    }

    return plane;
  }

  getTotalActivePlanes() {
    return this.airspace.length + this.landingQueue.size();
  }

  getAirspace() {
    return [...this.airspace];
  }

  getLandingQueue() {
    return this.landingQueue;
  }

  requestLanding(planeId) {
    if (this.isGameOver) return false;
    const index = this.airspace.findIndex(p => p.id === planeId);
    if (index === -1) return false;

    const [plane] = this.airspace.splice(index, 1);
    this.landingQueue.enqueue(plane);
    return true;
  }

  abortLanding(planeId) {
    if (this.isGameOver) return false;
    const plane = this.landingQueue.remove(planeId);
    if (!plane) return false;

    plane.abortLanding(this.getAvailableAltitude());
    this.airspace.push(plane);
    // Aborting resets combo
    this.combo = 1;
    return true;
  }

  triggerGameOver(reason) {
    this.isGameOver = true;
    this.gameOverReason = reason;
  }

  update(dt) {
    if (this.isGameOver) return;

    this.elapsedTime += dt;
    this.spawnTimer += dt;

    // Progressive spawn pacing calculation
    const currentSpawnInterval = Math.max(
      this.minSpawnInterval,
      this.baseSpawnInterval - Math.floor(this.score / 60)
    );

    if (this.spawnTimer >= currentSpawnInterval) {
      this.spawnTimer = 0;
      this.spawnPlane();
      if (this.isGameOver) return;
    }

    // Fuel drain calculation (1%/sec + score scaling)
    const fuelDrainRate = 1.0 + Math.floor(this.score / 150) * 0.5;
    const fuelToBurn = fuelDrainRate * dt;

    // 1. Drain circling planes
    for (const plane of this.airspace) {
      plane.timeInFlight += dt;
      plane.burnFuel(fuelToBurn);
      if (plane.isOutOfFuel()) {
        this.triggerGameOver(`Plane ${plane.callSign} ran out of fuel in airspace!`);
        return;
      }
    }

    // 2. Drain planes on approach (Option A: fuel burns until touchdown)
    for (const plane of this.landingQueue.getPlanes()) {
      plane.timeInFlight += dt;
      plane.burnFuel(fuelToBurn);
      if (plane.isOutOfFuel()) {
        this.triggerGameOver(`Plane ${plane.callSign} ran out of fuel on final approach!`);
        return;
      }
    }

    // 3. Update landing queue progress and check catch-up collisions
    const collision = this.landingQueue.update(dt);
    if (collision.hasCollision) {
      this.triggerGameOver(collision.reason);
      return;
    }

    // 4. Process successful touchdowns
    const newlyLanded = this.landingQueue.getLandedPlanes();
    for (const plane of newlyLanded) {
      const landingScore = Math.round((10 + plane.fuel) * this.combo);
      this.score += landingScore;
      this.combo = Math.min(5, this.combo + 1); // Combo caps at x5
      this.landedPlanes.push(plane);
    }
  }

  getState() {
    return {
      score: this.score,
      combo: this.combo,
      elapsedTime: Math.floor(this.elapsedTime),
      activePlanesCount: this.getTotalActivePlanes(),
      circlingCount: this.airspace.length,
      approachingCount: this.landingQueue.size(),
      landedCount: this.landedPlanes.length,
      isGameOver: this.isGameOver,
      gameOverReason: this.gameOverReason,
    };
  }
}
