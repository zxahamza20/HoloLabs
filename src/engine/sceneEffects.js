import * as THREE from 'three';

// Atmosphere lives outside the selected model, so switching machines never
// needs to rebuild the grid, rings, particles, or their GPU buffers.
export function createAtmosphere(scene) {
  const group = new THREE.Group();
  scene.add(group);
  const grid = new THREE.GridHelper(26, 34, 0x236e85, 0x102f43);
  grid.position.y = -2.05;
  grid.material.transparent = true;
  grid.material.opacity = 0.35;
  grid.material.depthWrite = false;
  group.add(grid);

  const rings = [];
  for (const radius of [2.8, 3.55, 4.4]) {
    const vertices = [];
    for (let i = 0; i < 128; i += 1) {
      const angle = i / 128 * Math.PI * 2;
      vertices.push(new THREE.Vector3(Math.cos(angle) * radius, -1.99, Math.sin(angle) * radius));
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(vertices);
    const material = new THREE.LineBasicMaterial({ color: 0x177b97, transparent: true, opacity: 0.36, depthWrite: false });
    const ring = new THREE.LineLoop(geometry, material);
    group.add(ring);
    rings.push(ring);
  }

  // Fixed seeded distribution avoids jumping particle patterns on remount.
  let seed = 7812;
  const random = () => {
    seed = (1664525 * seed + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const maxPoints = 560;
  const positions = new Float32Array(maxPoints * 3);
  for (let i = 0; i < maxPoints; i += 1) {
    positions[i * 3] = (random() - 0.5) * 17;
    positions[i * 3 + 1] = (random() - 0.5) * 10;
    positions[i * 3 + 2] = (random() - 0.5) * 15;
  }
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const particleMaterial = new THREE.PointsMaterial({
    color: 0x43cee7, size: 0.024, transparent: true, opacity: 0.45,
    sizeAttenuation: true, depthWrite: false,
  });
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  group.add(particles);

  let lastQuality = 'balanced';
  let particlesAllowed = true;
  function updateDensity() {
    const counts = { eco: 70, balanced: 270, detail: 560 };
    particleGeometry.setDrawRange(0, particlesAllowed ? (counts[lastQuality] || counts.balanced) : 0);
    particles.visible = particlesAllowed;
    grid.material.opacity = lastQuality === 'eco' ? 0.25 : 0.35;
  }
  updateDensity();

  return {
    group,
    update(time) {
      particles.rotation.y = Math.sin(time * 0.045) * 0.10;
      rings.forEach((ring, i) => {
        ring.material.opacity = (0.24 + Math.sin(time * (0.4 + i * 0.12) + i) * 0.07) * (lastQuality === 'eco' ? 0.72 : 1);
      });
    },
    setOptions(quality, enabled) { lastQuality = quality; particlesAllowed = enabled; updateDensity(); },
  };
}

export function createScanSlice() {
  const points = [
    [-2.7, -1.4], [2.7, -1.4], [2.7, -1.4], [2.7, 1.4],
    [2.7, 1.4], [-2.7, 1.4], [-2.7, 1.4], [-2.7, -1.4],
  ];
  const position = new Float32Array(points.flatMap(([x, z]) => [x, 0, z]));
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(position, 3));
  const material = new THREE.LineBasicMaterial({ color: 0x6bf4ff, transparent: true, opacity: 0.44, depthWrite: false });
  const slice = new THREE.LineSegments(geometry, material);
  slice.renderOrder = 2;
  return slice;
}
