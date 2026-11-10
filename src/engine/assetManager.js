import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createHologramMaterials } from './hologramMaterials.js';
import { createScanSlice } from './sceneEffects.js';
import { flattenParts } from '../data/hierarchy.js';

// Disposing the geometry is insufficient: materials and textures also allocate
// GPU resources. The sets ensure shared resources are disposed exactly once.
export function disposeObjectTree(object) {
  if (!object) return;
  const geometry = new Set();
  const materials = new Set();
  const textures = new Set();
  object.traverse(node => {
    if (node.geometry) geometry.add(node.geometry);
    if (node.material) {
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) {
        if (material) materials.add(material);
      }
    }
  });
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if (value?.isTexture) textures.add(value);
    }
  }
  for (const g of geometry) g.dispose();
  for (const m of materials) m.dispose();
  for (const t of textures) {
    t.dispose();
    if (t.image && typeof t.image.close === 'function') t.image.close();
  }
}

export async function fetchBinary(url, signal, onProgress) {
  const response = await fetch(url, { signal, cache: 'default' });
  if (!response.ok) throw new Error(`Could not load model (HTTP ${response.status}). Check ${url}`);
  const total = Number(response.headers.get('content-length')) || null;
  if (!response.body) {
    const data = await response.arrayBuffer();
    onProgress?.({ stage: 'download', loaded: data.byteLength, total, percent: 100 });
    return data;
  }
  const reader = response.body.getReader();
  const chunks = [];
  let loaded = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
      chunks.push(value);
      loaded += value.byteLength;
      onProgress?.({ stage: 'download', loaded, total, percent: total ? Math.min(100, Math.round(loaded / total * 100)) : null });
    }
  } finally { reader.releaseLock(); }
  const buffer = new Uint8Array(loaded);
  let offset = 0;
  for (const bytes of chunks) { buffer.set(bytes, offset); offset += bytes.byteLength; }
  return buffer.buffer;
}

// Imported models retain their own named nodes. The renderer applies shared
// holographic materials; this data layer maps GLB nodes back to library parts.
export async function loadGlbAssembly({ asset, parts, mode, scanEnabled, signal, onProgress }) {
  const url = new URL(asset.src, window.location.origin).href;
  const data = await fetchBinary(url, signal, onProgress);
  if (signal.aborted) throw new DOMException('Cancelled', 'AbortError');
  onProgress?.({ stage: 'decoding', percent: null });
  const gltf = await new GLTFLoader().parseAsync(data, new URL('.', url).href);
  if (signal.aborted) {
    disposeObjectTree(gltf.scene);
    throw new DOMException('Cancelled', 'AbortError');
  }

  const root = new THREE.Group();
  const content = gltf.scene;
  root.name = 'ImportedAssembly';
  root.add(content);
  const bounds = new THREE.Box3().setFromObject(content);
  if (bounds.isEmpty()) { disposeObjectTree(root); throw new Error('GLB contains no visible geometry.'); }
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const fitScale = 3.7 / Math.max(size.x, size.y, size.z, 0.01);
  content.scale.multiplyScalar(fitScale);
  content.position.sub(center.multiplyScalar(fitScale));
  // The imported (original) glTF materials are not used in hologram mode.
  const oldMaterials = new Set();
  const oldTextures = new Set();
  const fx = createHologramMaterials(mode, scanEnabled);
  root.userData.fx = fx;
  const available = flattenParts(parts);
  const byName = new Map(available.map(p => [p.glbNode, p]));
  const found = new Set();
  let triangles = 0;
  content.traverse(object => {
    if (!object.isMesh) return;
    if (!object.geometry.attributes.normal) object.geometry.computeVertexNormals();
    const part = byName.get(object.name);
    if (part) { object.userData.partId = part.id; found.add(part.id); }
    const originals = Array.isArray(object.material) ? object.material : [object.material];
    for (const m of originals) if (m) oldMaterials.add(m);
    object.material = fx.surface;
    const indexCount = object.geometry.index?.count || object.geometry.attributes.position?.count || 0;
    triangles += Math.floor(indexCount / 3);
    // Edge extraction is capped; heavy production meshes can use cheaper LODs.
    if (indexCount < 135000) {
      const lines = new THREE.LineSegments(new THREE.EdgesGeometry(object.geometry, 28), fx.lines);
      lines.name = `Edges_${object.name}`;
      lines.raycast = () => {}; // only meshes may be selected
      object.add(lines);
    }
  });
  for (const material of oldMaterials) {
    for (const property of Object.values(material)) if (property?.isTexture) oldTextures.add(property);
    material.dispose();
  }
  for (const texture of oldTextures) {
    texture.dispose();
    if (texture.image && typeof texture.image.close === 'function') texture.image.close();
  }
  const scanSlice = createScanSlice();
  scanSlice.visible = scanEnabled;
  root.add(scanSlice);
  root.userData.scanSlice = scanSlice;
  root.userData.selectedMeshes = [];
  root.userData.setSelectedPart = id => {
    root.userData.selectedMeshes.forEach(mesh => { mesh.material = fx.surface; for (const c of mesh.children) if (c.isLineSegments) c.material = fx.lines; });
    const selected = [];
    if (id) content.traverse(node => {
      if (node.isMesh && node.userData.partId === id) {
        node.material = fx.accent;
        for (const c of node.children) if (c.isLineSegments) c.material = fx.accentLines;
        selected.push(node);
      }
    });
    root.userData.selectedMeshes = selected;
  };
  return { root, meta: {
    triangleCount: triangles,
    nodeNames: [...new Set(available.filter(p => found.has(p.id)).map(p => p.name))],
    missingParts: available.filter(p => !found.has(p.id)).map(p => p.name),
    bytes: data.byteLength,
  } };
}
