## Session Decisions & Task Log (2026-11-04 - Ingress Descent & Altitude Circulation)

### Decisions & Changes Made:
1. **Realistic Shallow Angular Ingress (Below HUD Dashboard)**:
   - Planes spawn from just below the top dashboard (`y = 52`, well clear of the `y: 0 to 45` HUD).
   - Rather than dropping straight down, aircraft enter at a graceful, shallow flight angle (~15–20° descent pitch, `heading ≈ 0.90π`).
   - The aircraft descends smoothly along this glide slope until it reaches its designated target flight level (`targetAltitude`), at which point it levels off into purely horizontal cruising flight.

2. **Continuous Airspace Circulation (Screen Edge Wrap to New Altitudes)**:
   - When an unassigned plane flying left reaches the edge of the airspace (`x < -10`), instead of stopping or bouncing back, it cleanly exits and loops back in from the right edge (`x = 790`).
   - Upon re-entering, it dynamically chooses an open/unoccupied altitude corridor (`altitudeCorridors: [100, 150, 200, 250, 300]`) to ensure it doesn't collide with or block incoming new arrivals.

3. **Drawing & Landing Integrity Preserved**:
   - Touchdown in the left runway gate (`x: 0 to 140, y: 360 to 430`) freezes fuel depletion immediately and triggers full rollout.
   - Non-backtracking path assignment connects the plane's live coordinates forward without 180° flips.

### Verification:
- All unit tests passing: 10/10 in Vitest (`tests/domain/plane.test.js`, `tests/domain/simulation.test.js`).
- Static production build verified (`npm run build`).
