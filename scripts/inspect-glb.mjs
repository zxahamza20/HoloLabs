import fs from 'node:fs';

const file = process.argv[2];
if (!file) {
  console.error('Usage: npm run inspect:glb -- public/models/car/overview.glb');
  process.exit(1);
}

const buffer = fs.readFileSync(file);
if (buffer.length < 20 || buffer.toString('ascii', 0, 4) !== 'glTF' || buffer.readUInt32LE(4) !== 2) {
  console.error('File is not a valid glTF 2.0 binary (.glb) header.');
  process.exit(1);
}
if (buffer.readUInt32LE(8) !== buffer.length) {
  console.error('GLB declared length does not match the file length.');
  process.exit(1);
}

let cursor = 12;
let gltf = null;
while (cursor + 8 <= buffer.length) {
  const size = buffer.readUInt32LE(cursor);
  const type = buffer.readUInt32LE(cursor + 4);
  cursor += 8;
  if (cursor + size > buffer.length) throw new Error('Corrupt GLB chunk length.');
  if (type === 0x4e4f534a) {
    gltf = JSON.parse(buffer.toString('utf8', cursor, cursor + size));
    break;
  }
  cursor += size;
}
if (!gltf) throw new Error('No JSON chunk found.');

const nodes = gltf.nodes ?? [];
const meshes = gltf.meshes ?? [];
console.log(`\nFILE: ${file}`);
console.log(`Size: ${(buffer.length / 1024 / 1024).toFixed(2)} MB`);
console.log(`Nodes: ${nodes.length}, Meshes: ${meshes.length}, Materials: ${(gltf.materials ?? []).length}`);
console.log('\nNode names and mesh assignments:');
for (let i = 0; i < nodes.length; i++) {
  const node = nodes[i];
  const mesh = node.mesh === undefined ? '-' : `${node.mesh}: ${meshes[node.mesh]?.name ?? '(unnamed mesh)'}`;
  console.log(`  ${i.toString().padStart(3, '0')} | ${String(node.name ?? '(unnamed)').padEnd(28)} | mesh ${mesh}`);
}
console.log('\nReminder: separate nodes do NOT guarantee a mechanically accurate detachable assembly.');
