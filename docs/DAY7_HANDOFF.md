# HOLOLAB · Week 1 · Day 7 — Gesture-to-3D integration and M2 benchmark

## Implemented

- Live webcam gesture snapshots connected via a single ref from HandTrackingPanel → App → HologramCanvas; no per-tracking-frame React rerender.
- Pinch-and-release selects named GLB parts using the same raycaster as mouse picking; selection is deliberately delayed until release to prevent accidental picks during two-hand zoom.
- Pointing displays a mirrored cursor with on-hover part identification and an edge outline; overview mockups have no named selectable nodes and are not falsely treated as explorable.
- Fist motion orbits the camera, open palm motion pans the camera, and two-hand pinch adjusts the camera distance while respecting OrbitControls limits.
- Automatically stops/clears actions after tracking loss or 320ms stale data; changing machine/view and reset camera clear pending actions.
- User-enabled "Control the 3D viewer" switch defaults OFF each time Hand Lab opens; compact/expand panel while camera stays on; mouse controls remain unchanged.
- Performance Lab records 8 samples with webcam OFF/ON; FPS, p95 frame-gap, draw call count, inference time and comparison, plus report copy.

## Acceptance tests (run on MacBook)

1. `npm install && npm run check:integration && npm run build && npm run dev` completes without errors.
2. Load Car → Front Wheel & Brakes → Load 3D test assembly.
3. Verify mouse selection still works; the GLB Inspector lists all 6 parts (Tire, Wheel Rim, Brake Rotor, Brake Caliper, Wheel Hub, Lug Nuts).
4. Start webcam; ensure preview-only by default; model does not respond until "Control the 3D viewer" is checked.
5. Enable control; point at a wheel part, observe cursor and hover outline; quick pinch-and-release selects/highlights it.
6. Move with a clenched fist to rotate. Move an open palm to pan. Two pinched hands moving apart zoom in; moving together zooms out.
7. Verify two-hand zoom does not select parts. Verify disappearing hands, stopping webcam, changing machine or resetting camera do not cause a continued camera jump.
8. Test compact/expanded camera overlay, switch between hologram and wireframe, change quality presets, confirm mouse fallback.
9. Expand Performance lab, record baseline camera-off and camera-on metrics, and paste report into our next chat.
10. Leave camera and viewer running for 5 minutes: check for FPS deterioration, excessive RAM pressure, stuck gestures or a disabled camera light that remains on.

## Key caveats / next steps

- A fake "lag-free" claim would be misleading. Targets (60 FPS render / ~15 FPS tracking) must be measured on actual M2/8 GB; screenshots and numeric report are needed.
- MediaPipe currently runs on the UI thread. Advanced worker processing, gesture calibration, assisted picking, selection dwell and natural zoom-to-isolate behavior can be tackled based on real benchmark results.
- The demo wheel remains simplified and educational, not anatomically exact.
- No physical disassembly, subsystem transitions or machine-specific curriculum are claimed in Day 7; these were scheduled for Weeks 2–3.
