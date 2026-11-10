# HOLOLAB — Week 1, Day 7 (v0.7)

Complete cumulative source project for Days 1–7 of the HOLOLAB interactive holographic machine explorer. **Day 7 connects webcam-recognized hand gestures to the existing Three.js viewer**, includes a user-enabled safety toggle, and adds side-by-side performance benchmarking.

## Requirements

- MacBook Air M2 / 8 GB RAM (target) or another modern computer with webcam and WebGL support
- A Node.js release compatible with the included Vite version (Node 22.12+ or current LTS recommended)
- Chrome on `localhost` or secure HTTPS for webcam permission
- Internet connection the first time MediaPipe downloads its WASM/model assets

## Run

```bash
npm install
npm run check:project
npm run check:visuals
npm run check:assets
npm run check:hands
npm run check:gestures
npm run check:integration
npm run build
npm run dev
```

Open the `localhost` URL printed by Vite. If your Day 6 installation is already in Git, **keep its `.git` directory** and copy the Day 7 `src`, `scripts`, `docs`, `public` and config files across. Avoid overwriting any personal changes without reviewing them first.

## Live hand control — exact steps

1. Open **Passenger Car** in the machine library.
2. In the right **Inspector**, choose **Front Wheel & Brakes** and click **Load 3D test assembly**. This is the only presently implemented selectable GLB demonstration.
3. Press **C** (or click **Hand controls**), then **Start camera** and allow access.
4. Verify the live 21-landmark hand skeleton. The panel initially operates in **preview-only mode**.
5. Enable the **Control the 3D viewer** checkbox; optionally compact the camera panel with the `−` button.
6. Point at a wheel component: the glowing viewport cursor and a hover box should follow the part.
7. Pinch **briefly and release** while aiming at a part to select/highlight it. The inspector will reflect the selected part. A long pinch does not select.
8. **Fist + move** to orbit; **open palm + move** to pan; **pinch both hands and spread/close** to zoom.
9. Turn off the checkbox to restore preview-only behavior. Mouse orbit, scroll zoom, and click selection remain available at all times.

**Gesture reliability:** Hold clear poses briefly so the Day 6 recognition state settles (~120–160ms). A hand that vanishes or sends a stale frame stops controlling the viewer, rather than retaining a stuck grab. Webcam input updates a mutable ref, not React state on every frame. Two-hand zoom explicitly suppresses single-hand pinch selection.

**Not yet included:** Automatic zoom-to-isolate transitions, hotspot discovery, physics-based part detachment, guided learning and multiple imported assemblies remain Week 2–3 objectives. There is no change in scope or missing feature hidden in this Day 7 deliverable.

## Day 7 performance measurements

Expand **Performance lab** below the viewer. It shows rendering FPS, p95 animation frame gap in ms, WebGL draw calls, and live camera inference timing.

To compare camera cost, keep the same 3D model / quality / browser window dimensions throughout:

1. Stop the camera; let any model loading finish; click **Capture camera OFF**.
2. Wait for 8 render-metric samples (roughly 9 seconds). Do not minimize the browser tab.
3. Start the camera; enable 3D controls, then click **Capture camera ON** while holding a stable hand pose.
4. Compare average rendering FPS and the mean of each one-second p95 frame-gap reading. **Copy performance report** for a JSON summary.
5. Repeat on **Eco** and **Balanced** quality, and try 10 / 15 / 20 / 30 tracking FPS if there is a major drop.

This benchmark records **browser frame timing**, not direct GPU execution time or full motion-to-photon latency. MediaPipe `detectForVideo()` still executes synchronously on the main thread in this version. Moving hand inference into a Worker is a possible next optimization but is not claimed as implemented.

## Tests and limits

- `npm run check:integration`: eight deterministic Day 7 tests for cursor mirroring, single pinch selection, drag cancellation, two-hand-zoom safety, fist/palm motion, tracking loss, frame deduplication and benchmark math.
- `npm run check:gestures`: eight Day 6 synthetic hand-landmark tests.
- Day 1–5 metadata, source and GLB checks remain available.
- These checks do **not** replace a real webcam and WebGL test. The maintainer's environment cannot currently download npm packages, so local `npm run build` and browser acceptance tests must be completed on your Mac.

For the Day 7 acceptance checklist and known limitations, see `docs/DAY7_HANDOFF.md`.
