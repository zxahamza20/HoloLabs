import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
const base = resolve(import.meta.dirname, '..');
function source(file) {
  const path = resolve(base, file);
  assert(existsSync(path), `Missing: ${file}`);
  return readFileSync(path, 'utf8');
}
const engine = source('src/engine/HologramCanvas.jsx');
const materials = source('src/engine/hologramMaterials.js');
const ambient = source('src/engine/sceneEffects.js');
const app = source('src/App.jsx');
const settings = source('src/components/Overlays.jsx');
for (const token of ['EffectComposer', 'UnrealBloomPass', 'OutputPass', 'disposeComposer', 'configurePipeline', 'createAtmosphere', 'createHologramMaterials']) {
  assert(engine.includes(token), `Renderer lacks ${token}`);
}
for (const token of ['ShaderMaterial', 'fresnel', 'uScanEnabled', 'setMode', 'setScan']) {
  assert(materials.includes(token), `Material layer lacks ${token}`);
}
for (const token of ['GridHelper', 'PointsMaterial', 'setDrawRange', 'createScanSlice']) {
  assert(ambient.includes(token), `Atmosphere layer lacks ${token}`);
}
assert(app.includes('effects={effects}'), 'App must pass effect preferences into renderer');
assert(app.includes('setEffects'), 'App must implement scan toggle');
assert(settings.includes("['bloom'"), 'Settings must contain visual effects');
console.log('PASS — Day 3 visual-engine files, composition and UI hooks validated statically.');
console.log('NOTE — Runtime WebGL rendering must still be tested in a browser.');
