# HOLOLAB — Week 1 / Day 2

React + Vite + Three.js application shell for a holographic machine learning explorer.
This is an **incremental update to the Day 1 project**; it retains the procedural 3D previews and adds the library, inspector, preferences, onboarding/help, and reusable interface components.

## Requirements

- Node.js version compatible with Vite 8 (currently Node 20.19+ or 22.12+; using a current supported LTS version is recommended)
- npm
- Chrome, Edge, or another modern desktop browser with WebGL enabled

## Continue from Day 1 (important)

1. Back up any edits you made to the Day 1 project.
2. Download and extract the Day 2 project into a **new directory**.
3. Open that directory in VS Code.
4. Run:

```bash
npm install
npm run dev
```

You can also validate the starter catalog and file structure without installing dependencies:

```bash
npm run check:project
```

Open the local URL Vite prints, normally `http://localhost:5173/`.

If you did **not** make any local edits to Day 1, this folder replaces the Day 1 starter. If you have edits, compare and merge instead of overwriting them. The Day 2 project already includes all the source from Day 1, so don't nest Day 1 inside it.

## What's working on Day 2

- Responsive app shell: primary navigation rail, searchable machine library, holographic viewport and machine inspector
- Search for machines, categories **and listed component names** (e.g., `brake`, `cpu`, `camera`)
- Category filtering: All / Vehicles / Computing / Electronics
- Three switchable procedural 3D machine previews
- Machine favorites (star) and display preferences persisted in local browser storage
- Assembly blueprint selection in the inspector (metadata only — no isolation yet)
- Hologram/wireframe toggle; auto spin; orbit/zoom/pan; reset camera
- Renderer quality presets (Eco/Balanced/Detail), with actual pixel ratio changes
- Loading/error states for the viewport and a live approximate render FPS counter
- Help dialog and keyboard shortcuts
- Retained camera and WebGL renderer when changing display settings, rather than recreating the whole canvas

## Keyboard and mouse controls

| Input | Action |
| --- | --- |
| Left mouse drag | Orbit around model |
| Scroll | Zoom in/out |
| Right mouse drag | Pan |
| `/` | Focus search box |
| `1`, `2`, `3` | Select a machine |
| `W` | Toggle display mode |
| `Space` | Toggle auto-rotation |
| `R` | Reset camera |
| `H` | Open help |
| `Esc` | Close a dialog |

Keyboard shortcuts are ignored while typing or when a dialog is open.

## Not implemented yet

- Webcam/MediaPipe hand tracking (Week 1 Day 5)
- Hand gesture recognition (Week 1 Day 6)
- Real GLB assets, nested loading and assembly hierarchy (asset work starts Day 4)
- Discovery hotspots, zoom-to-isolate and breadcrumb transitions (Week 2)
- Disassembly, educational labels, X-ray and operation/lesson modes (Week 3)

The catalog and inspector deliberately label assemblies as **blueprint only**, to avoid implying that their interactive mechanics exist yet.

## Folder map

- `src/components/`: reusable UI panels, dialogs and SVG icon set
- `src/data/machines.js`: catalog and planned assembly structure
- `src/engine/HologramCanvas.jsx`: Three.js renderer and procedural models
- `src/utils/preferences.js`: local persistence helper
- `src/hand/`: reserved for Days 5–6
- `src/learning/`: reserved for Week 3
- `public/models/`: reserved for GLB assets
- `scripts/inspect-glb.mjs`: mesh/node inspection helper
- `docs/`: design and asset acceptance criteria

## Test checklist

- [ ] `npm run dev` starts cleanly
- [ ] Three machine previews load; selected machine and metadata agree
- [ ] Left drag / scroll / right drag work
- [ ] Hologram ↔ Wireframe changes without throwing errors
- [ ] Auto spin on/off and reset camera work
- [ ] Searching `brake` returns the car, searching `gpu` returns desktop
- [ ] Category filter and clear filters work
- [ ] Inspector shows correct assembly metadata and part names
- [ ] Favorites, mode and quality persist after refresh
- [ ] Help/settings dialogs open and close; keyboard shortcuts work
- [ ] No recurring WebGL errors when switching machines repeatedly
- [ ] `npm run build` finishes successfully

### Performance note

The reported FPS is *rendering* FPS, not camera-to-gesture latency. Actual webcam performance will be profiled on Day 7. Repeated model changes dispose previous geometries and materials.
