// Three.js GLTFLoader sanitizes some node names (e.g. "Wheel Rim" becomes
// "Wheel_Rim") so compare canonical names, not literal glTF JSON strings.
// Node aliases must be unique within each assembly.
export function canonicalNodeName(value) {
  return String(value || '').normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu, '').toLocaleLowerCase();
}

export function buildNodeLookup(parts) {
  const lookup = new Map();
  for (const part of parts) {
    const key = canonicalNodeName(part.glbNode);
    if (!key) throw new Error(`Missing GLB node for part ${part.id}`);
    if (lookup.has(key)) throw new Error(`Ambiguous GLB mapping for ${part.glbNode}`);
    lookup.set(key, part);
  }
  return lookup;
}
