# Day 2 handoff / acceptance

The app shell is implemented as reusable React components, separate from Three.js rendering:

- MachineLibrary: search, categories, favorites, machine selection
- InspectorPanel: machine/assembly metadata preview
- Overlays: help and preferences dialogs
- HologramCanvas: one WebGL renderer, replaceable model, mode and quality settings
- preferences: persisted browser state

## Current boundaries

All geometry is still procedural placeholder content. Assemblies are metadata only. "Systems" in the library refers to planned models; it is not a claim that the models are currently detachable. Hands/gesture tracking are not integrated yet.

## Day 3 handoff

Day 3 can improve holographic materials, environmental effects, shader effects, quality/pixel ratio profiles and rendering style without changing the library, inspector or machine metadata API.

## Day 4 handoff

Replace the `buildDemo()` placeholder path with a loader that maps `machineId`, assembly metadata and GLB assets. Keep `onReady(machineId)` tied to genuine asset readiness; ensure disposals. Leave assembly metadata stable for Week 2 isolation logic.

## Testing limitations

This is a source handoff. Build and in-browser smoke testing should be performed locally before proceeding. Browser capability and frame rate cannot be guaranteed on the M2 8GB computer until checked there.
