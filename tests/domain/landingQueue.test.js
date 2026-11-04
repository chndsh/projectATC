import { describe, it, expect } from 'vitest';
import { LandingQueue } from '../../src/domain/LandingQueue.js';
import { Plane } from '../../src/domain/Plane.js';

describe('LandingQueue Domain Model', () => {
  it('enqueues planes and advances their landing progress', () => {
    const queue = new LandingQueue();
    const plane1 = new Plane('P1', 50, { landingDuration: 10 });
    const plane2 = new Plane('P2', 50, { landingDuration: 10 });

    queue.enqueue(plane1);
    queue.enqueue(plane2);

    expect(queue.size()).toBe(2);
    expect(plane1.state).toBe('APPROACHING');
    expect(plane2.state).toBe('APPROACHING');

    queue.update(1.0); // 1 second elapsed
    expect(plane1.landingProgress).toBeCloseTo(0.1, 2);
    expect(plane2.landingProgress).toBeCloseTo(0.1, 2);
  });

  it('detects touchdown when the front plane reaches progress >= 1.0', () => {
    const queue = new LandingQueue();
    const plane1 = new Plane('P1', 50, { landingDuration: 2 });
    queue.enqueue(plane1);

    queue.update(1.0);
    expect(queue.getLandedPlanes().length).toBe(0);

    queue.update(1.1); // reaches >= 1.0
    const landed = queue.getLandedPlanes();
    expect(landed.length).toBe(1);
    expect(landed[0].callSign).toBe('P1');
    expect(queue.size()).toBe(0);
  });

  it('detects catch-up collision when a trailing plane overtakes the leader', () => {
    const queue = new LandingQueue();
    // Leader is slow (landingDuration = 10s -> speed 0.1/s)
    const leader = new Plane('SLOW', 50, { landingDuration: 10 });
    // Trailer is fast (landingDuration = 2s -> speed 0.5/s)
    const trailer = new Plane('FAST', 50, { landingDuration: 2 });

    queue.enqueue(leader);
    queue.update(1.0); // leader at 0.1

    queue.enqueue(trailer); // trailer at 0.0, leader at 0.1
    // Update by 1.0s: leader -> 0.2, trailer -> 0.5 (trailer overtook leader!)
    const collision = queue.update(1.0);

    expect(collision.hasCollision).toBe(true);
    expect(collision.planes.map(p => p.callSign)).toEqual(['SLOW', 'FAST']);
  });

  it('allows removing a plane for Go-Around / abort', () => {
    const queue = new LandingQueue();
    const plane = new Plane('ABORT', 50, { landingDuration: 5 });
    queue.enqueue(plane);
    expect(queue.size()).toBe(1);

    const removed = queue.remove(plane.id);
    expect(removed).toBe(plane);
    expect(queue.size()).toBe(0);
  });
});
