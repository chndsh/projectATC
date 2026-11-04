export const PlaneState = Object.freeze({
  CIRCLING: 'CIRCLING',
  APPROACHING: 'APPROACHING',
  LANDED: 'LANDED',
  CRASHED: 'CRASHED',
});

export class Plane {
  constructor(callSign, fuel, options = {}) {
    this.id = options.id || `${callSign}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.callSign = callSign;
    this.fuel = Math.max(0, fuel);
    this.maxFuel = this.fuel;
    this.altitude = options.altitude || 100;
    this.landingDuration = options.landingDuration || (4 + Math.floor(Math.random() * 5)); // 4-8 seconds
    this.state = PlaneState.CIRCLING;
    this.timeInFlight = 0;
    this.landingProgress = 0; // 0.0 to 1.0 (touchdown)
    this.speed = options.speed || (1 / this.landingDuration); // progress per second
  }

  burnFuel(amount) {
    this.fuel = Math.max(0, this.fuel - amount);
    return this.fuel > 0;
  }

  isOutOfFuel() {
    return this.fuel <= 0;
  }

  startApproach() {
    this.state = PlaneState.APPROACHING;
    this.landingProgress = 0;
  }

  advanceLanding(deltaProgress) {
    if (this.state !== PlaneState.APPROACHING) return;
    this.landingProgress = Math.min(1.0, this.landingProgress + deltaProgress);
  }

  touchdown() {
    this.state = PlaneState.LANDED;
    this.landingProgress = 1.0;
  }

  abortLanding(returnAltitude = 120) {
    this.state = PlaneState.CIRCLING;
    this.landingProgress = 0;
    this.altitude = returnAltitude;
  }
}
