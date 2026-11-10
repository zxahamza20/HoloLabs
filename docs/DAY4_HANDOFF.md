# Week 1 / Day 4 — Acceptance tests

**Today's deliverable:** A data-driven hierarchy and a real, tiny GLB asset-loading pipeline with six selectable mesh nodes.

## Commands

```bash
npm install
npm run check:project
npm run check:visuals
npm run check:assets
npm run inspect:glb -- public/models/car/wheel-brakes-demo.glb
npm run build
npm run dev
```

## Manual checks

1. Choose **Passenger Car** in the machine library. Confirm procedural car renders as before.
2. In the right Inspector, select **Front Wheel & Brakes** → **Load 3D test assembly**.
3. The loading display should briefly mention download and decoding. A cyan holographic wheel/brake test assembly should appear.
4. Click the wheel rim, tire, or other visible part. The chosen mesh should highlight and the right Inspector should show its name and short explanation. You can also select any of six parts using name buttons.
5. Rotate with left drag, zoom with scroll, switch Hologram/Wireframe (`W`), and toggle Scan (`S`). Do this while inside the GLB view.
6. Use **Whole Passenger Car** to return to the overview. Verify procedural car returns and the wheel detail disappears from the scene.
7. Repeat load/return at least 10 times, switch machines while the wheel is loading, and check Chrome DevTools for console errors or persistent GPU-memory growth.
8. Select **Engine Compartment**, Desktop, and Phone. These assemblies should show metadata only, not promise downloadable 3D content.
9. Search for `caliper`, `crankshaft`, and `RAM`. The correct machines should appear. Day 3 features should continue working.
10. Run `npm run build` on your M2 Mac and report any build errors.

## Scope boundary

Selecting a GLB mesh is **not detachment**, and the Test Assembly button is **not the automatic zoom-to-isolate system**. The focus transition is scheduled for Week 2; separation, tethers and lessons for Week 3. We are intentionally proving our data/assets pipeline today.

## Current asset

`public/models/car/wheel-brakes-demo.glb`: original generated low-poly demonstration, approx. 35 KB. It contains `Tire`, `Wheel Rim`, `Brake Rotor`, `Brake Caliper`, `Wheel Hub`, and `Lug Nuts` as independently named mesh nodes. `scripts/generate-wheel-demo.py` regenerates it if optional Python packages `trimesh` and `numpy` are installed. Users don't need Python to run the app; the GLB is already bundled.
