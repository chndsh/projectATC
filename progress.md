## Session Decisions & Task Log (2026-11-04 - Movement & Fuel Mechanics Refinement)

### Issues Addressed & Root Causes:
1. **Fuel Counter Burning During Runway Rollout**:
   - *Root cause*: Simulation was draining fuel for all planes where `state !== LANDED`. Since planes were in `LANDING` state while rolling across the runway, fuel kept depleting until exit.
   - *Fix*: Made fuel depletion conditional strictly on `state !== LANDING && state !== LANDED`. As soon as the wheels touch down in the landing threshold, fuel consumption completely freezes.

2. **Unassigned Planes Circling Behavior**:
   - *Root cause*: Unassigned planes previously flew straight until hitting screen edges and reflecting via a sharp bounce.
   - *Fix*: Added an angular turn rate (`turnRate = 0.45 rad/sec`) in `Plane.js` so unassigned planes continuously orbit smoothly in airspace holding patterns.

3. **Path Drawing Backtracking Glitch**:
   - *Root cause*: When the user starts clicking and dragging from a moving plane, the aircraft continues advancing during the drawing motion. By the time pointer release occurred, the initial waypoints recorded at the beginning of the stroke were behind the aircraft's current position, forcing the plane to turn around and backtrack to the obsolete starting point.
   - *Fix*: In `Plane.assignPath()`, we added vector-relative filtering that automatically culls starting points that the aircraft has already passed (negative dot product along heading) or that are within immediate proximity, seamlessly attaching the plane's live coordinates to the forward path.

### Verification:
- All unit tests passing: 10/10 in Vitest (`tests/domain/plane.test.js`, `tests/domain/simulation.test.js`).
- Production static bundle builds cleanly without errors (`dist/`).
