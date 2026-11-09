import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

function buildDemo(machineId, mode) {
  const root = new THREE.Group();
  const faint = new THREE.MeshBasicMaterial({ color: 0x14d7ef, transparent: true, opacity: mode === 'wireframe' ? 0.012 : 0.10, depthWrite: false, side: THREE.DoubleSide });
  const bright = new THREE.MeshBasicMaterial({ color: 0x24f6ff, transparent: true, opacity: 0.24, depthWrite: false });
  const lineMaterial = new THREE.LineBasicMaterial({ color: mode === 'wireframe' ? 0x8efaff : 0x28dbe8, transparent: true, opacity: 0.82 });

  function part(geometry, position, options = {}) {
    const mesh = new THREE.Mesh(geometry, options.bright ? bright : faint);
    mesh.position.set(...position);
    if (options.rotation) mesh.rotation.set(...options.rotation);
    const lines = new THREE.LineSegments(new THREE.EdgesGeometry(geometry, 14), lineMaterial);
    mesh.add(lines);
    root.add(mesh);
    return mesh;
  }

  if (machineId === 'car') {
    part(new THREE.BoxGeometry(4.8, 0.74, 1.85), [0, 0.0, 0]);
    part(new THREE.BoxGeometry(2.55, 0.85, 1.55), [-0.24, 0.76, 0]);
    part(new THREE.BoxGeometry(0.9, 0.12, 1.6), [1.74, 0.47, 0]);
    for (const x of [-1.57, 1.57]) {
      for (const z of [-1.02, 1.02]) {
        part(new THREE.CylinderGeometry(0.49, 0.49, 0.23, 28), [x, -0.48, z], { rotation: [Math.PI / 2, 0, 0], bright: true });
        part(new THREE.CylinderGeometry(0.23, 0.23, 0.25, 20), [x, -0.48, z], { rotation: [Math.PI / 2, 0, 0] });
      }
    }
    root.position.y = 0.4;
  } else if (machineId === 'desktop') {
    part(new THREE.BoxGeometry(2.25, 3.25, 1.55), [0, 0, 0]);
    part(new THREE.BoxGeometry(1.44, 1.85, 0.08), [-0.17, 0.38, 0.81]);
    part(new THREE.BoxGeometry(1.24, 0.32, 0.14), [-0.08, 0.48, 0.9], { bright: true });
    part(new THREE.BoxGeometry(0.9, 0.5, 0.2), [0.02, -0.24, 0.92]);
    part(new THREE.BoxGeometry(1.38, 0.55, 1.05), [0, -1.21, 0]);
    for (const y of [-0.85, 0, 0.87]) {
      part(new THREE.TorusGeometry(0.29, 0.025, 6, 22), [0.1, y, -0.8]);
    }
  } else {
    part(new THREE.BoxGeometry(1.67, 3.3, 0.22), [0, 0, 0]);
    part(new THREE.BoxGeometry(1.5, 2.95, 0.035), [0, 0, 0.14], { bright: true });
    part(new THREE.BoxGeometry(0.85, 1.15, 0.08), [0, -0.55, -0.17]);
    for (const [x, y] of [[-0.47, 1.1], [-0.47, 0.69], [-0.05, 1.1]]) {
      part(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 20), [x, y, -0.21], { rotation: [Math.PI / 2, 0, 0] });
    }
  }

  return root;
}

export default function HologramCanvas({ machineId, mode, autoRotate, resetToken, onFps }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const host = containerRef.current;
    if (!host) return undefined;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040b17');
    scene.fog = new THREE.FogExp2('#040b17', 0.028);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(6.8, 3.7, 7.6);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    host.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.06;
    controls.minDistance = 3;
    controls.maxDistance = 23;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 0.55;
    controls.target.set(0, 0, 0);

    const grid = new THREE.GridHelper(24, 24, 0x15566c, 0x0a2434);
    grid.position.y = -2.1;
    grid.material.transparent = true;
    grid.material.opacity = 0.36;
    scene.add(grid);

    for (const radius of [2.8, 3.55]) {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
      const coords = curve.getPoints(100).map((point) => new THREE.Vector3(point.x, -1.96, point.y));
      const circle = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(coords), new THREE.LineBasicMaterial({ color: 0x0e6c86, transparent: true, opacity: 0.55 }));
      scene.add(circle);
    }

    const model = buildDemo(machineId, mode);
    scene.add(model);

    let frameId;
    let frameCount = 0;
    let lastFpsTime = performance.now();
    let active = true;

    function resize() {
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(host);
    resize();

    function animate(now) {
      if (!active) return;
      frameId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
      frameCount += 1;
      if (now - lastFpsTime >= 1000) {
        onFps(Math.round((frameCount * 1000) / (now - lastFpsTime)));
        lastFpsTime = now;
        frameCount = 0;
      }
    }
    frameId = requestAnimationFrame(animate);

    return () => {
      active = false;
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      controls.dispose();
      scene.traverse((node) => {
        if (node.geometry) node.geometry.dispose();
        if (node.material) {
          const materials = Array.isArray(node.material) ? node.material : [node.material];
          for (const material of materials) material.dispose();
        }
      });
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [machineId, mode, autoRotate, resetToken, onFps]);

  return <div className="hologram-canvas" ref={containerRef} role="img" aria-label={`3D holographic preview of ${machineId}`} />;
}
