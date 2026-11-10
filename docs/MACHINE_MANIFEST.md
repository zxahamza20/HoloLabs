# HOLOLAB machine content format (Day 4)

The searchable library lives at `src/data/machines.js`. The viewer does **not** assume that every listed part has a 3D mesh.

## Structure

```js
{
  id: 'car', name: 'Passenger Car', category: 'Vehicles',
  // Top-level visual uses procedural geometry for now.
  assemblies: [{
    id: 'wheel-front', name: 'Front Wheel & Brakes', summary: '...',
    asset: {
      src: '/models/car/wheel-brakes-demo.glb',
      format: 'glb',
      status: 'demo',
      credit: 'HOLOLAB original generated geometry',
    },
    children: [{
      id: 'brake-rotor', name: 'Brake Rotor',
      description: '...', glbNode: 'Brake Rotor', children: [],
    }],
  }],
}
```

- `machine.id`, `assembly.id`, and `part.id` are stable IDs. Part IDs need only be unique within their assembly.
- `children` is recursive: it can contain nested assemblies or parts. This allows deeper zoom/isolate later without changing the data structure.
- `glbNode` must match the **name of an actual mesh node** in the specified GLB. Mesh names are verified by `npm run inspect:glb -- path/to/file.glb`.
- `asset.src` must point to a local `.glb` file under `public/models/`. The app downloads the focused GLB only when requested. Model overview still uses small procedural geometry.
- Assemblies without `asset` are **outlines only** and can't be opened in 3D yet.
- Day 4 supports one bundled GLB. No claim of full mechanical accuracy. The six-part wheel is original simplified test geometry, not a licensed production CAD assembly.

## Import preparation

1. Confirm redistribution/display license, permitted derivative use, and attribution requirements. Record license and source for every third-party asset.
2. Use a static glTF 2.0 `.glb` with meaningful separate mesh nodes (tire, rotor, etc.). A single merged mesh cannot support part selection.
3. Give every selectable mesh node a stable unique name and map each to `glbNode`. Export at sensible scale and orientation. Geometry is automatically centered and normalized for the isolated viewer.
4. Keep texture sizes small and triangle counts conservative for an 8 GB M2. Very large imported meshes skip CPU edge extraction; if necessary create lower-detail variants.
5. Put the GLB under `public/models/...`, add the manifest entry, run `npm run check:assets` and then load/test it in the browser.
6. Test switching away during download, repeated load/unload, and display settings. Look for growing memory after many switches.

## Current limits and next steps

- Only `.glb` is supported by the async progress loader. External `.gltf` references, Draco-compressed files, and advanced extensions are not configured yet.
- A real operation simulation, connecting parts to meaningful mount points, zoom-triggered region selection, and detachment arrive in Weeks 2–3.
- Day 4 selection uses mouse clicks or inspector buttons. Hand control begins Days 5–7.
- All assets loaded in this build must be from local `/models/` paths. No external URLs or arbitrary user uploads.

## Loader lifecycle

`assetManager.fetchBinary` streams the GLB and reports byte progress when the server provides `Content-Length`. `GLTFLoader.parseAsync` decodes it; this stage does not have a fine-grained percentage. An `AbortController` cancels the network request when switching machines; stale parse completions are ignored and disposed. On unload, geometries/materials/textures are explicitly released, including generated edge geometries and shader materials.
