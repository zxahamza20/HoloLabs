# HOLOLAB — Week 1, Day 4

**Real machine hierarchy + GLB asset loading + asset lifecycle.** Builds on Days 1–3 without replacing the viewer. Tested with an original six-part GLB demo so future machine content follows a concrete contract.

## Run locally on macOS

Prerequisite: a Node.js version supported by the Vite version in `package.json` and a current Chrome/Chromium browser.

```bash
npm install
npm run check:project
npm run check:visuals
npm run check:assets
npm run inspect:glb -- public/models/car/wheel-brakes-demo.glb
npm run build
npm run dev
```

Open the Vite localhost URL (usually `http://localhost:5173`). This ZIP is cumulative; when merging into your existing git repository, **preserve `.git`**, `node_modules`, and any personal changes. Copy changed source files after backing up if needed.

## Day 4 additions

- Recursive machine → assembly → part hierarchy with stable IDs, short descriptions and GLB node mapping.
- Original 35 KB wheel/brake GLB with six separately named meshes. **No additional downloads necessary** after `npm install`.
- `GLTFLoader` integration using streaming fetch with byte progress where available. Only the focused assembly asset is loaded.
- Click an imported mesh or its name in Inspector to highlight it and see basic part information.
- Return to whole-machine overview; selected assembly GLB is unloaded and GPU resources disposed.
- Async abort/stale-load guards when switching machines, resetting, and unmounting.
- Reusable model scale normalization, animated hologram shading and edge extraction on GLB meshes.
- Asset validator (including actual GLB node names), model hierarchy helpers and content authoring guide.

## Quick test

1. Open **Passenger Car**.
2. In Inspector, select **Front Wheel & Brakes** → **Load 3D test assembly**.
3. A ring-like wheel with brake components replaces the procedural car overview. Click components to highlight and inspect them.
4. Press `W` or `S`, zoom/rotate, and check the visual controls still work.
5. Click **Whole Passenger Car** to restore the overview.
6. Change to Desktop or Smartphone; their overviews must still work, and their assemblies remain explicitly **outline only**.

More detailed tests and known limitations: [docs/DAY4_HANDOFF.md](docs/DAY4_HANDOFF.md).

## Contents

- `src/data/machines.js`: catalog and hierarchical parts data
- `src/data/hierarchy.js`: recursive catalog utilities and validation
- `src/engine/assetManager.js`: streaming GLB loader, node/part mapping, disposal
- `src/engine/HologramCanvas.jsx`: scene + viewer + clickable assembly nodes
- `src/components/InspectorPanel.jsx`: 3D test entry/exit, part browser and metadata
- `public/models/car/wheel-brakes-demo.glb`: original generated GLB
- `docs/MACHINE_MANIFEST.md`: model requirements and content guide
- `scripts/generate-wheel-demo.py`: optional regeneration script

## Known limitations

Day 4 is **not yet** webcam tracking, gesture recognition, region isolation, detachment or full lessons. The bundled wheel model is an intentionally schematic test model, not an accurate service manual or full car geometry. Real CAD-style assets require suitable licenses and mesh preparation.

## Verification

The provided `check:*` scripts validate manifest integrity and required source features, not runtime browser rendering. Build and browser testing should be performed on your MacBook. Day 5 adds webcam and MediaPipe landmarks; Day 6 builds gestures; Day 7 combines tracking with the scene.
