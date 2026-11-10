# Week 1, Day 3 — Visual engine handoff

## Renderer separation

- `src/engine/HologramCanvas.jsx`: WebGL lifecycle, scene camera, controls, preview construction, frame loop, quality preset and postprocessing setup.
- `src/engine/hologramMaterials.js`: GPU shader materials; surface normals, view-angle emission, animated scan bands; wireframe mode uniforms.
- `src/engine/sceneEffects.js`: reusable technical floor, atmospheric particles, pulsing rings and scanning slice.

## Performance decisions

- The selected machine is the only geometry subtree recreated on machine switches.
- Changes to scan, wireframe and camera settings do not recreate the WebGL renderer or model.
- Particle count uses `drawRange` instead of rebuilding geometry.
- Bloom render buffers are only allocated in Balanced/Detail when the option is enabled, and disposed when no longer needed.
- Balanced uses an internally downscaled bloom composer, reducing pressure on an M2 MacBook Air Retina panel.
- Geometry, materials, and render targets are explicitly disposed.
- Rendering pauses work when the browser tab is hidden. A browser is still free to throttle background activity.

## Known limitations

- The model previews are procedural, not authentic product models.
- A shader glow without bloom does not generate light spill. This is intentional for Eco mode.
- Thick lines are not guaranteed by WebGL `LineBasicMaterial` across platforms; outlines currently use single-pixel lines.
- Transparent face drawing may show minor overlap artifacts in some views. More advanced depth sorting will be considered once real GLB assets are integrated.
- FPS measures frame throughput, not end-to-end gesture delay.

## Day 4 integration contract

GLB loader should yield a `THREE.Group` with named child meshes and structured `userData` metadata for assemblies. When these models arrive, the holographic material layer can decorate their mesh materials and edge geometry while the existing scene / camera / atmosphere remain alive. Asset boundaries must be explicit and cleanup must remain correct.
