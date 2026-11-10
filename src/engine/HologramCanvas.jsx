import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { createHologramMaterials } from './hologramMaterials.js';
import { createAtmosphere, createScanSlice } from './sceneEffects.js';
import { disposeObjectTree, loadGlbAssembly } from './assetManager.js';
import { HandActionController } from '../hand/handActionController.js';

const DEFAULT_CAMERA = [6.8, 3.7, 7.6];
const PIXEL_RATIO_CAPS = { eco: 1, balanced: 1.35, detail: 1.65 };
const DEFAULT_EFFECTS = { bloom: true, particles: true, scan: true };

function buildDemo(machineId, mode, scanEnabled) {
  const root = new THREE.Group();
  const fx = createHologramMaterials(mode, scanEnabled);
  root.userData.fx = fx;
  const part = (geometry, position, options = {}) => {
    const mesh = new THREE.Mesh(geometry, options.bright ? fx.accent : fx.surface);
    mesh.position.set(...position);
    if (options.rotation) mesh.rotation.set(...options.rotation);
    const edgeGeometry = new THREE.EdgesGeometry(geometry, 22);
    mesh.add(new THREE.LineSegments(edgeGeometry, options.bright ? fx.accentLines : fx.lines));
    root.add(mesh);
    return mesh;
  };

  if (machineId === 'car') {
    part(new THREE.BoxGeometry(4.9, 0.78, 1.9), [0, 0, 0]);
    part(new THREE.BoxGeometry(2.4, 0.82, 1.55), [-0.3, 0.72, 0]);
    part(new THREE.BoxGeometry(0.86, 0.10, 1.62), [1.68, 0.45, 0], { bright: true });
    part(new THREE.BoxGeometry(0.72, 0.20, 1.55), [-2.07, -0.34, 0]);
    for (const x of [-1.58, 1.58]) {
      for (const z of [-1.06, 1.06]) {
        part(new THREE.CylinderGeometry(0.51, 0.51, 0.22, 32), [x, -0.48, z], { rotation: [Math.PI / 2, 0, 0], bright: true });
        part(new THREE.TorusGeometry(0.35, 0.036, 7, 32), [x, -0.48, z > 0 ? z + 0.14 : z - 0.14], { bright: true });
        part(new THREE.CylinderGeometry(0.13, 0.13, 0.27, 12), [x, -0.48, z], { rotation: [Math.PI / 2, 0, 0] });
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
      part(new THREE.TorusGeometry(0.29, 0.025, 6, 28), [0.1, y, -0.82], { bright: true });
      part(new THREE.CylinderGeometry(0.08, 0.08, 0.1, 12), [0.1, y, -0.82], { rotation: [Math.PI / 2, 0, 0] });
    }
  } else {
    part(new THREE.BoxGeometry(1.67, 3.3, 0.22), [0, 0, 0]);
    part(new THREE.BoxGeometry(1.5, 2.95, 0.035), [0, 0, 0.14], { bright: true });
    part(new THREE.BoxGeometry(0.85, 1.15, 0.08), [0, -0.55, -0.17]);
    for (const [x, y] of [[-0.47, 1.1], [-0.47, 0.69], [-0.05, 1.1]]) {
      part(new THREE.CylinderGeometry(0.18, 0.18, 0.08, 24), [x, y, -0.21], { rotation: [Math.PI / 2, 0, 0], bright: true });
    }
  }

  const scanSlice = createScanSlice();
  scanSlice.visible = scanEnabled;
  root.add(scanSlice);
  root.userData.scanSlice = scanSlice;
  return root;
}


export default function HologramCanvas({
  machineId, mode, autoRotate, resetToken, quality, effects = DEFAULT_EFFECTS,
  asset = null, parts = [], selectedPartId = null, onPartSelect,
  onFps, onPerformance, onReady, onError, onProgress,
  gestureFrameRef = null, handControlEnabled = false,
}) {
  const hostRef = useRef(null);
  const runtimeRef = useRef(null);
  const callbacksRef = useRef({ onFps, onPerformance, onReady, onError, onProgress, onPartSelect });
  callbacksRef.current = { onFps, onPerformance, onReady, onError, onProgress, onPartSelect };

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#03101d');
    scene.fog = new THREE.FogExp2('#03101d', 0.024);
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(...DEFAULT_CAMERA);
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
    } catch (error) {
      callbacksRef.current.onError?.(error.message || 'WebGL initialization failed');
      return undefined;
    }
    renderer.setClearColor('#03101d');
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    host.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label', 'Interactive 3D machine preview');
    const onContextLost = event => {
      event.preventDefault();
      callbacksRef.current.onError?.('WebGL context lost. Reload the page to restore the 3D viewer.');
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    const handCursor = document.createElement('div');
    handCursor.className = 'hand-viewport-cursor';
    handCursor.setAttribute('aria-hidden', 'true');
    const handCursorLabel = document.createElement('span');
    handCursorLabel.className = 'hand-cursor-label';
    handCursor.appendChild(handCursorLabel);
    host.appendChild(handCursor);
    const handStatus = document.createElement('div');
    handStatus.className = 'hand-viewport-status';
    handStatus.setAttribute('aria-hidden', 'true');
    host.appendChild(handStatus);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.065;
    controls.minDistance = 2.8;
    controls.maxDistance = 22;
    controls.autoRotateSpeed = 0.55;
    controls.target.set(0, 0, 0);

    const atmosphere = createAtmosphere(scene);
    let running = true;
    let frameId = null;
    let frameCount = 0;
    let lastFps = performance.now();
    let lastAnimationAt = null;
    const frameDeltas = [];
    let width = 1;
    let height = 1;
    let composer = null;
    let bloomPass = null;
    let options = { quality: 'balanced', bloom: true, particles: true, scan: true };

    function disposeComposer() {
      if (composer) composer.dispose();
      composer = null;
      bloomPass = null;
    }

    function configurePipeline() {
      atmosphere.setOptions(options.quality, options.particles);
      // Eco never creates expensive fullscreen bloom buffers.
      if (!options.bloom || options.quality === 'eco') {
        disposeComposer();
        return;
      }
      if (!composer) {
        try {
          composer = new EffectComposer(renderer);
          composer.addPass(new RenderPass(scene, camera));
          bloomPass = new UnrealBloomPass(new THREE.Vector2(width, height), 0.35, 0.24, 0.46);
          composer.addPass(bloomPass);
          composer.addPass(new OutputPass());
        } catch (error) {
          console.warn('Bloom unavailable; continuing with standard rendering.', error);
          disposeComposer();
          return;
        }
      }
      bloomPass.strength = options.quality === 'detail' ? 0.66 : 0.28;
      bloomPass.radius = options.quality === 'detail' ? 0.34 : 0.18;
      bloomPass.threshold = options.quality === 'detail' ? 0.42 : 0.53;
      // Bloom at reduced internal pixel density avoids high-resolution
      // postprocessing across a full MacBook Retina display.
      composer.setPixelRatio(Math.min(renderer.getPixelRatio(), options.quality === 'detail' ? 1.3 : 0.9));
      composer.setSize(width, height);
    }

    function resetCamera() {
      camera.position.set(...(runtimeRef.current?.isAssembly ? [0, 1.0, 6.5] : DEFAULT_CAMERA));
      controls.target.set(0, 0, 0);
      controls.update();
    }
    function resize() {
      if (!running) return;
      width = Math.max(1, host.clientWidth);
      height = Math.max(1, host.clientHeight);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height, false);
      if (composer) composer.setSize(width, height);
    }
    function applySettings(nextOptions) {
      options = nextOptions;
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, PIXEL_RATIO_CAPS[options.quality] || 1.35));
      resize();
      configurePipeline();
    }

    const runtime = {
      scene, camera, controls, renderer, atmosphere,
      model: null, isAssembly: false, currentMode: mode, currentScan: effects.scan !== false,
      currentSelectedPart: selectedPartId, resetCamera, applySettings, resize,
      handController: new HandActionController(), handEnabled: handControlEnabled,
      handFrameRef: gestureFrameRef, wantAutoRotate: autoRotate,
      zoomTargetDistance: null, zoomAnchorDistance: null, hoveredId: null, hoverOutline: null,
      latestGestureAge: null,
    };
    runtimeRef.current = runtime;
    const started = performance.now();

    // Shared normalized pick helper for mouse and webcam input.
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function hitAt(x, y) {
      if (!runtime.model?.userData?.setSelectedPart) return null;
      pointer.set(x * 2 - 1, 1 - y * 2);
      raycaster.setFromCamera(pointer, camera);
      return raycaster.intersectObject(runtime.model, true)
        .find(h => h.object.isMesh && h.object.userData.partId) || null;
    }
    function clearHover() {
      if (runtime.hoverOutline) {
        scene.remove(runtime.hoverOutline);
        runtime.hoverOutline.geometry.dispose();
        runtime.hoverOutline.material.dispose();
        runtime.hoverOutline = null;
      }
      runtime.hoveredId = null;
    }
    function updateHover(hit) {
      const id = hit?.object?.userData?.partId || null;
      if (id === runtime.hoveredId) return;
      clearHover();
      runtime.hoveredId = id;
      if (hit) {
        runtime.hoverOutline = new THREE.BoxHelper(hit.object, 0x87f9ff);
        runtime.hoverOutline.material.depthTest = false;
        runtime.hoverOutline.renderOrder = 900;
        scene.add(runtime.hoverOutline);
      }
    }
    function rotateFromHand({ dx, dy }) {
      const offset = camera.position.clone().sub(controls.target);
      const orbit = new THREE.Spherical().setFromVector3(offset);
      orbit.theta -= dx * 3.35;
      orbit.phi = THREE.MathUtils.clamp(orbit.phi + dy * 2.65, 0.16, Math.PI - 0.16);
      camera.position.copy(new THREE.Vector3().setFromSpherical(orbit).add(controls.target));
      camera.lookAt(controls.target);
      controls.update();
    }
    function panFromHand({ dx, dy }) {
      camera.updateMatrixWorld();
      const distance = camera.position.distanceTo(controls.target);
      const right = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 0);
      const up = new THREE.Vector3().setFromMatrixColumn(camera.matrixWorld, 1);
      const offset = right.multiplyScalar(-dx * distance * 1.3)
        .add(up.multiplyScalar(dy * distance * 1.3));
      controls.target.add(offset);
      camera.position.add(offset);
      controls.update();
    }
    function applyHandFrame(now) {
      const frame = runtime.handEnabled ? runtime.handFrameRef?.current : null;
      if (!frame || !Array.isArray(frame.hands) || !frame.hands.length ||
          now - frame.timestamp > 320 || document.hidden) {
        if (runtime.latestGestureAge !== null) runtime.handController.reset();
        runtime.latestGestureAge = null;
        runtime.zoomAnchorDistance = null;
        runtime.zoomTargetDistance = null;
        handCursor.style.display = 'none';
        handStatus.style.display = 'none';
        clearHover();
        return false;
      }
      const action = runtime.handController.consume(frame, now);
      runtime.latestGestureAge = Math.max(0, now - frame.timestamp);
      if (!action.fresh) return true;
      const messages = { point: 'POINT · AIM', pinch: 'PINCH · RELEASE TO SELECT', orbit: 'FIST · ROTATE',
        pan: 'OPEN PALM · PAN', zoom: 'TWO HANDS · ZOOM', idle: 'HAND DETECTED' };
      handStatus.textContent = messages[action.mode] || 'HAND DETECTED';
      handStatus.style.display = 'block';
      if (action.cursor && action.mode !== 'zoom') {
        handCursor.style.display = 'block';
        handCursor.style.left = `${action.cursor.x * 100}%`;
        handCursor.style.top = `${action.cursor.y * 100}%`;
        handCursor.dataset.mode = action.mode;
        const hit = action.mode === 'point' || action.mode === 'pinch'
          ? hitAt(action.cursor.x, action.cursor.y) : null;
        updateHover(hit);
        handCursorLabel.textContent = hit?.object?.userData?.partId ||
          (action.mode === 'pinch' ? 'Release to select' : action.mode === 'point' ? 'Aim at a named part' : messages[action.mode]);
      } else { handCursor.style.display = 'none'; clearHover(); }
      if (action.select) {
        const hit = hitAt(action.select.x, action.select.y);
        if (hit) callbacksRef.current.onPartSelect?.(hit.object.userData.partId);
      }
      if (action.orbit) rotateFromHand(action.orbit);
      if (action.pan) panFromHand(action.pan);
      if (action.zoom != null) {
        if (action.startedZoom || runtime.zoomAnchorDistance == null)
          runtime.zoomAnchorDistance = camera.position.distanceTo(controls.target);
        runtime.zoomTargetDistance = THREE.MathUtils.clamp(runtime.zoomAnchorDistance / action.zoom,
          controls.minDistance, controls.maxDistance);
      } else { runtime.zoomTargetDistance = null; runtime.zoomAnchorDistance = null; }
      return true;
    }

    function animate(now) {
      if (!running) return;
      frameId = requestAnimationFrame(animate);
      if (document.hidden) {
        frameCount = 0;
        frameDeltas.length = 0;
        lastFps = now;
        lastAnimationAt = null;
        return;
      }
      const time = (now - started) / 1000;
      if (lastAnimationAt != null) {
        const delta = now - lastAnimationAt;
        if (delta > 0 && delta < 200) frameDeltas.push(delta);
      }
      lastAnimationAt = now;
      const handActive = applyHandFrame(now);
      controls.autoRotate = runtime.wantAutoRotate && !handActive && !runtime.isAssembly;
      if (runtime.zoomTargetDistance != null) {
        const direction = camera.position.clone().sub(controls.target);
        const nextDistance = THREE.MathUtils.lerp(direction.length(), runtime.zoomTargetDistance, 0.28);
        direction.setLength(nextDistance);
        camera.position.copy(controls.target).add(direction);
      }
      controls.update();
      atmosphere.update(time);
      if (runtime.model) {
        runtime.model.userData.fx.update(time);
        if (runtime.model.userData.scanSlice.visible) {
          runtime.model.userData.scanSlice.position.y = Math.sin(time * 0.68) * 1.30;
        }
      }
      if (composer) composer.render();
      else renderer.render(scene, camera);
      frameCount += 1;
      if (now - lastFps >= 1100) {
        const fps = Math.round(frameCount * 1000 / (now - lastFps));
        const sorted = [...frameDeltas].sort((a, b) => a - b);
        const avg = frameDeltas.reduce((sum, ms) => sum + ms, 0) / Math.max(frameDeltas.length, 1);
        const p95 = sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] || 0;
        callbacksRef.current.onFps?.(fps);
        callbacksRef.current.onPerformance?.({
          fps, avgFrameMs: Number(avg.toFixed(1)), p95FrameMs: Number(p95.toFixed(1)),
          drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
          quality: options.quality, gestureAgeMs: runtime.latestGestureAge == null ? null : Math.round(runtime.latestGestureAge),
        });
        frameCount = 0;
        frameDeltas.length = 0;
        lastFps = now;
      }
    }

    // Mouse click and webcam selection use the same GLB mesh raycast.
    let pointerOrigin = null;
    const onPointerDown = event => { if (event.button === 0) pointerOrigin = { x: event.clientX, y: event.clientY }; };
    const onPointerUp = event => {
      if (!pointerOrigin || event.button !== 0) return;
      const travelled = Math.hypot(event.clientX - pointerOrigin.x, event.clientY - pointerOrigin.y);
      pointerOrigin = null;
      if (travelled > 6 || !runtime.model?.userData?.setSelectedPart) return;
      const rect = renderer.domElement.getBoundingClientRect();
      const hit = hitAt((event.clientX - rect.left) / rect.width,
        (event.clientY - rect.top) / rect.height);
      callbacksRef.current.onPartSelect?.(hit?.object.userData.partId || null);
    };
    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const observer = new ResizeObserver(resize);
    observer.observe(host);
    resize();
    frameId = requestAnimationFrame(animate);

    return () => {
      running = false;
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      clearHover();
      handCursor.remove();
      handStatus.remove();
      disposeComposer();
      disposeObjectTree(scene);
      renderer.dispose();
      renderer.domElement.remove();
      runtimeRef.current = null;
    };
  }, []);

  // Loads only the selected subsystem GLB. Every request can be aborted;
  // async parse results from outdated requests are discarded and disposed.
  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return undefined;
    const controller = new AbortController();
    const key = `${machineId}:${asset?.src || 'overview'}`;
    let active = true;
    runtime.handController.reset();
    runtime.zoomAnchorDistance = null;
    runtime.zoomTargetDistance = null;
    if (runtime.hoverOutline) {
      runtime.scene.remove(runtime.hoverOutline);
      runtime.hoverOutline.geometry.dispose();
      runtime.hoverOutline.material.dispose();
      runtime.hoverOutline = null;
      runtime.hoveredId = null;
    }
    if (runtime.model) {
      runtime.scene.remove(runtime.model);
      disposeObjectTree(runtime.model);
      runtime.model = null;
    }
    runtime.isAssembly = Boolean(asset?.src);
    runtime.resetCamera();
    const install = (root, meta) => {
      if (!active || controller.signal.aborted) { disposeObjectTree(root); return; }
      runtime.model = root;
      root.userData.fx.setMode(runtime.currentMode);
      root.userData.fx.setScan(runtime.currentScan);
      root.userData.scanSlice.visible = runtime.currentScan;
      root.userData.setSelectedPart?.(runtime.currentSelectedPart);
      runtime.scene.add(root);
      callbacksRef.current.onReady?.(key, meta);
    };
    if (asset?.src) {
      loadGlbAssembly({
        asset, parts, mode, scanEnabled: effects.scan !== false, signal: controller.signal,
        onProgress: status => { if (active) callbacksRef.current.onProgress?.(key, status); },
      }).then(({ root, meta }) => install(root, meta))
        .catch(error => {
          if (!active || error.name === 'AbortError') return;
          callbacksRef.current.onError?.(key, error.message || 'Could not load GLB');
        });
    } else {
      const model = buildDemo(machineId, mode, effects.scan !== false);
      install(model, { triangleCount: null, nodeNames: [], missingParts: [], bytes: 0 });
    }
    return () => { active = false; controller.abort(); };
  }, [machineId, asset?.src]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (runtime) { runtime.currentMode = mode; runtime.currentScan = effects.scan !== false; }
    const model = runtime?.model;
    if (!model) return;
    model.userData.fx.setMode(mode);
    const enabled = effects.scan !== false;
    model.userData.fx.setScan(enabled);
    model.userData.scanSlice.visible = enabled;
  }, [mode, effects.scan]);

  useEffect(() => {
    if (runtimeRef.current) runtimeRef.current.wantAutoRotate = autoRotate;
  }, [autoRotate, asset?.src]);

  useEffect(() => {
    runtimeRef.current?.applySettings({
      quality,
      bloom: effects.bloom !== false,
      particles: effects.particles !== false,
      scan: effects.scan !== false,
    });
  }, [quality, effects.bloom, effects.particles, effects.scan]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (runtime) runtime.currentSelectedPart = selectedPartId;
    runtime?.model?.userData.setSelectedPart?.(selectedPartId);
  }, [selectedPartId, asset?.src]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (runtime) { runtime.resetCamera(); runtime.handController.reset();
      runtime.zoomAnchorDistance = null; runtime.zoomTargetDistance = null; }
  }, [resetToken]);

  useEffect(() => {
    const runtime = runtimeRef.current;
    if (!runtime) return;
    runtime.handEnabled = Boolean(handControlEnabled);
    runtime.handFrameRef = gestureFrameRef;
    if (!handControlEnabled) {
      runtime.handController.reset();
      runtime.zoomAnchorDistance = null;
      runtime.zoomTargetDistance = null;
    }
  }, [handControlEnabled, gestureFrameRef]);

  return <div className="hologram-canvas" ref={hostRef} role="img" aria-label={`3D hologram of ${asset?.src ? "loaded assembly" : machineId}`}/>;
}
