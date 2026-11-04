# ATC Web Game — Design Document

**Date:** 2026-11-04  
**Branch:** web-game  
**Stack:** Phaser 3, vanilla JS / Vite, static HTML — deployed to web

---

## Intent & Why

Convert the existing CLI Air Traffic Controller game (`game.cpp`) into a pixel-art side-view browser game that preserves the core tension loop — fuel ticking down, landings colliding if sequenced wrong — but makes it immediately playable and viscerally fun via drag-and-drop interaction and a visual runway scene.

The target feeling: **thrill of a close call** + **satisfaction of cleanly sequencing landings**.

---

## Goals

- **Pixel-art side-view scene** with planes flying in airspace on the left, descending along a single glide slope towards a runway on the right.
- **Drag-to-assign / Sequence queue**: Drag a plane into the landing queue / glide path.
- **Option A (Original C++ Tension with Single Approach Lane)**:
  - Planes line up on a single approach path.
  - Each plane has an estimated landing duration / speed.
  - If a trailing plane catches up or reaches landing touchdown before the plane in front clears the runway → **Mid-air collision / Runway disaster (Game Over)**!
- **Continuous Fuel Burn**: Fuel keeps draining until the wheels physically touch down on the runway! A plane can flame out mid-descent if timed too closely.
- **Total Planes Cap (10 Planes)**: The 10-plane cap applies across all active planes (airspace circling + planes on final approach).
- **Friendly & Progressive Spawn Pacing**: Starts very approachable (e.g. 1 plane every 7-8s, stepping down gradually) so the player has breathing room to learn, ramp up, and enjoy clean sequencing without immediate chaos.
- **Visible fuel bars & callsigns** above each plane that drain and flash when critical.
- **Score**: `(10 + fuel remaining) * comboMultiplier` on successful touchdown.
- **Combo streak**: Consecutive clean landings build combo multipliers (x1, x1.5, x2, x3...).
- **Go-Around / Delay command**: Right-click or pull back an approaching plane back into airspace (aborted landing) if a collision is imminent.

---

## Game Scene Layout

```
+-----------------------------------------------------------------------------------+
| SCORE: 0       TIME: 0:00       ACTIVE PLANES: 3/10       COMBO: x1              |
+-----------------------------------------------------------------------------------+
|                                                                                   |
|  [AIRSPACE - Circling Area]                     [APPROACH GLIDE PATH]             |
|                                                     ╲                             |
|  ✈ CS-A912 [Fuel: 74%]                               ╲  ✈ CS-B201 (Leading)       |
|                                                        ╲                          |
|  ✈ CS-K440 [Fuel: 21%]                                  ╲  [RUNWAY]==============|
|                                                                                   |
+-----------------------------------------------------------------------------------+
```

- **Airspace (Left ~60%)**: Planes enter and circle at distinct altitudes.
- **Approach Glide Path (Right ~40%)**: Single lane descending diagonally to the tarmac.
- **Runway**: Touchdown zone where landed planes roll out, score pops up, and plane exits.

---

## Core Rules & Mechanics

| Rule | Implementation Details |
|---|---|
| **Fuel Drain** | Continuous 1%/sec + `floor(score / 150)`. Drains in both airspace AND during approach until wheels touch tarmac. |
| **Pacing / Spawn** | Gentle early game: 7s spawn timer. Reduces by 1s every 50 points down to a baseline 3.5s minimum. Max 1 plane per spawn until score > 150. |
| **Max Cap** | Max 10 active planes (Airspace + Approach combined). Exceeding 10 triggers overcrowding Game Over. |
| **Sequencing Collision** | If a trailing plane overtakes or reaches 0 distance/time before the lead plane clears the runway → Game Over. |
| **Aborted Approach (Go-Around)** | Right-clicking a descending plane orders an immediate Go-Around back to circling airspace (saves collision, but plane keeps burning fuel). |
| **Scoring** | `(10 + remaining_fuel) * comboMultiplier`. |

---

## Technical Specifications

- **Resolution**: 800×450 virtual canvas (16:9), integer-scaled crisp pixel art rendering (`pixelArt: true` in Phaser).
- **Engine**: Phaser 3 (via lightweight Vite setup for clean modular ES6 code and quick static bundle).
- **Visuals**: Pixel art procedural/canvas or clean sprite sheets:
  - Custom plane sprites with heading animations.
  - Runway lights, touchdown smoke particle burst.
  - Dramatic explosion & screen shake on crash or fuel exhaustion.
  - Fuel gauge HUD with distinct danger states (Green > 50%, Yellow 20-50%, Flashing Red < 20%).

---

## Success Criteria

1. Clear visual distinction between circling planes and descending planes.
2. Dragging a plane onto the glide path smoothly transitions it into the approach sequence.
3. Catch-up collisions and fuel flame-outs are accurately detected and dramatized.
4. Go-around command (right-click) gives the player an out to prevent close-call disasters.
5. Runs locally with zero dependencies besides Vite / browser, builds to static `dist/`.
