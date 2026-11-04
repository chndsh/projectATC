# ATC Web Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete, fun pixel-art side-view Air Traffic Controller web game powered by Phaser 3 and Vite, faithfully translating `game.cpp` mechanics (fuel drain, catch-up collisions, overcrowding, progressive pacing) into an interactive drag-to-land experience.

**Architecture:** A lightweight Vite + Vanilla JS project running Phaser 3. Core domain logic (`Plane`, `AirspaceManager`, `LandingQueue`, `Simulation`) is decoupled and unit-tested with Vitest to guarantee simulation accuracy. Phaser scenes (`BootScene`, `GameScene`, `GameOverScene`) handle pixel-art rendering, drag-and-drop input, UI overlays, audio/visual cues, and particle bursts.

**Tech Stack:** Phaser 3, Vite, JavaScript (ES Modules), Vitest (TDD logic verification).

**Spec:** `docs/superpowers/specs/2026-11-04-atc-web-game-design.md`

## Global Constraints

- Resolution: 800×450 virtual canvas with crisp pixel art mode (`pixelArt: true`).
- Single landing approach queue (Option A from spec): trailing planes catch up if front plane doesn't clear.
- Continuous fuel drain until wheels touch down.
- Active plane limit: 10 planes max (airspace + approach). Overcrowding = Game Over.
- Aborted landing (Go-around): right-click an approaching plane returns it to airspace loop.
- Score formula: `(10 + remaining_fuel) * comboMultiplier`.
- Standalone static build output (`dist/`) suitable for web deployment.

## Review Focus

1. **Catch-up collision check**: A faster trailing plane on approach overtaking a leading plane triggers Game Over immediately.
2. **Fuel burnout on final approach**: Plane reaching 0% fuel during descent triggers explosion and Game Over before touchdown.
3. **Overcrowding barrier**: Attempting to generate or hold an 11th plane triggers immediate Overcrowding Game Over.
4. **Go-around state transition**: Right-clicking descending plane resets its state to circling in airspace, preserves its current fuel level, and frees the glide path.
5. **Touchdown and cleanup**: Landing plane rolls out, triggers score popup, increments combo, and decrements active plane count cleanly without memory leaks.

---

### Task 1: Project Scaffolding & Core Domain Models (`Plane`, `LandingQueue`)

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `src/domain/Plane.js`
- Create: `src/domain/LandingQueue.js`
- Test: `tests/domain/plane.test.js`
- Test: `tests/domain/landingQueue.test.js`

**Interfaces:**
- Produces: `Plane`: `{ id, callSign, fuel, maxFuel, altitude, state, landingDuration, progress }`
- Produces: `LandingQueue`: methods `enqueue(plane)`, `remove(planeId)`, `update(dt)`, `checkCollision()`, `getActivePlanes()`

- [ ] **Step 1: Setup `package.json` with dependencies (Phaser 3, Vite, Vitest) and vitest config**
- [ ] **Step 2: Write failing unit test for `Plane` initialization, fuel drain, and state transitions**
- [ ] **Step 3: Implement `Plane.js` and verify tests pass**
- [ ] **Step 4: Write failing unit test for `LandingQueue` (FIFO ordering, progress advancement, catch-up collision detection)**
- [ ] **Step 5: Implement `LandingQueue.js` and verify tests pass**
- [ ] **Step 6: Commit Task 1**

---

### Task 2: Simulation Loop & Airspace Manager (`Simulation`)

**Files:**
- Create: `src/domain/AirspaceManager.js`
- Create: `src/domain/Simulation.js`
- Test: `tests/domain/simulation.test.js`

**Interfaces:**
- Consumes: `Plane`, `LandingQueue`
- Produces: `Simulation`: methods `update(dt)`, `requestLanding(planeId)`, `abortLanding(planeId)`, `getState()`, callbacks `onGameOver(reason)`, `onPlaneLanded(scoreDelta, combo)`

- [ ] **Step 1: Write failing tests for `AirspaceManager` (spawning intervals, max 10 plane cap, circular cruising altitudes)**
- [ ] **Step 2: Implement `AirspaceManager.js`**
- [ ] **Step 3: Write failing tests for `Simulation` covering:**
  - Fuel depletion game over (in air & during landing)
  - Overcrowding game over (total active > 10)
  - Progressive spawn intervals (base 7s ramping down)
  - Combo streak tracking and reset on delayed/wasted intervals
- [ ] **Step 4: Implement `Simulation.js` to pass all tests**
- [ ] **Step 5: Commit Task 2**

---

### Task 3: Pixel Art Asset Generator & BootScene

**Files:**
- Create: `src/gfx/AssetGenerator.js` (generates crisp procedural pixel textures for airplane, runway, clouds, smoke particles, alert icons so no external assets are required)
- Create: `src/scenes/BootScene.js`
- Create: `index.html`
- Create: `src/main.js`

**Interfaces:**
- Produces: Textures `plane-cruising`, `plane-landing`, `runway`, `cloud`, `explosion-particle`, `smoke-particle` generated into Phaser's TextureManager.

- [ ] **Step 1: Implement `AssetGenerator.js` using HTML Canvas 2D to draw retro 32px pixel art airplane sprites, runway stripes, and particle sparks**
- [ ] **Step 2: Create `BootScene.js` to register procedural assets and transition to `GameScene`**
- [ ] **Step 3: Setup `index.html` and `main.js` with Phaser 3 Game config (800x450, pixelArt: true, autoCenter)**
- [ ] **Step 4: Verify Vite dev server boots and renders clean pixel assets**
- [ ] **Step 5: Commit Task 3**

---

### Task 4: Interactive Gameplay Scene (`GameScene`)

**Files:**
- Create: `src/scenes/GameScene.js`
- Create: `src/ui/PlaneSprite.js`
- Create: `src/ui/HUD.js`

**Interfaces:**
- Consumes: `Simulation`, `AssetGenerator`
- Produces: Interactive drag-and-drop gameplay, runway approach rendering, fuel bars with color pulses, HUD counters.

- [ ] **Step 1: Implement `PlaneSprite.js` inheriting from `Phaser.GameObjects.Container`:**
  - Renders pixel airplane + callsign text + dynamic fuel bar (Green/Yellow/Red pulse)
  - Supports interactive drag events (`dragstart`, `drag`, `dragend`)
  - Supports pointerdown right-click for Go-around abort
- [ ] **Step 2: Implement `HUD.js`:**
  - Displays Score, Elapsed Time, Active Count (`N / 10`), Combo multiplier (`x1`, `x2`, etc.)
- [ ] **Step 3: Implement `GameScene.js`:**
  - Connects `Simulation` tick to Phaser's `update(time, delta)`
  - Renders the glide slope guide line and runway landing strip
  - Handles drag-to-glide-path drop zone detection
  - Handles visual animations: plane rolling down runway, smoke puffs, and touchdown score floats
- [ ] **Step 4: Commit Task 4**

---

### Task 5: Game Over Screen, Polish & Audio Feedback

**Files:**
- Create: `src/scenes/GameOverScene.js`
- Create: `src/audio/SoundEffects.js` (synthesized Web Audio tones for landing chime, low-fuel alarm, explosion crash)
- Modify: `src/scenes/GameScene.js`

**Interfaces:**
- Produces: `GameOverScene` showing cause of failure (Mid-air collision, Fuel exhaustion, Overcrowding), final stats, restart button.

- [ ] **Step 1: Implement `SoundEffects.js` using browser Web Audio API oscillator beeps/chimes (zero audio file dependencies)**
- [ ] **Step 2: Implement `GameOverScene.js` with replay button and stats summary**
- [ ] **Step 3: Wire game over transitions in `GameScene` with camera shake and explosion particle bursts**
- [ ] **Step 4: Run comprehensive test suite and verify build (`npm run build`) generates static artifacts**
- [ ] **Step 5: Commit Task 5**
