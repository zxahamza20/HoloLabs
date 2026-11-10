# Day 6 handoff — gesture recognition

## Scope

Built on the Day 5 MediaPipe `detectForVideo` loop. Recognition happens **after each landmark inference**, with the following pipeline:

````
Webcam frame -> MediaPipe 21 landmarks per hand
             -> classifyHand() (palm-normalized geometric features)
             -> GestureEngine (hysteresis + short temporal confirmation)
             -> per-hand gesture state and two-hand zoom diagnostic
             -> Hand Lab readout
````

Day 6 intentionally stops before dispatching gestures into Three.js camera and part-selection operations.

## Gestures

| Signal | Pose | What to expect |
|---|---|---|
| POINT | Index extended, middle/ring/pinky curled | `Point` badge appears over fingertip |
| PINCH | Thumb tip touches index tip | `Pinch` (brief confirmation) |
| OPEN_PALM | Four fingers straight | `Open palm` and held duration |
| FIST | Four fingers curled | `Fist` |
| Two-hand pinch | Both hands hold a stable pinch | Diagnostic factor: `1.00x` at engagement, grows or shrinks with separation |
| NONE | Gesture unclear or lost | `Unrecognized` or empty lab |

The classifier uses normalized thumb/index distance and 2D joint geometry. It does not claim full 3D pose understanding. A thumb is not required to be visibly extended for OPEN_PALM or FIST classification.

## Run and test

```bash
npm install
npm run check:gestures
npm run check:hands
npm run build
npm run dev
```

1. Start camera with **Hand lab** (`C`), hand-tracking 15 FPS, **Balanced** sensitivity.
2. Make each pose above and hold it steadily for a moment. Confirm the *stable* gesture updates; a single noisy frame should not cause a sudden switch.
3. Move your hand: check that the fingertip label roughly follows the fingertip.
4. Try both hands pinching, move them apart, move them together, then release either one. The zoom **readout** should increase, decrease, then immediately deactivate after the pinch gap crosses its release threshold. It must not yet zoom the 3D machine.
5. Change Balanced to Relaxed and Precise. Test which best matches your webcam/lighting.
6. Click **Reset gestures** while the camera stays on. It should reset current recognitions, not disconnect the camera.
7. Stop the camera or close Hand lab. macOS camera indicator should turn off.
8. Change machines and revisit `Front Wheel & Brakes`. All 6 GLB part meshes should still map correctly.
9. Check the 3D FPS with the Hand Lab closed versus open, and record tracking FPS + inference time.

## Performance / limitations

- Defaults to 15 detection FPS; the React gesture readout updates at roughly 9 Hz or on gesture changes, avoiding a component rerender for every camera frame.
- Tracking still calls synchronous `detectForVideo` on the main thread, just as on Day 5. It can block rendering; moving inference to a worker is a possible future optimization but needs real-browser testing.
- No per-user training or model download for gestures; the rule-based classifier uses MediaPipe's existing landmarks.
- Gestures can be confused by rotation, occlusion, clutter, or extreme camera distance. Use Balanced first, a well-lit unobstructed hand, and keep the palm approximately facing the webcam.
- Sensitivity is an adjustable threshold preset, **not a learned per-user calibration**. Reset gestures clears the state machine.
- This preview does not modify the 3D scene and does not transmit the camera feed to the HOLOLAB app server. MediaPipe downloads its model and runtime from their external hosts on initial use.

## Exit criteria

- All scripts pass, including eight Day 6 tests.
- Each clear gesture appears consistently in the lab on target hardware.
- Two-hand pinch produces a separation ratio only while both hands pinch.
- No stale gesture remains when a hand disappears, camera stops, or Hand lab closes.
- Existing car wheel GLB and interface features remain intact.

## Day 7 boundary

On Day 7, map stable `POINT` / `PINCH` / `FIST` and `twoHand` outputs into an explicit input arbiter and limited 3D actions, then benchmark rendering and tracking together. Disassembly remains a later milestone.
