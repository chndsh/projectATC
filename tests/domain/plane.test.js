import { describe, it, expect } from 'vitest';
import { Plane, PlaneState } from '../../src/domain/Plane.js';

describe('Plane Domain Model 2D', () => {
  it('initializes with 2D coordinates, heading, and default state', () => {
    const plane = new Plane('ABCD', 60, { x: 100, y: 50, heading: Math.PI / 4 });
    expect(plane.callSign).toBe('ABCD');
    expect(plane.x).toBe(100);
    expect(plane.y).toBe(50);
    expect(plane.heading).toBe(Math.PI / 4);
    expect(plane.state).toBe(PlaneState.CRUISING);
    expect(plane.path).toEqual([]);
  });

  it('drains fuel and reports empty', () => {
    const plane = new Plane('WXYZ', 30);
    plane.burnFuel(10);
    expect(plane.fuel).toBe(20);
    expect(plane.isOutOfFuel()).toBe(false);

    plane.burnFuel(25);
    expect(plane.fuel).toBe(0);
    expect(plane.isOutOfFuel()).toBe(true);
  });

  it('assigns custom waypoints and follows them step by step', () => {
    const plane = new Plane('PATH', 50, { x: 100, y: 100, heading: 0, speed: 50 });
    const points = [
      { x: 150, y: 100 },
      { x: 150, y: 150 },
    ];

    plane.assignPath(points);
    expect(plane.hasPath()).toBe(true);
    expect(plane.path.length).toBe(2);

    // Update by 0.5s at speed 50 (travels 25 units towards 150, 100)
    plane.updateMovement(0.5);
    expect(plane.x).toBeCloseTo(125, 0);
    expect(plane.y).toBeCloseTo(100, 0);

    // Another 0.6s reaches and consumes first waypoint
    plane.updateMovement(0.6);
    expect(plane.path.length).toBe(1);
    expect(plane.path[0]).toEqual({ x: 150, y: 150 });
  });

  it('supports re-routing by overwriting existing path with new waypoints', () => {
    const plane = new Plane('REROUTE', 50, { x: 50, y: 50 });
    plane.assignPath([{ x: 200, y: 50 }]);
    expect(plane.path[0].x).toBe(200);

    // User draws new path to avoid danger
    plane.assignPath([{ x: 50, y: 200 }, { x: 10, y: 395 }]);
    expect(plane.path.length).toBe(2);
    expect(plane.path[0]).toEqual({ x: 50, y: 200 });
  });

  it('rotates smoothly towards target waypoints instead of instantly snapping', () => {
    // Plane heading east (heading = 0), waypoint is straight south (heading = PI/2)
    const plane = new Plane('TURN', 50, { x: 100, y: 100, heading: 0, turnSpeed: 2.0 });
    plane.assignPath([{ x: 100, y: 200 }]);

    plane.updateMovement(0.2); // 0.2s of turn
    // Plane should have rotated towards PI/2 (> 0) but not fully snapped instantly to PI/2
    expect(plane.heading).toBeGreaterThan(0);
    expect(plane.heading).toBeLessThan(Math.PI / 2);
  });

  it('descends at a realistic shallow angle until reaching assigned altitude, then levels off', () => {
    const targetAltitude = 180;
    const plane = new Plane('DESCENT', 50, {
      x: 600,
      y: 55,
      targetAltitude: targetAltitude,
      heading: Math.PI * 0.9,
      speed: 50,
    });

    expect(plane.y).toBe(55);
    expect(plane.isLevelFlight).toBe(false);

    plane.updateMovement(1.0);
    expect(plane.y).toBeGreaterThan(55);
    expect(plane.y).toBeLessThanOrEqual(targetAltitude);

    plane.updateMovement(20.0);
    expect(plane.y).toBe(targetAltitude);
    expect(plane.isLevelFlight).toBe(true);
    expect(Math.sin(plane.heading)).toBeCloseTo(0, 2);
  });

  it('does not get stuck infinitely orbiting waypoints drawn within its turning radius', () => {
    // Plane heading east (0), waypoint placed at 90 degrees south, 20px away (previously stuck in infinite orbit)
    const plane = new Plane('ORBIT_PREVENT', 100, {
      x: 200,
      y: 200,
      heading: 0,
      speed: 45,
      turnSpeed: 3.0,
    });

    plane.assignPath([
      { x: 200 + 20 * Math.cos(1.2), y: 200 + 20 * Math.sin(1.2) },
      { x: 400, y: 400 },
    ]);

    let totalAngleTurned = 0;
    let prevHeading = plane.heading;
    for (let f = 0; f < 600; f++) {
      plane.updateMovement(0.016);
      let diff = plane.heading - prevHeading;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      totalAngleTurned += Math.abs(diff);
      prevHeading = plane.heading;
    }

    const revolutions = totalAngleTurned / (2 * Math.PI);
    // Should smoothly follow through and NOT continuously rotate on and on (revolutions < 1.5)
    expect(revolutions).toBeLessThan(1.5);
    expect(plane.path.length).toBe(0);
  });
});
