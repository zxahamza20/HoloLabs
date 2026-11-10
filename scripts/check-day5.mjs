import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { MACHINES } from '../src/data/machines.js';
import { getAssetAssembly, flattenParts } from '../src/data/hierarchy.js';
import { canonicalNodeName, buildNodeLookup } from '../src/engine/nodeNames.js';
import { HAND_CONNECTIONS, FINGERTIP_INDICES, getHandLabel, describeCameraError } from '../src/hand/landmarkDrawing.js';

const dir = resolve(import.meta.dirname, '..');
const car = MACHINES.find(machine => machine.id === 'car');
const wheel = getAssetAssembly(car, 'wheel-front');
const parts = flattenParts(wheel.children);
const nodeLookup = buildNodeLookup(parts);
const path = resolve(dir, 'public', wheel.asset.src.replace(/^\//, ''));
const buffer = readFileSync(path);
const jsonLength = buffer.readUInt32LE(12);
const glb = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString());
const modelNodes = glb.nodes.filter(node => Number.isInteger(node.mesh));
assert.equal(modelNodes.length, 6, 'Bundled GLB has six independently selectable meshes');
for (const node of modelNodes) {
  const loaderName = node.name.replace(/\s+/g, '_'); // matches Three.js common name sanitization
  const part = nodeLookup.get(canonicalNodeName(loaderName));
  assert(part, `Unmapped Three.js-style mesh name: ${loaderName}`);
}
assert.equal(nodeLookup.size, 6, 'Six unique part mappings');
assert.equal(canonicalNodeName('Wheel Rim'), canonicalNodeName('Wheel_Rim'));
assert.equal(canonicalNodeName('Brake Caliper'), canonicalNodeName('Brake_Caliper'));
assert.throws(() => buildNodeLookup([{id:'one', glbNode:'A B'}, {id:'two', glbNode:'A_B'}]), /Ambiguous/);

assert.equal(HAND_CONNECTIONS.length, 21, 'The skeleton uses 21 bones/segments');
for (const [a, b] of HAND_CONNECTIONS) {
  assert(a >= 0 && a < 21 && b >= 0 && b < 21, 'Connection point out of landmark range');
}
assert.equal(FINGERTIP_INDICES.size, 5);
assert.equal(getHandLabel([{categoryName:'Right', score:0.99}]), 'Right');
assert.match(describeCameraError({name:'NotAllowedError'}), /permission/i);

for (const file of ['src/hand/HandTrackingPanel.jsx','src/hand/landmarkDrawing.js','src/engine/nodeNames.js', 'docs/DAY5_HANDOFF.md']) {
  assert(existsSync(resolve(dir, file)), `Missing Day 5 file: ${file}`);
}
const panelSource = readFileSync(resolve(dir, 'src/hand/HandTrackingPanel.jsx'), 'utf8');
for (const snippet of ['numHands: 2','detectForVideo(', 'getUserMedia(', 'track.stop()', 'requestAnimationFrame(', 'releaseResources()', 'videoRef', 'canvasRef', 'renderHandLandmarks(', 'onDiagnostics']) {
  assert(panelSource.includes(snippet), `Hand Tracking Panel missing ${snippet}`);
}
console.log('PASS — All six GLB meshes map after Three.js name sanitization.');
console.log('PASS — Day 5 landmarks, camera lifecycle and detection code are present.');
console.log('NOTE — This checks source and GLB data; webcam inference and Vite build need local testing.');
