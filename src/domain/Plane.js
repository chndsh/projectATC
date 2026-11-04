export const PlaneState = Object.freeze({
  CRUISING: 'CRUISING',
  FOLLOWING_PATH: 'FOLLOWING_PATH',
  LANDING: 'LANDING',
  LANDED: 'LANDED',
  CRASHED: 'CRASHED',
});

export class Plane {
  constructor(callSign, fuel, options = {}) {
    this.id = options.id || `${callSign}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.callSign = callSign;
    this.fuel = Math.max(0, fuel);
    this.maxFuel = this.fuel;

    // 2D Coordinates & Orientation
    this.x = options.x !== undefined ? options.x : 100;
    this.y = options.y !== undefined ? options.y : 100;
    this.heading = options.heading !== undefined ? options.heading : 0; // In radians
    this.speed = options.speed || 45; // Pixels per second
    this.turnRate = options.turnRate || 0.45; // Angular turn rate for circling in radians/sec

    this.state = PlaneState.CRUISING;
    this.timeInFlight = 0;
    this.path = []; // [{x, y}, ...]
    this.collisionRadius = 20; // 20px radius around plane
    this.landingRollSpeed = 90; // Once wheels down on runway
  }

  burnFuel(amount) {
    this.fuel = Math.max(0, this.fuel - amount);
    return this.fuel > 0;
  }

  isOutOfFuel() {
    return this.fuel <= 0;
  }

  assignPath(points) {
    if (!points || points.length === 0) return;

    // Eliminate backtracking:
    // When a player draws a path, the aircraft continues flying.
    // Only prune if there are multiple waypoints and the initial points are behind the current position
    // or within immediate proximity (dist < 15).
    let startIndex = 0;
    while (startIndex < points.length - 1) {
      const pt = points[startIndex];
      const dx = pt.x - this.x;
      const dy = pt.y - this.y;
      const dist = Math.hypot(dx, dy);

      // Check if point is behind aircraft relative to its flight vector
      const forwardDot = dx * Math.cos(this.heading) + dy * Math.sin(this.heading);

      if (dist < 15 || forwardDot < 0) {
        startIndex++;
      } else {
        break;
      }
    }

    const filtered = points.slice(startIndex).map(pt => ({ x: pt.x, y: pt.y }));
    if (filtered.length > 0) {
      this.path = filtered;
      this.state = PlaneState.FOLLOWING_PATH;
    }
  }

  clearPath() {
    this.path = [];
    if (this.state === PlaneState.FOLLOWING_PATH) {
      this.state = PlaneState.CRUISING;
    }
  }

  hasPath() {
    return this.path.length > 0;
  }

  updateMovement(dt) {
    if (this.state === PlaneState.LANDED || this.state === PlaneState.CRASHED) {
      return;
    }

    if (this.state === PlaneState.LANDING) {
      // Roll along the runway to the right
      this.heading = 0;
      this.x += this.landingRollSpeed * dt;
      return;
    }

    if (this.path.length > 0) {
      const target = this.path[0];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const dist = Math.hypot(dx, dy);

      // Desired heading angle towards target
      this.heading = Math.atan2(dy, dx);

      const step = this.speed * dt;
      if (dist <= step) {
        // Reached waypoint
        this.x = target.x;
        this.y = target.y;
        this.path.shift();

        if (this.path.length === 0) {
          this.state = PlaneState.CRUISING;
        }
      } else {
        this.x += Math.cos(this.heading) * step;
        this.y += Math.sin(this.heading) * step;
      }
    } else {
      // Circle around in airspace (gentle constant turn rate)
      this.heading += this.turnRate * dt;
      // Keep heading normalized between -PI and PI
      if (this.heading > Math.PI) this.heading -= 2 * Math.PI;
      if (this.heading < -Math.PI) this.heading += 2 * Math.PI;

      this.x += Math.cos(this.heading) * this.speed * dt;
      this.y += Math.sin(this.heading) * this.speed * dt;
    }
  }

  startLanding() {
    this.state = PlaneState.LANDING;
    this.path = [];
  }

  finishLanding() {
    this.state = PlaneState.LANDED;
  }
}
