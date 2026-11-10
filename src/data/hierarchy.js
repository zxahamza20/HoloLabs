// Pure, testable hierarchy utilities; no React / Three.js dependency.
export function flattenParts(parts, result = [], path = []) {
  for (const p of parts) {
    result.push({ ...p, path: [...path, p.id] });
    flattenParts(p.children || [], result, [...path, p.id]);
  }
  return result;
}

export function findPart(assembly, partId) {
  return flattenParts(assembly?.children || []).find(p => p.id === partId) || null;
}

export function getAssetAssembly(machine, assemblyId) {
  return machine?.assemblies.find(a => a.id === assemblyId && a.asset?.src) || null;
}

export function searchableNames(machine) {
  return [machine.name, machine.category, machine.description,
    ...machine.assemblies.flatMap(a => [a.name, a.summary, ...flattenParts(a.children).map(p => p.name)]),
  ].join(' ').toLowerCase();
}

export function validateLibrary(machines) {
  const errors = [];
  const machineIds = new Set();
  for (const m of machines) {
    if (!m.id || machineIds.has(m.id)) errors.push(`Invalid or duplicate machine id: ${m.id}`);
    machineIds.add(m.id);
    const ids = new Set();
    for (const a of m.assemblies || []) {
      if (!a.id || ids.has(a.id)) errors.push(`${m.id}: invalid or duplicate assembly id ${a.id}`);
      ids.add(a.id);
      const partIds = new Set();
      for (const p of flattenParts(a.children || [])) {
        if (!p.id || partIds.has(p.id)) errors.push(`${m.id}/${a.id}: duplicate part id ${p.id}`);
        partIds.add(p.id);
        if (!p.name || !p.description) errors.push(`${m.id}/${a.id}/${p.id}: missing part metadata`);
        if (a.asset && !p.glbNode) errors.push(`${m.id}/${a.id}/${p.id}: missing GLB node mapping`);
      }
      if (a.asset?.format && a.asset.format !== 'glb') errors.push(`${m.id}/${a.id}: unsupported format`);
      if (a.asset?.src && !a.asset.src.startsWith('/models/')) errors.push(`${m.id}/${a.id}: asset must be local /models/...`);
    }
  }
  return errors;
}
