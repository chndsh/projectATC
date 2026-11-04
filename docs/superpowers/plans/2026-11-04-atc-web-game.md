# ATC Path Drawing & Full Runway Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the ATC web game into an interactive flight path-drawing game with an end-to-end ground runway, dynamic re-routing, 2D proximity collisions, top/right spawning, and left-gate landing detection.

**Architecture:** Update `Plane.js` and `Simulation.js` to support 2D vectors, waypoint path following, and proximity collision checks. Overhaul `GameScene.js` to draw the 800px full-width runway with the designated left entry zone, implement mouse/touch path drawing & re-drawing with real-time waypoint rendering, and animate realistic touchdown rollouts.

**Tech Stack:** Phaser 3, Vite, Vitest, Canvas 2D, Web Audio API.

**Spec:** `docs/superpowers/specs/2026-11-04-atc-web-game-design.md`

## Global Constraints
- Runway spans end-to-end at bottom: x: 0 to 800, y: 390 to 445.
- Designated Landing Zone: far left entry gate at x: 0 to 130, y: 380 to 430.
- Planes spawn from top (y: 10) or right edge (x: 790).
- Left click/drag on plane draws a custom path. Re-dragging overwrites/re-routes existing path.
- 2D proximity collision radius: planes within 26px of each other trigger mid-air collision Game Over.
- Continuous fuel drain: 0% fuel = flameout explosion & Game Over.

---

### Task 1: Update Domain Models for 2D Flight, Path Navigation & Collisions

**Files:**
- Modify: `src/domain/Plane.js`
- Modify: `src/domain/Simulation.js`
- Modify: `tests/domain/plane.test.js`
- Modify: `tests/domain/simulation.test.js`

- [ ] **Step 1: Update `tests/domain/plane.test.js` with failing tests for 2D waypoint following and path assignment**
- [ ] **Step 2: Update `Plane.js` to support 2D position (`x, y`), heading angle, waypoint array, and path advancement**
- [ ] **Step 3: Update `tests/domain/simulation.test.js` with failing tests for top/right spawning, 2D proximity collision, and left runway threshold landing**
- [ ] **Step 4: Update `Simulation.js` with 2D bounds, plane-to-plane distance collisions, and landing zone detection**
- [ ] **Step 5: Run tests and commit Task 1**

---

### Task 2: Update Assets & Runway Visuals

**Files:**
- Modify: `src/gfx/AssetGenerator.js`
- Modify: `src/scenes/GameScene.js`

- [ ] **Step 1: Update `AssetGenerator.js` to generate an 800px full-width runway texture with yellow threshold markings on the far left gate**
- [ ] **Step 2: Update `GameScene.js` to position the full-width runway at the bottom and highlight the designated landing entry zone**
- [ ] **Step 3: Commit Task 2**

---

### Task 3: Interactive Path Drawing, Re-Routing & Waypoint Rendering

**Files:**
- Modify: `src/scenes/GameScene.js`
- Modify: `src/ui/PlaneSprite.js`

- [ ] **Step 1: Update `PlaneSprite.js` to support pointer selection for path drawing**
- [ ] **Step 2: Implement pointer drag tracking in `GameScene.js` that records waypoints in real-time as the player drags from an aircraft**
- [ ] **Step 3: Render dotted/glowing colored path trajectories on screen, updating dynamically as the plane consumes waypoints**
- [ ] **Step 4: Support re-selecting any plane at any time to instantly redraw and reprioritize its path**
- [ ] **Step 5: Animate touchdown rollouts along the runway towards the right edge when a plane lands at the left gate**
- [ ] **Step 6: Commit Task 3 and verify full test suite + production build**
