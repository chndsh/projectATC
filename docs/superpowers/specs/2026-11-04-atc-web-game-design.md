# ATC Web Game — Path Drawing & End-to-End Runway Design Spec

**Date:** 2026-11-04  
**Branch:** web-game  
**Stack:** Phaser 3, Vanilla JS / Vite, Canvas / Web Audio  

---

## 1. Intent & Overview

Pivot the game mechanics from slot-dragging to dynamic **flight path drawing** (Flight Control style) with a full end-to-end ground runway, maximizing real-time tactical control, close-call tension, and replayability.

---

## 2. Core Game Rules & Layout

### 2.1 Runway & Entry Threshold
- **Runway**: Spans **end-to-end horizontally across the bottom** of the screen (e.g. y: 390 to 440, x: 0 to 800).
- **Landing Entry Threshold**: A dedicated runway entry gate located on the **far left** (x: 0 to 120, y: 390 to 420).
- **Touchdown Rollout**: When a plane reaches the end of its path inside the landing gate, it transitions to `LANDING` state, snaps to runway altitude, points horizontally east (facing right), rolls down the runway to the right edge, awards score, and exits.

### 2.2 Plane Spawning & Cruising
- **Spawn Locations**:
  - **Top Edge**: Entering at a downward angle (`y = 10, x = random(100, 700)` heading south/southwest).
  - **Right Edge**: Entering at a westward angle (`x = 790, y = random(50, 300)` heading west/southwest).
- **Default Cruising**: Until a player draws a path, the plane flies smoothly along its entry vector, bouncing or softly turning if it nears airspace boundaries.

### 2.3 Interactive Path Drawing & Re-routing
- **Click & Drag from Plane**: Clicking and dragging from a plane begins recording waypoints `[{x, y}, ...]` behind the pointer.
- **Visual Path Line**: Renders as a crisp glowing/dotted pixel flight corridor matching the plane's color.
- **Flight Execution**: The plane follows waypoints sequentially, rotating smoothly toward each next node.
- **Full Re-routing**: At any moment (whether cruising or already following a path), the player can click the plane again and draw a brand new path, immediately replacing the old one. This is critical for emergency avoidance maneuvers and reprioritizing dying planes.

### 2.4 Danger, Fuel, and Collisions
- **Continuous Fuel Burn**: Fuel ticks down constantly (1%/sec + score scaling). Flashing red + alarm below 20%.
- **Mid-Air Collision**: If any two planes come within collision radius (~26px) while in the air → **Explosion + Game Over**.
- **Runway Separation**: Once a plane is rolling out on the runway, another plane landing immediately on top of it before it rolls out causes a runway collision.
- **Total Cap**: 10 active planes. Overcrowding = Game Over.

---

## 3. Scoring & Combos
- **Score**: `(15 + remaining_fuel) * comboMultiplier`.
- **Combo**: Consecutive safe landings increment combo (`x1`, `x2`, `x3` ... max `x5`).
- **Close-call Bonus**: Landing with fuel < 15% gives a "CLOSE CALL!" score multiplier bonus.

---

## 4. Technical Architecture Updates
- `Plane.js`:
  - `path`: Array of points `[{x, y}, ...]`.
  - `heading`: Angle (radians) for sprite rotation.
  - `speed`: Pixel travel speed per second.
  - `assignPath(points)`: Sets custom waypoint list.
  - `clearPath()`: Clears path.
- `Simulation.js`:
  - Handles 2D movement update along path or default cruising vector.
  - 2D distance-based collision check between all active planes (`dist < 26`).
  - Landing zone boundary hit testing.
- `GameScene.js`:
  - Pointer down on plane → activates path recording.
  - Pointer move → appends points if distance from last point > 12px.
  - Pointer up → finalizes path and assigns to plane.
  - Graphics layer renders all active plane paths in real-time.
  - Runway bottom full width, with visual landing threshold marker on left.
