# Week 1 / Day 5 — Webcam + 21-landmark tracking

## Scope

Day 5 adds a permission-gated, mirrored webcam preview and MediaPipe Hand Landmarker to the existing Day 4 application. It **does not yet map gestures to 3D operations**; that begins with gesture recognition on Day 6 and integration/performance profiling on Day 7. The wheel mesh-name bug reported after Day 4 is also fixed.

## Run on your M2 MacBook Air

In the project folder:

```bash
npm install
npm run check:project
npm run check:visuals
npm run check:assets
npm run check:hands
npm run build
npm run dev
```

Open **http://localhost:5173** (or the URL Vite shows) in current Chrome. Do not use an arbitrary plain HTTP IP address; browser camera permissions generally require localhost or HTTPS. `file://` will not work as a substitute for Vite.

1. Click **Hand lab** in the viewer toolbar (or press **C** when not typing).
2. Set **Auto (GPU → CPU)** and **15 FPS** initially.
3. Click **Start camera** and allow the browser to use the camera.
4. The first launch requires downloading the MediaPipe WASM runtime from pinned jsDelivr (`@mediapipe/tasks-vision@1.2.2`) and the Google-hosted model file. Keep an internet connection for initial setup; npm install by itself does **not** bundle those assets.
5. Hold one hand in front of the camera, then two. The video preview should show 21 dots and 21 connecting segments for each detected hand. The preview and landmarks are mirrored together. The Left/Right labels follow MediaPipe's handedness output (subject hand, not screen side).
6. Move hands slowly and then quickly. Observe **Tracking FPS**, **Inference ms**, and the separate 3D renderer FPS in the viewer.
7. Stop camera, restart it, switch machines while tracking, and finally close Hand lab. Closing Hand lab turns the webcam off and cleans up MediaPipe resources.
8. If GPU initialization fails, the panel automatically retries CPU. You can also choose **CPU only** before starting. Set 10 FPS if rendering becomes choppy.

## Expected performance and known limits

- 15 FPS is a scheduling **cap**, not a guaranteed measured rate. The reading is calculated from actual processed video frames.
- Detection runs synchronously on the UI thread for this Day 5 validation. It may temporarily affect 3D FPS on a busy MacBook Air. Moving inference to a worker, if the runtime and browser combination supports it reliably, is a Day 7 optimization candidate.
- First-time model loading can take longer than normal camera start. An internet/firewall interruption can cause a readable error.
- Camera and camera canvas are local. The app has no code to upload video. MediaPipe itself may transmit usage/performance metrics as described by Google's privacy notice.
- The overlay can be dismissed at any time; it stops the stream. Privacy-sensitive video is not persisted to local storage.

## Day 4 fix carried forward

Three.js may sanitize glTF node names: `Wheel Rim` is loaded as `Wheel_Rim`. `src/engine/nodeNames.js` canonicalizes names before matching them to educational component IDs, while `npm run check:hands` now verifies all six GLB meshes under Three.js-style names. Click the parts again from the car's Front Wheel & Brakes test view. The Inspector should report all **six** named parts, not just one.

## Trouble checklist

- **No webcam prompt:** Ensure the page is on `localhost`/HTTPS; inspect Chrome Site settings → Camera.
- **No camera:** Close FaceTime/Zoom/other camera apps and retry; check macOS System Settings → Privacy & Security → Camera.
- **Model/WASM fails:** Check network access to `cdn.jsdelivr.net` and `storage.googleapis.com`; reload and try again.
- **Blank detection:** Ensure your hands are visible and well lit, keep them within the frame, and try CPU-only mode.
- **3D FPS drops:** Lower tracking rate to 10 FPS, use Eco rendering preset, and compare GPU/CPU modes. Record actual readings for Day 7.
- **Screen goes black or renders incorrectly:** Try restarting the browser with the camera off; report GPU errors from DevTools Console. We will use these to select the safest delegate path on your hardware.

## Acceptance criteria

- Both hands are detected with visibly connected 21-point skeletons.
- Starting and stopping the camera works repeatedly without stuck camera permissions.
- Closing the panel turns off the camera indicator.
- Existing machine library, GLB selection, hologram controls and inspector still work.
- All six wheel GLB meshes are recognized by name.
- Measured hand tracking and rendering rates are visible so we can evaluate responsiveness in Day 7.
