## Session Decisions & Task Log (2026-11-04 - Ingress & Altitude Holding Refinement)

### Issues Addressed & Root Causes:
1. **Planes Appearing from Top or on Top of HUD Dashboard**:
   - *Root cause*: `Simulation.spawnPlane()` was randomly picking between `'TOP'` and `'RIGHT'` edge spawning. Top spawning was placing aircraft at `y = 15`, right on top of the top HUD bar (which is 40px tall: `y = 0 to 45`).
   - *Fix*: Removed top spawning entirely. All aircraft now spawn strictly from the **Right Edge** (`x >= 785`) and enter along clear corridors well below the HUD (`y` between 90 and 330), heading westward into airspace.

2. **Unassigned Planes Trajectory Behavior**:
   - *Root cause*: Previous fix added a circular turn rate that caused planes to loop in circles.
   - *Fix*: Replaced circular trajectory with **constant assigned altitude holding**. When a plane has no path assigned, it maintains its fixed altitude flight level (`y = altitude`), cruising horizontally back and forth across its assigned corridor until guided by the player.

3. **Fuel Freeze & Backtracking Validation**:
   - Preserved instant fuel freeze on runway gate contact.
   - Tested and verified backtrack culling and path assignment.

### Verification:
- All unit tests passing: 10/10 in Vitest (`tests/domain/plane.test.js`, `tests/domain/simulation.test.js`).
- Production bundle compiled with `npm run build` into `dist/`.
