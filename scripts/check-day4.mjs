import assert from 'node:assert/strict';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { MACHINES } from '../src/data/machines.js';
import { validateLibrary, flattenParts, findPart, getAssetAssembly, searchableNames } from '../src/data/hierarchy.js';

const root = resolve(import.meta.dirname, '..');
assert.deepEqual(validateLibrary(MACHINES), [], 'Machine manifest must validate');
assert.equal(MACHINES.length, 3);
const car = MACHINES.find(m => m.id === 'car');
const wheel = getAssetAssembly(car, 'wheel-front');
assert(wheel, 'Wheel assembly must have a real GLB asset');
assert.equal(flattenParts(wheel.children).length, 6);
assert.equal(findPart(wheel, 'brake-rotor')?.glbNode, 'Brake Rotor');
assert(searchableNames(car).includes('caliper'));
assert.equal(getAssetAssembly(car, 'engine-bay'), null, 'Unfinished engine must not pretend to have an asset');
for (const machine of MACHINES) for (const assembly of machine.assemblies) {
  if (assembly.asset?.src) {
    const file = resolve(root, 'public', assembly.asset.src.slice(1));
    assert(existsSync(file), `GLB not found ${file}`);
    assert(statSync(file).size > 32, `GLB is too small ${file}`);
    const buffer = readFileSync(file);
    assert.equal(buffer.toString('ascii', 0, 4), 'glTF', `Not a binary glTF ${file}`);
    const declaredLength = buffer.readUInt32LE(8);
    assert.equal(declaredLength, buffer.byteLength, `GLB length mismatch ${file}`);
    const jsonLength = buffer.readUInt32LE(12);
    const json = JSON.parse(buffer.subarray(20, 20 + jsonLength).toString());
    const nodes = new Set(json.nodes.map(n => n.name));
    for (const part of flattenParts(assembly.children)) assert(nodes.has(part.glbNode), `${part.glbNode} missing from ${file}`);
    console.log(`GLB ✓ ${assembly.asset.src}: ${json.nodes.length} nodes, ${buffer.byteLength.toLocaleString()} bytes`);
  }
}
for (const path of ['src/engine/assetManager.js','src/data/hierarchy.js','src/components/InspectorPanel.jsx', 'docs/MACHINE_MANIFEST.md']) {
  assert(existsSync(resolve(root, path)), `Missing ${path}`);
}
console.log('PASS — Valid machine hierarchy, six actual independent GLB mesh nodes, local asset mapping.');
console.log('NOTE — A full Vite build and browser test are still necessary.');
