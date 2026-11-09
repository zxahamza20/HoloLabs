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

function disposeObjectTree(object) {
  const geometries = new Set();
  const materials = new Set();
  object.traverse((node) => {
    if (node.geometry) geometries.add(node.geometry);
    if (node.material) {
      const entries = Array.isArray(node.material) ? node.material : [node.material];
      entries.forEach(material => materials.add(material));
    }
  });
  geometries.forEach(geometry => geometry.dispose());
  materials.forEach(material => material.dispose());
}

const DEFAULT_CAMERA = [6.8, 3.7, 7.6];
const PIXEL_RATIO_CAPS = { eco: 1, balanced: 1.4, detail: 1.75 };

export default function HologramCanvas({ machineId, mode, autoRotate, resetToken, quality, onFps, onReady, onError }) {
  const hostRef = useRef(null);
  const runtimeRef = useRef(null);
  const callbacksRef = useRef({ onFps, onReady, onError });
  callbacksRef.current = { onFps, onReady, onError };

  // Only initialize WebGL once. UI interactions must not recreate the canvas.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#040d1a');
    scene.fog = new THREE.FogExp2('#040d1a', 0.027);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(...DEFAULT_CAMERA);

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    } catch (error) {
      callbacksRef.current.onError?.(error.message || 'WebGL initialization failed');
      return undefined;
    }
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D machine preview');

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 2.8;
    controls.maxDistance = 22;
    controls.autoRotateSpeed = 0.55;
    controls.target.set(0, 0, 0);

    const grid = new THREE.GridHelper(24, 24, 0x15566c, 0x09283c);
    grid.position.y = -2.1;
    grid.material.transparent = true;
    grid.material.opacity = 0.42;
    scene.add(grid);

    for (const radius of [2.8, 3.55, 4.25]) {
      const curve = new THREE.EllipseCurve(0, 0, radius, radius, 0, Math.PI * 2, false, 0);
      const coords = curve.getPoints(100).map(p => new THREE.Vector3(p.x, -1.96, p.y));
      const ring = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(coords), new THREE.LineBasicMaterial({ color: 0x0b6984, transparent: true, opacity: 0.48 }));
      scene.add(ring);
    }

    let running = true;
    let frameId;
    let frameCount = 0;
    let lastFps = performance.now();
    const runtime = { scene, camera, renderer, controls, model: null, resetCamera, resize };
    runtimeRef.current = runtime;

    function resetCamera() {
      camera.position.set(...DEFAULT_CAMERA);
      controls.target.set(0, 0, 0);
      controls.update();
    }
    function resize() {
      if (!running) return;
      const width = Math.max(1, host.clientWidth);
      const height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
    }
    function animate(now) {
      if (!running) return;
      frameId = requestAnimationFrame(animate);
      if (document.hidden) {
        lastFps = now;
        frameCount = 0;
        return;
      }
      controls.update();
      renderer.render(scene, camera);
      frameCount += 1;
      if (now - lastFps >= 1000) {
        callbacksRef.current.onFps?.(Math.round((frameCount * 1000) / (now - lastFps)));
        frameCount = 0;
        lastFps = now;
      }
    }

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    frameId = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      disposeObjectTree(scene);
      renderer.dispose();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  // Update only the model when switching machine or display mode. The canvas,
  // renderer, camera and event listeners remain alive between changes.
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return undefined;
    if (runtime.model) {
      runtime.scene.remove(runtime.model);
      disposeObjectTree(runtime.model);
    }
    runtime.model = buildDemo(machineId, mode);
    runtime.scene.add(runtime.model);
    // This callback marks completion of the synchronous procedural model build.
    // Async GLB loads will report readiness after asset decoding in Week 1 Day 4.
    const id = requestAnimationFrame(() => callbacksRef.current.onReady?.(machineId));
    return () => cancelAnimationFrame(id);
  }, [machineId, mode]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.controls.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (runtime) {
      runtime.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAPS[quality] || 1.4));
      runtime.resize();
    }
  }, [quality]);

  useEffect(() => {
    runtimeRef.current?.resetCamera();
  }, [resetToken]);

  return <div className="hologram-canvas" ref={hostRef} role="img" aria-label={`3D procedural hologram preview of ${machineId}`}/>;
}
