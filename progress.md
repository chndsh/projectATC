# SDD ledger — plan: docs/superpowers/plans/2026-11-04-atc-web-game.md
Pre-flight: Interfaces checked, pure domain classes cleanly decoupled from Phaser renderer.

---

## Session Decisions & Task Log (2026-11-04 - Uncapped Airspace & Aerodynamic Rotation)

### Issues Addressed & Root Causes:
1. **10-Plane Overcrowding Game Over Removed**:
   - *Root cause*: `maxPlanes = 10` cap from the original CLI was triggering an immediate game over when more than 10 aircraft accumulated.
   - *Fix*: Removed the active aircraft ceiling (`maxPlanes: Infinity`). Any number of aircraft can now fly simultaneously. The HUD has been updated to display the live count as `ACTIVE: N`.

2. **Inverted Aircraft Rendering Glitch**:
   - *Root cause*: The plane pixel sprite was drawn facing right (heading = 0). When spawning and flying leftwards (heading near `Math.PI`), standard 2D rotation rotated the sprite 180°, which caused the landing gear to face upward and the cabin/tail to be completely upside-down.
   - *Fix*: In `PlaneSprite.updateVisuals()`, added directional vertical axis flipping (`setFlipY(true)` when flying leftward `cos(heading) < 0`). Planes now remain properly upright and visually correct regardless of which direction they fly.

3. **Realistic Aerodynamic Turn & Rotation (Smooth Banking)**:
   - *Root cause*: Aircraft previously snapped heading instantly to point at waypoints or altitude levels.
   - *Fix*: Integrated a realistic angular turn speed limit (`turnSpeed = 3.0 rad/sec`) in `Plane.js`. Aircraft now smoothly turn and bank along realistic turning radiuses both when leveling off at designated altitudes and when tracking drawn waypoints.

### Verification:
- All unit tests passing: 11/11 in Vitest (`tests/domain/plane.test.js`, `tests/domain/simulation.test.js`).
- Static production build verified (`npm run build`).

---

## Session Progress & Changelog (Mobile Responsiveness, Stardew Valley Theme & Ingress Updates)

### 1. Fluid Mobile-First Responsive Layout
- **Dynamic Viewport Scaling**:
  - Removed fixed `800×450px` container constraint.
  - Converted Phaser game configuration from fixed `Phaser.Scale.FIT` to dynamic `Phaser.Scale.RESIZE`.
  - Added `100dvh` viewport height support with `viewport-fit=cover` for mobile devices and notches.
  - Added `touch-action: none` on `#game-container` to prevent pull-to-refresh and unwanted gestures during touch-flight-path drawing.
- **Dynamic Scene Coordinates**:
  - Refactored `GameScene.js`, `HUD.js`, `GameOverScene.js`, and `Simulation.js` to compute runway, landing gate, altitude corridors, background sprites, and UI positions from `this.scale.width` and `this.scale.height`.
  - Added a live `resize` event listener that adjusts simulation boundaries and UI layout in real-time when resizing windows or changing device orientation.

### 2. Proportional Aircraft Scaling & Touch Optimization
- **Dynamic Scale Factor**:
  - Updated `PlaneSprite.js` with `_scaleFactor = clamp(W / 800, 0.75, 2.5)`.
  - Aircraft sprite textures, callsign typography, fuel bar dimensions, and selection rings scale proportionally with the screen size.
  - Enforced a minimum touch hit area (44×44px) so aircraft are easily selectable and draggable on small phone touchscreens.
  - Dynamic `_handleResize` hook invokes `adjustScale()` on all active aircraft instances on window resize.

### 3. Responsive Opening & Settings Screens
- Refactored `.landing-card`, `.settings-card`, `.game-navbar`, and buttons in `index.html` with CSS `clamp(...)` rules to ensure proper centering and responsive scaling across mobile (360px–430px), tablet, laptop, and desktop displays.

### 4. Stardew Valley Aesthetic Redesign
- **Typography**:
  - Integrated Google Font `'Press Start 2P'` (retro pixel font) for game titles, badges, buttons, HUD stats, and modal cards.
- **Color Palette & Theme**:
  - **Backgrounds**: Dark wood and parchment gradient palette (`#1a0e05`, `#2d1a0a`, `#3d2b1f`, `#2a1c10`).
  - **Borders & Accents**: Old gold and brass trim (`#e8c56a`, `#8b6914`, `#5c4010`).
  - **Buttons**: Stardew forest green primary buttons (`#4a7c59` with `#7ec892` border) and rich wood secondary buttons (`#5c3d1e`).
  - **Text**: Warm cream (`#f5e6c8`) and harvest tan (`#b8945a`).
  - **Game Canvas Elements**: Updated runway borders to lush grass (`#4a7c59`), threshold guide arrows to gold (`#e8c56a`), landing gate marker to gold, and game-over dialog to a parchment/wood modal card.

### 5. Multi-Directional Aircraft Ingress & Graceful Spawning
- **Spawning Origins**:
  - **Top (`TOP_ANGULAR`)**: Spawns safely below the HUD bar (`y = 62..75`), spanning the full width of the screen (10% to 90%), angling shallow descent vectors (~16–20° pitch) inward toward the center.
  - **Left Edge (`LEFT_EDGE`)**: Spawns from the left edge (`x = 15`) at cruising corridors safely above the landing gate, heading Eastbound (`heading = 0`).
  - **Right Edge (`RIGHT_EDGE`)**: Spawns from the right edge (`x = width - 15`) at cruising corridors, heading Westbound (`heading = π`).
- **Graceful Fade-In**:
  - Added an opacity transition (`alpha: 0 → 1` over 800ms) on `PlaneSprite.js` so aircraft materialize onto radar displays smoothly rather than popping in abruptly.
- **Bi-Directional Circulation**:
  - Westbound cruising aircraft that fly off the left edge wrap to the right edge at a fresh corridor altitude.
  - Eastbound cruising aircraft that fly off the right edge wrap to the left edge at a fresh corridor altitude.

### 6. HUD Boundary Protection & Layering
- **Boundary Clamping**:
  - In `GameScene.js`, flight path drawing points are strictly bounded to `MIN_FLIGHT_Y = 46`. Dragging or drawing upward into the top HUD area clamps path points below the HUD bar, preventing flight paths from ever being drawn under or into the dashboard.
- **Z-Order Layering**:
  - Explicitly assigned z-depth layers across game objects:
    - Background: `depth: 0 / 1`
    - Runway & Gate: `depth: 3 / 4`
    - Flight Path Graphics: `depth: 10`
    - Aircraft Sprites: `depth: 20`
    - HUD Background & Text: `depth: 100 / 101`

### 7. Curved Flight Path Preservation & Runway Crash Enforcement
- **Curved Path Integrity & Stale Waypoint Dropping**:
  - In `Plane.js` (`assignPath`), implemented smart initiation point cleanup:
    - If the user did not deliberately draw a significant reverse path behind the aircraft (`maxBehind <= 40px`), waypoints near the drag origin that the plane already flew past while drawing (`dist <= 35px` and `proj <= 5px`) are cleanly dropped. This prevents the plane from U-turning back to the stroke origin when drawing paths ahead or curving away.
    - If the user purposefully drew a significant path behind the aircraft (`maxBehind > 40px`), the reverse trajectory is fully preserved so the aircraft honors intentional turns and loops.
  - Removed artificial start point insertion in `GameScene.js` that was injecting duplicate backward points into the gesture.
  - Waypoints along curves are preserved in full and consumed one-by-one as the aircraft actually reaches each point (`dist <= Math.max(step, 8) || (dist <= 12 && forwardProj < 0)`), preventing curves from prematurely collapsing into single straight segments.
  - Added interpolation in `GameScene.js` for rapid pointer moves (`dist > 20px`) to prevent jagged straight jumps on swift mobile touch drags.
  - Increased base turning responsiveness (`turnSpeed: 5.0`) so aircraft accurately track tight curves without wide drift or spinning.
  - Upright flight orientation preserved (`flipY` applied when heading westward so aircraft is never upside down).
- **Runway Touchdown Crash Rule**:
  - In `Simulation.js`, enforced strict runway landing threshold rules:
    - Aircraft touching the runway surface (`y >= runwayY - 15`) outside the designated safe landing entry gate (`x > 140`) trigger an immediate **Plane Crash** and game over.
    - Only aircraft touching down inside the left entry gate (`minX: 0, maxX: 140, minY: H - 90, maxY: H - 20`) initiate safe runway rollout.

### 8. Verification & Tests
- `npm test`: All 24 unit tests pass (`plane.test.js`, `simulation.test.js`, `customization.test.js`).
- `npm run build`: Production Vite build completes with zero errors.
