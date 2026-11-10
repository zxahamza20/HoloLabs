import * as THREE from 'three';

// Shared shader uniforms keep surface updates to O(1) per animation frame.
const vertexShader = /* glsl */ `
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorldPosition = world.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uWireframe;
  uniform float uAccent;
  uniform float uScanEnabled;
  varying vec3 vWorldPosition;
  varying vec3 vWorldNormal;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 V = normalize(cameraPosition - vWorldPosition);
    float fresnel = pow(1.0 - abs(dot(N, V)), 2.2);
    float band = pow(max(0.0, sin(vWorldPosition.y * 16.0 - uTime * 2.5)), 18.0);
    float slowPulse = 0.83 + 0.17 * sin(uTime * 1.5);
    vec3 base = mix(vec3(0.035, 0.36, 0.55), vec3(0.15, 0.87, 1.0), fresnel);
    base += vec3(0.06, 0.31, 0.37) * band * uScanEnabled;
    float opacity = (0.10 + 0.26 * fresnel + 0.08 * band * uScanEnabled) * slowPulse;
    opacity *= mix(1.0, 1.38, uAccent);
    opacity *= mix(1.0, 0.17, uWireframe);
    gl_FragColor = vec4(base * mix(1.0, 1.45, uAccent), clamp(opacity, 0.0, 0.82));
  }
`;

export function createHologramMaterials(mode, scanEnabled) {
  const time = { value: 0 };
  const wireframe = { value: mode === 'wireframe' ? 1 : 0 };
  const scan = { value: scanEnabled ? 1 : 0 };
  const surface = new THREE.ShaderMaterial({
    vertexShader, fragmentShader,
    uniforms: { uTime: time, uWireframe: wireframe, uScanEnabled: scan, uAccent: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.FrontSide,
  });
  const accent = surface.clone();
  // Clone shares shader program but not uniforms; explicitly share animated values.
  accent.uniforms.uTime = time;
  accent.uniforms.uWireframe = wireframe;
  accent.uniforms.uScanEnabled = scan;
  accent.uniforms.uAccent.value = 1;
  const lines = new THREE.LineBasicMaterial({ color: 0x20d5eb, transparent: true, opacity: mode === 'wireframe' ? 0.94 : 0.76, depthWrite: false });
  const accentLines = new THREE.LineBasicMaterial({ color: 0x9afaff, transparent: true, opacity: mode === 'wireframe' ? 1 : 0.95, depthWrite: false });

  return {
    surface, accent, lines, accentLines,
    update(elapsed) { time.value = elapsed; },
    setMode(nextMode) {
      wireframe.value = nextMode === 'wireframe' ? 1 : 0;
      lines.opacity = nextMode === 'wireframe' ? 0.94 : 0.76;
      accentLines.opacity = nextMode === 'wireframe' ? 1 : 0.95;
    },
    setScan(enabled) { scan.value = enabled ? 1 : 0; },
  };
}
