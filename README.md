# HOLOLAB — Week 1, Day 6 (v0.6)

A cumulative React + Vite + Three.js project. Includes Days 1–5 plus **on-device landmark-based gesture recognition**. The Day 4 wheel mesh-name fix remains included.

## Requirements

- macOS (M2 MacBook Air / 8 GB RAM is the development target) or another modern computer with a webcam
- Chrome with camera permission on `localhost`
- Node.js compatible with the included Vite version (check the version printed by `npm install`)
- Network connection for the initial MediaPipe WASM/model download

## Run

```bash
npm install
npm run check:project
npm run check:visuals
npm run check:assets
npm run check:hands
npm run check:gestures
npm run build
npm run dev
```

Visit the Vite `localhost` address. Open **Hand lab** (the camera button, or keyboard **C**), then **Start camera**.

## Day 6 behavior

- Recognizes **Point**, **Pinch**, **Open palm**, and **Fist**, plus a **two-hand pinch/zoom preview**.
- Displays each stabilized gesture on the camera feed and in the live gesture readout.
- Uses **palm-size normalization**, hysteresis for pinch, a short temporal confirmation window, and fingertip pointer smoothing.
- Hand identity matching is based primarily on palm location, not the arbitrary detection-array order.
- Provides **Relaxed**, **Balanced** (default), and **Precise** sensitivity presets. Use **Reset gestures** to clear the history when testing again.
- Continues to show the webcam landmarks, tracking FPS, inference time, and GPU/CPU selection from Day 5.
- Stopping or closing the camera clears active gesture state. It also releases the camera resource.

**Important:** Day 6 only recognizes gestures. It does **not yet** rotate, move, zoom, or disassemble the Three.js model. Hooking stable signals into 3D actions follows on Day 7 / Week 2. The two-hand zoom factor shown here is a diagnostic preview, not a camera transform.

## Testing

- `npm run check:gestures` runs eight deterministic unit tests with synthetic hand poses. They test clear poses, hysteresis, temporal confirmation, momentary noise, two-hand zoom, identity tracking, disappearance, and sensitivity changes.
- `npm run check:hands` also verifies the six mapped wheel mesh names from the Day 4 hotfix.
- The **full WebGL browser build and real webcam tracking** must be tested on your computer; synthetic tests cannot establish real-world accuracy.

The custom classifier uses 2D joint angles and index/thumb distance, so severe occlusion, extreme hand rotation, or poor lighting can still result in `Unrecognized`. Start at 15 tracking FPS and Balanced sensitivity, then adjust according to the actual camera readout.

## Files

- `src/hand/gestureRecognizer.js`: pure classifiers and stateful temporal recognition
- `src/hand/HandTrackingPanel.jsx`: live integration, gesture readouts, settings and camera lifecycle
- `src/styles.css`: responsive styling for new readouts
- `scripts/check-day6.test.mjs`: regression tests using Node's built-in test runner
- `docs/DAY6_HANDOFF.md`: acceptance checklist, troubleshooting and system boundaries

See previous `docs/DAY*_HANDOFF.md` files for earlier stages.
