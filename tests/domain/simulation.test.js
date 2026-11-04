import { describe, it, expect } from 'vitest';
import { Simulation } from '../../src/domain/Simulation.js';

describe('Simulation Engine with 2D Flight & Path Landing', () => {
  it('spawns planes from top or right edges with inward heading', () => {
    const sim = new Simulation();
    const planeTop = sim.spawnPlane({ spawnEdge: 'TOP' });
    expect(planeTop.y).toBeLessThanOrEqual(20);
    expect(planeTop.heading).toBeGreaterThan(0); // Heading down

    const planeRight = sim.spawnPlane({ spawnEdge: 'RIGHT' });
    expect(planeRight.x).toBeGreaterThanOrEqual(780);
    expect(Math.cos(planeRight.heading)).toBeLessThan(0); // Moving left
  });

  it('detects mid-air proximity collision when planes fly within 26px', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    // Spawn two planes right next to each other
    sim.spawnPlane({ x: 300, y: 200, heading: 0 });
    sim.spawnPlane({ x: 315, y: 205, heading: Math.PI }); // Distance = 15.8px (< 26px)

    sim.update(0.1);
    expect(sim.getState().isGameOver).toBe(true);
    expect(sim.getState().gameOverReason).toContain('collision');
  });

  it('triggers landing when a plane path reaches the left landing entry zone', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    // Spawn plane above the left landing entry zone (0 <= x <= 130, y ~ 395)
    const plane = sim.spawnPlane({ x: 80, y: 350 });
    // User draws path entering runway gate
    plane.assignPath([
      { x: 80, y: 395 }, // Target runway gate
    ]);

    sim.update(1.2); // Plane moves down and reaches threshold
    expect(plane.state).toBe('LANDING');

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
