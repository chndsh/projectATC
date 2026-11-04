import { describe, it, expect } from 'vitest';
import { Simulation } from '../../src/domain/Simulation.js';

describe('Simulation Engine', () => {
  it('initializes with default state and friendly initial spawn rate', () => {
    const sim = new Simulation();
    const state = sim.getState();
    expect(state.score).toBe(0);
    expect(state.combo).toBe(1);
    expect(state.isGameOver).toBe(false);
    expect(state.activePlanesCount).toBe(0);
  });

  it('spawns planes periodically up to the max cap of 10', () => {
    const sim = new Simulation({ baseSpawnInterval: 1.0 }); // faster for test
    sim.update(1.1); // should trigger 1 spawn
    expect(sim.getState().activePlanesCount).toBe(1);

    sim.update(1.1); // spawn 2nd
    expect(sim.getState().activePlanesCount).toBe(2);
  });

  it('triggers game over when total active planes exceed 10 (overcrowding)', () => {
    const sim = new Simulation({ baseSpawnInterval: 0.1, maxPlanes: 3 }); // low threshold for test
    for (let i = 0; i < 4; i++) {
      sim.update(0.15);
    }
    expect(sim.getState().isGameOver).toBe(true);
    expect(sim.getState().gameOverReason).toContain('Overcrowding');
  });

  it('triggers game over if fuel drops to 0 while circling or descending', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 }); // disable auto-spawn
    const plane = sim.spawnPlane({ fuel: 2 });
    expect(sim.getState().activePlanesCount).toBe(1);

    sim.update(3.0); // burns > 2 fuel
    expect(sim.getState().isGameOver).toBe(true);
    expect(sim.getState().gameOverReason).toContain('fuel');
  });

  it('allows requesting landing, calculates landing score and increments combo', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    const plane = sim.spawnPlane({ fuel: 50, landingDuration: 1.0 });

    const success = sim.requestLanding(plane.id);
    expect(success).toBe(true);
    expect(sim.getLandingQueue().size()).toBe(1);

    // After 1.1s, plane should touchdown
    sim.update(1.1);
    const state = sim.getState();
    expect(state.activePlanesCount).toBe(0);
    expect(state.landedCount).toBe(1);
    expect(state.score).toBeGreaterThan(10);
    expect(state.combo).toBe(2);
  });

  it('supports Go-Around abort command from landing queue', () => {
    const sim = new Simulation({ baseSpawnInterval: 100 });
    const plane = sim.spawnPlane({ fuel: 50, landingDuration: 5.0 });
    sim.requestLanding(plane.id);

    const aborted = sim.abortLanding(plane.id);
    expect(aborted).toBe(true);
    expect(sim.getLandingQueue().size()).toBe(0);
    expect(sim.getAirspace().length).toBe(1);
    expect(plane.state).toBe('CIRCLING');
  });
});
