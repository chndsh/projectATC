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
    const plane = new Plane('PATH', 50, { x: 100, y: 100, speed: 50 });
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

  it('prunes obsolete initial waypoints when assigning path so plane does not backtrack', () => {
    // Plane is at (100, 100), but path drawing started half a second ago when plane was at (80, 100)
    const plane = new Plane('NO_BACKTRACK', 50, { x: 100, y: 100 });
    const pointsDrawnWhileMoving = [
      { x: 80, y: 100 },  // Old starting point, behind current position
      { x: 90, y: 100 },  // Still behind current position
      { x: 120, y: 100 }, // Ahead
      { x: 150, y: 100 }, // Further ahead
    ];

    plane.assignPath(pointsDrawnWhileMoving);
    // Initial waypoints behind or right next to plane should be culled
    expect(plane.path[0].x).toBe(120);
  });

  it('circles around in an orbit when unassigned', () => {
    const plane = new Plane('CIRCLE', 50, { x: 400, y: 200, heading: 0, speed: 50 });
    const initialHeading = plane.heading;
    // Update movement for 1 second without path
    plane.updateMovement(1.0);
    // Heading should smoothly turn (angular velocity) rather than moving in an endless straight bounce
    expect(plane.heading).not.toBe(initialHeading);
  });
});
