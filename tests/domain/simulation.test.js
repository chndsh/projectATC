import { describe, it, expect } from 'vitest';
import { Simulation } from '../../src/domain/Simulation.js';

describe('Simulation Engine with 2D Flight & Path Landing', () => {
  it('spawns planes strictly from the right side and below the HUD dashboard', () => {
    const sim = new Simulation();
    for (let i = 0; i < 15; i++) {
      const plane = sim.spawnPlane();
      // Must spawn from the right edge
      expect(plane.x).toBeGreaterThanOrEqual(780);
      // Must NEVER spawn in top HUD area (y < 60) or from top edge
      expect(plane.y).toBeGreaterThanOrEqual(80);
      expect(plane.y).toBeLessThanOrEqual(340);
      // Heading should be westbound (heading left: Math.PI)
      expect(Math.cos(plane.heading)).toBeLessThan(0);
    }
  });

  it('detects mid-air proximity collision when planes fly within 26px', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    // Spawn two planes right next to each other
    sim.spawnPlane({ x: 300, y: 200, heading: Math.PI });
    sim.spawnPlane({ x: 315, y: 205, heading: Math.PI }); // Distance = 15.8px (< 26px)

    sim.update(0.1);
    expect(sim.getState().isGameOver).toBe(true);
    expect(sim.getState().gameOverReason).toContain('collision');
  });

  it('triggers landing when a plane path reaches the left landing entry zone and stops fuel burn', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    // Spawn plane above the left landing entry zone (0 <= x <= 140, y ~ 395)
    const plane = sim.spawnPlane({ x: 80, y: 350, fuel: 50 });
    // User draws path entering runway gate
    plane.assignPath([
      { x: 80, y: 395 }, // Target runway gate
    ]);

    sim.update(1.2); // Plane moves down and touches down in landing zone
    expect(plane.state).toBe('LANDING');

    const fuelAtTouchdown = plane.fuel;
    // Advance simulation further during rollout
    sim.update(3.0);
    // Fuel counter must stop draining once touchdown occurs!
    expect(plane.fuel).toBe(fuelAtTouchdown);

    // Simulate rollout across runway
    sim.update(10.0);
    expect(sim.getState().landedCount).toBe(1);
    expect(sim.getState().score).toBeGreaterThan(15);
  });

  it('detects fuel burnout in flight causing game over', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    sim.spawnPlane({ fuel: 3 });

    sim.update(4.0);
    expect(sim.getState().isGameOver).toBe(true);
    expect(sim.getState().gameOverReason).toContain('fuel');
  });
});
