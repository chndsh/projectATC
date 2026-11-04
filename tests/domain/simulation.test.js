import { describe, it, expect } from 'vitest';
import { Simulation } from '../../src/domain/Simulation.js';

describe('Simulation Engine with Graceful Ingress & Airspace Circulation', () => {
  it('spawns planes safely below the HUD dashboard (y >= 52)', () => {
    const sim = new Simulation();
    for (let i = 0; i < 20; i++) {
      const plane = sim.spawnPlane();
      expect(plane.y).toBeGreaterThanOrEqual(52);
      expect(plane.y).toBeLessThan(350);
      expect(Math.sin(plane.heading)).toBeGreaterThanOrEqual(0);
      expect(Math.sin(plane.heading)).toBeLessThanOrEqual(0.45);
    }
  });

  it('allows active planes count to exceed 10 without overcrowding game over', () => {
    const sim = new Simulation({ baseSpawnInterval: 0.1 });
    // Spawn 14 planes
    for (let i = 0; i < 14; i++) {
      sim.spawnPlane({ x: 50 * i + 50, y: 100 + (i % 4) * 40 });
    }
    expect(sim.getState().activePlanesCount).toBe(14);
    expect(sim.getState().isGameOver).toBe(false);
  });

  it('cycles planes around screen edges cleanly without getting stuck', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    const plane = sim.spawnPlane({
      x: 20,
      y: 180,
      targetAltitude: 180,
      heading: Math.PI,
    });

    sim.update(1.0);
    expect(plane.x).toBeGreaterThan(700);
    expect(plane.y).toBeGreaterThanOrEqual(80);
  });

  it('detects mid-air proximity collision when planes fly within 26px', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    sim.spawnPlane({ x: 300, y: 200, heading: Math.PI });
    sim.spawnPlane({ x: 315, y: 205, heading: Math.PI });

    sim.update(0.1);
    expect(sim.getState().isGameOver).toBe(true);
    expect(sim.getState().gameOverReason).toContain('collision');
  });

  it('triggers landing when a plane path reaches the left landing entry zone and stops fuel burn', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    const plane = sim.spawnPlane({ x: 80, y: 350, fuel: 50 });
    plane.assignPath([
      { x: 80, y: 395 },
    ]);

    sim.update(1.2);
    expect(plane.state).toBe('LANDING');

    const fuelAtTouchdown = plane.fuel;
    sim.update(3.0);
    expect(plane.fuel).toBe(fuelAtTouchdown);

    sim.update(10.0);
    expect(sim.getState().landedCount).toBe(1);
    expect(sim.getState().score).toBeGreaterThan(15);
  });
});
