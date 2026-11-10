# HOLOLAB — Week 1, Day 5 (v0.5)

A cumulative React/Vite/Three.js project building on Days 1–4. This release adds **webcam hand tracking with 21 landmarks per hand for up to two hands**, and fixes the imported wheel mesh-name mismatch found in Day 4.

## Run it

Requires a recent Node.js version compatible with Vite 8, npm, Google Chrome, and a webcam. Run from this directory:

```bash
npm install
npm run check:project
npm run check:visuals
npm run check:assets
npm run check:hands
npm run build
npm run dev
```

Visit the localhost URL Vite prints. Click **Hand lab** (or press **C**) in the 3D viewport toolbar, then **Start camera** and allow access. Show one hand, then two: the overlay draws MediaPipe's 21 landmarks and their connections. Tracking metrics update alongside the existing renderer FPS.

**First camera launch needs internet.** MediaPipe's pinned WASM and hand model load from external URLs, unlike the bundled 35 KB test GLB. If needed, use the **CPU only** toggle before starting, or reduce the tracking rate.

The earlier car / Front Wheel & Brakes assembly still works. It now identifies all six part meshes even if Three.js changes names from spaces to underscores.

Read [docs/DAY5_HANDOFF.md](docs/DAY5_HANDOFF.md) for acceptance tests, privacy, GPU troubleshooting and exactly what is not yet implemented.

## What Day 5 is not

There is no 3D gesture manipulation yet. Day 6 interprets landmarks as gestures, and Day 7 tests combined gesture-driven 3D navigation and frame timing. The current detection loop intentionally uses a capped synchronous `detectForVideo` pass to establish a baseline on your M2; browser worker support is evaluated afterward rather than assumed.

## Source

- `src/hand/HandTrackingPanel.jsx`: webcam lifecycle, MediaPipe loading, frame scheduler and diagnostics
- `src/hand/landmarkDrawing.js`: 21 landmark drawing helpers and hand connections
- `src/engine/nodeNames.js`: safe GLB name canonicalization (Day 4 fix)
- `scripts/check-day5.mjs`: landmark/source checks plus GLB mesh-name mapping test

For all earlier project structure and model metadata, see the Day 1–4 documentation in `docs`.
