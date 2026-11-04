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
