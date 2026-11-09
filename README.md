# HOLOLAB — Week 1 / Day 1

A React + Vite + Three.js project starter for a holographic machine explorer.

## Requirements

- Node.js 22.12+ (or a compatible recent Node.js version meeting the current Vite requirements)
- npm
- Chrome or another modern WebGL-compatible browser

## Run locally

```bash
cd hololab-week1-day1
npm install
npm run dev
```

Open the localhost URL shown by Vite (usually http://localhost:5173/).

## Test now

- Switch between the car, desktop PC, and smartphone procedural **placeholders**.
- Drag to rotate, scroll to zoom, and right-drag to pan.
- Toggle hologram/wireframe preview and auto spin.
- Watch the approximate FPS counter.
- Confirm that machine metadata changes with your selection.

## Not implemented yet

- Webcam/MediaPipe tracking
- Hand gestures
- GLB asset loading and nested assembly isolation
- Detachment, connectors, labels, lessons and progress

These are deliberately scheduled in later milestones. The data structure anticipates them.

## Inspect candidate GLB models

```bash
npm run inspect:glb -- public/models/car/overview.glb
```

First copy a real .glb file into that path. The script prints named nodes and meshes, but cannot prove that components are anatomically accurate or independently detachable.

## Folders

- `src/data/`: machine and subsystem definitions
- `src/engine/`: Three.js scene / later loading and interaction
- `src/hand/`: landmark tracking and gesture processing (later)
- `src/learning/`: annotations, lesson sequences and progress (later)
- `public/models/`: local GLB assets (later)
- `docs/`: asset acceptance and design references

## Note on performance

The FPS shown here is **rendering performance only**. It does not benchmark hand tracking or latency; those are tested when the webcam pipeline is integrated.
