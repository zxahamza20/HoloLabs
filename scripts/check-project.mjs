import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { MACHINES, CATEGORIES } from '../src/data/machines.js';

const root = resolve(import.meta.dirname, '..');
const criticalFiles = [
  'index.html', 'src/main.jsx', 'src/App.jsx', 'src/styles.css',
  'src/data/machines.js', 'src/engine/HologramCanvas.jsx',
  'src/components/MachineLibrary.jsx', 'src/components/InspectorPanel.jsx',
  'src/components/Icon.jsx', 'src/components/Overlays.jsx',
  'src/utils/preferences.js',
];
criticalFiles.forEach(file => assert(existsSync(resolve(root, file)), `Missing file: ${file}`));
assert.equal(MACHINES.length, 3, 'Day 2 should include three placeholder machines');
assert.equal(new Set(MACHINES.map(m => m.id)).size, MACHINES.length, 'Machine IDs must be unique');
assert(CATEGORIES.includes('All'), 'Category All filter required');
for (const machine of MACHINES) {
  assert(machine.id && machine.name && machine.category && machine.description, `Invalid machine: ${machine.id}`);
  assert(CATEGORIES.includes(machine.category), `Missing category: ${machine.category}`);
  assert(machine.assemblies.length > 0, `No assemblies for ${machine.id}`);
  assert.equal(new Set(machine.assemblies.map(a => a.id)).size, machine.assemblies.length, `Duplicate assembly IDs for ${machine.id}`);
  for (const assembly of machine.assemblies) {
    assert(assembly.id && assembly.name && assembly.summary, `Incomplete assembly: ${assembly.id}`);
    assert(assembly.children.length, `No components defined for ${assembly.id}`);
  }
}
const bundleSource = readFileSync(resolve(root, 'src/App.jsx'), 'utf8');
assert(bundleSource.includes('HologramCanvas'), 'App must embed the 3D scene');
console.log(`PASS — ${criticalFiles.length} required files, ${MACHINES.length} machines and ${MACHINES.reduce((n,m) => n + m.assemblies.length,0)} assemblies validated.`);
console.log('NOTE — This checks file presence and metadata only; npm run build and browser testing are still needed.');
