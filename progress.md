## Session Decisions & Task Log (2026-11-04 - Flight Control Path Drawing Update)

### Decisions Made:
1. **End-to-End Ground Runway**: Replaced the partial runway with an 800px full-width runway spanning the entire bottom of the screen with a marked **Landing Entry Gate on the far left** (x: 0 to 130).
2. **Interactive Flight Path Drawing (Flight Control Style)**:
   - Players click/drag from any plane to draw a custom trajectory line.
   - Drawing into the left landing entry gate transitions the plane into landing touchdown and rollout.
3. **Dynamic Re-routing**:
   - Players can click and redraw a plane's flight path at any time mid-flight to avoid mid-air collisions or prioritize low-fuel aircraft.
4. **Spawn Ingress**: Planes enter into airspace from the **Top** (flying downward) or the **Right** (flying westward).
5. **2D Proximity Collisions**: Mid-air collision triggers if any two airborne planes come within 26px radius.
6. **Continuous Fuel Burn**: Fuel ticks down constantly with audible alarms and flashing red alerts below 20%.

### Verification:
- All unit tests passing in Vitest (`tests/domain/plane.test.js`, `tests/domain/simulation.test.js`).
- Static production build verified (`npm run build`).
