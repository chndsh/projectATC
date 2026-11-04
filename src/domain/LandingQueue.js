export class LandingQueue {
  constructor() {
    this.planes = []; // In-order from leader (furthest along) to newest entrant
    this.landedPlanes = [];
  }

  enqueue(plane) {
    plane.startApproach();
    this.planes.push(plane);
  }

  remove(planeId) {
    const index = this.planes.findIndex(p => p.id === planeId);
    if (index !== -1) {
      const [removed] = this.planes.splice(index, 1);
      return removed;
    }
    return null;
  }

  size() {
    return this.planes.length;
  }

  getPlanes() {
    return [...this.planes];
  }

  getLandedPlanes() {
    const landed = [...this.landedPlanes];
    this.landedPlanes = [];
    return landed;
  }

  update(dt) {
    let collision = { hasCollision: false, planes: [] };

    // Advance each plane along the glide path
    for (const plane of this.planes) {
      plane.advanceLanding(plane.speed * dt);
    }

    // Check catch-up collisions:
    // If any plane i (behind) reaches or exceeds the progress of plane i-1 (ahead)
    // with a tight safety buffer (0.02 progress margin)
    for (let i = 1; i < this.planes.length; i++) {
      const leader = this.planes[i - 1];
      const follower = this.planes[i];
      if (follower.landingProgress >= leader.landingProgress - 0.02) {
        collision = {
          hasCollision: true,
          planes: [leader, follower],
          reason: 'Mid-air / Approach collision: trailing plane overtook leading aircraft',
        };
        return collision;
      }
    }

    // Check touchdown of the front plane
    if (this.planes.length > 0 && this.planes[0].landingProgress >= 1.0) {
      const landed = this.planes.shift();
      landed.touchdown();
      this.landedPlanes.push(landed);
    }

    return collision;
  }

  clear() {
    this.planes = [];
    this.landedPlanes = [];
  }
}
