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
    this.targetAltitude = options.targetAltitude !== undefined ? options.targetAltitude : this.y;
    this.isLevelFlight = options.isLevelFlight !== undefined ? options.isLevelFlight : (Math.abs(this.y - this.targetAltitude) < 2);

    this.heading = options.heading !== undefined ? options.heading : Math.PI; // Default westbound (flying left)
    this.speed = options.speed || 45; // Pixels per second
    this.turnSpeed = options.turnSpeed !== undefined ? options.turnSpeed : 5.0; // Responsive turning for accurate path following

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

    // Check if the user intentionally drew a significant path behind the aircraft's current position
    // (e.g. extending > 40px behind the plane opposite to its heading vector)
    const cosH = Math.cos(this.heading);
    const sinH = Math.sin(this.heading);

    let maxBehind = 0;
    for (const pt of points) {
      const proj = (pt.x - this.x) * cosH + (pt.y - this.y) * sinH;
      if (proj < 0) {
        maxBehind = Math.max(maxBehind, -proj);
      }
    }

    const hasSignificantPathBehind = maxBehind > 40;

    let startIndex = 0;
    if (!hasSignificantPathBehind) {
      // The user did not draw a significant reverse path behind the plane.
      // Drop stale initial waypoints from where the gesture was initiated that the plane
      // has already flown past while drawing (points close to the plane and behind/abreast).
      while (startIndex < points.length - 1) {
        const pt = points[startIndex];
        const dx = pt.x - this.x;
        const dy = pt.y - this.y;
        const dist = Math.hypot(dx, dy);
        const proj = dx * cosH + dy * sinH;

        // If this waypoint is near the plane (dist <= 35) and behind/abreast (proj <= 5),
        // the plane has already moved past it — drop it!
        if (dist <= 35 && proj <= 5) {
          startIndex++;
        } else {
          break;
        }
      }
    } else {
      // Significant path drawn behind: only drop points directly under the plane (dist <= 8)
      while (startIndex < points.length - 1) {
        const pt = points[startIndex];
        const dist = Math.hypot(pt.x - this.x, pt.y - this.y);
        if (dist <= 8) {
          startIndex++;
        } else {
          break;
        }
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

      // Desired target heading
      const desiredHeading = Math.atan2(dy, dx);

      // Smooth realistic angular turn towards desired heading:
      let diff = desiredHeading - this.heading;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      while (diff > Math.PI) diff -= 2 * Math.PI;

      const maxTurn = this.turnSpeed * dt;
      if (Math.abs(diff) <= maxTurn) {
        this.heading = desiredHeading;
      } else {
        this.heading += Math.sign(diff) * maxTurn;
      }

      // Normalize heading within [-PI, PI]
      while (this.heading > Math.PI) this.heading -= 2 * Math.PI;
      while (this.heading < -Math.PI) this.heading += 2 * Math.PI;

      const step = this.speed * dt;
      const forwardProj = dx * Math.cos(this.heading) + dy * Math.sin(this.heading);

      // Reached waypoint: exact arrival within step, tight capture radius (8px),
      // or passed by closely in immediate proximity (dist <= 12 and forwardProj < 0)
      if (dist <= Math.max(step, 8) || (dist <= 12 && forwardProj < 0)) {
        if (dist <= step) {
          this.x = target.x;
          this.y = target.y;
        }
        this.path.shift();

        if (this.path.length === 0) {
          this.state = PlaneState.CRUISING;
          this.targetAltitude = this.y;
          this.isLevelFlight = true;
          this.heading = Math.cos(this.heading) < 0 ? Math.PI : 0;
        }
      }

      this.x += Math.cos(this.heading) * step;
      this.y += Math.sin(this.heading) * step;
    } else {
      // Unassigned movement:
      // If descending toward assigned altitude, fly along descent vector until reached
      if (!this.isLevelFlight) {
        const remainingDescent = this.targetAltitude - this.y;
        const verticalStep = Math.sin(this.heading) * this.speed * dt;

        if (remainingDescent <= verticalStep || Math.abs(this.y - this.targetAltitude) < 2) {
          // Reached target altitude! Smoothly level off into horizontal cruise
          this.y = this.targetAltitude;
          this.isLevelFlight = true;
          this.heading = Math.cos(this.heading) < 0 ? Math.PI : 0;
        } else {
          this.x += Math.cos(this.heading) * this.speed * dt;
          this.y += verticalStep;
        }
      } else {
        // Smoothly rotate towards horizontal flight (PI for left, 0 for right)
        const targetHeading = Math.cos(this.heading) < 0 ? Math.PI : 0;
        let diff = targetHeading - this.heading;
        while (diff < -Math.PI) diff += 2 * Math.PI;
        while (diff > Math.PI) diff -= 2 * Math.PI;

        const maxTurn = this.turnSpeed * dt;
        if (Math.abs(diff) <= maxTurn) {
          this.heading = targetHeading;
        } else {
          this.heading += Math.sign(diff) * maxTurn;
        }

        while (this.heading > Math.PI) this.heading -= 2 * Math.PI;
        while (this.heading < -Math.PI) this.heading += 2 * Math.PI;

        this.y = this.targetAltitude;
        this.x += Math.cos(this.heading) * this.speed * dt;
      }
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
