import { describe, it, expect } from 'vitest';
import { Plane, PlaneState } from '../../src/domain/Plane.js';

describe('Plane Domain Model', () => {
  it('initializes with proper attributes and default state', () => {
    const plane = new Plane('ABCD', 60, { altitude: 120, landingDuration: 6 });
    expect(plane.callSign).toBe('ABCD');
    expect(plane.fuel).toBe(60);
    expect(plane.maxFuel).toBe(60);
    expect(plane.altitude).toBe(120);
    expect(plane.landingDuration).toBe(6);
    expect(plane.state).toBe(PlaneState.CIRCLING);
    expect(plane.timeInFlight).toBe(0);
    expect(plane.landingProgress).toBe(0);
  });

  it('drains fuel per tick and reports if empty', () => {
    const plane = new Plane('WXYZ', 50);
    const stillAlive = plane.burnFuel(5);
    expect(stillAlive).toBe(true);
    expect(plane.fuel).toBe(45);

    const isDead = plane.burnFuel(50);
    expect(isDead).toBe(false);
    expect(plane.fuel).toBe(0);
    expect(plane.isOutOfFuel()).toBe(true);
  });

  it('handles state transitions: CIRCLING -> APPROACHING -> LANDED', () => {
    const plane = new Plane('TEST', 40);
    plane.startApproach();
    expect(plane.state).toBe(PlaneState.APPROACHING);

    plane.advanceLanding(0.5);
    expect(plane.landingProgress).toBe(0.5);

    plane.touchdown();
    expect(plane.state).toBe(PlaneState.LANDED);
  });

  it('handles abort landing (Go-Around) back to CIRCLING', () => {
    const plane = new Plane('TEST', 40);
    plane.startApproach();
    plane.advanceLanding(0.4);
    plane.abortLanding(150);

    expect(plane.state).toBe(PlaneState.CIRCLING);
    expect(plane.altitude).toBe(150);
    expect(plane.landingProgress).toBe(0);
  });
});
