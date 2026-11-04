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
    this.path = points.map(pt => ({ x: pt.x, y: pt.y }));
    this.state = PlaneState.FOLLOWING_PATH;
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
      // Cruise straight in current heading
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
