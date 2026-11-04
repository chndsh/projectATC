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
    this.altitude = this.y; // Designated holding altitude
    this.heading = options.heading !== undefined ? options.heading : Math.PI; // Default westbound (flying left)
    this.speed = options.speed || 45; // Pixels per second

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
    // When a player finishes drawing a path, drop points that are behind the aircraft's current live location
    // or within immediate proximity (dist <= 15).
    let startIndex = 0;
    while (startIndex < points.length - 1) {
      const pt = points[startIndex];
      const dx = pt.x - this.x;
      const dy = pt.y - this.y;
      const dist = Math.hypot(dx, dy);

      // In the plane's flight heading frame, check if waypoint is behind plane or very close
      // Note: for a plane moving left (heading = Math.PI), cos(PI) = -1.
      const forwardDot = dx * Math.cos(this.heading) + dy * Math.sin(this.heading);

      if (dist <= 15 || forwardDot < -5) {
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
      // Hold at constant assigned altitude when unassigned:
      // Fly along its current heading at its fixed altitude y level
      this.y = this.altitude;
      this.x += Math.cos(this.heading) * this.speed * dt;
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
