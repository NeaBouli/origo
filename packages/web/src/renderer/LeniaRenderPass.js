// LeniaRenderPass.js
// Phase 1 — Lenia as rendering aesthetic only.
// Conway remains the canonical engine. This pass reads the binary
// Conway grid from Zustand and outputs a smooth, organic float32
// texture via a WebGL ShaderMaterial. Zero server-side cost.
//
// Controlled by feature flag: VITE_LENIA_RENDER=true
// Toggled at runtime via faction HUD switch.

import * as THREE from 'three';
import { GRID_COLS, GRID_ROWS } from '@origo/core/src/constants.js';

// Gaussian kernel radius — tunable. R=3 gives organic fluid look.
const DEFAULT_KERNEL_RADIUS = 3;
const DEFAULT_SIGMA         = 1.2;

// ORIGO color ramp: dark void → teal → gold → white core
const LENIA_COLORS = [
  [0.02, 0.04, 0.10],  // 0.0 — void
  [0.04, 0.30, 0.40],  // 0.3 — teal
  [0.79, 0.66, 0.30],  // 0.7 — gold
  [0.95, 0.92, 0.85],  // 1.0 — white core
];

// ── WebGL Shader sources ──────────────────────────────────────────────────────

const LENIA_VERT = /* glsl */`
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// Fragment shader: Gaussian convolution over the Conway grid texture,
// then maps the continuous result to the ORIGO color ramp.
const LENIA_FRAG = /* glsl */`
precision highp float;

uniform sampler2D uConwayTex;   // binary Conway grid (R channel: 0 or 1)
uniform vec2      uGridSize;    // vec2(COLS, ROWS)
uniform float     uSigma;       // Gaussian sigma
uniform int       uRadius;      // kernel radius
uniform float     uTime;        // for subtle animation
uniform float     uAlpha;       // global opacity (blend with binary mode)

varying vec2 vUv;

// ORIGO 4-stop color ramp
vec3 leniaColor(float t) {
  vec3 c0 = vec3(0.02, 0.04, 0.10);
  vec3 c1 = vec3(0.04, 0.30, 0.40);
  vec3 c2 = vec3(0.79, 0.66, 0.30);
  vec3 c3 = vec3(0.95, 0.92, 0.85);
  if (t < 0.33) return mix(c0, c1, t / 0.33);
  if (t < 0.66) return mix(c1, c2, (t - 0.33) / 0.33);
  return mix(c2, c3, (t - 0.66) / 0.34);
}

void main() {
  vec2 texel = 1.0 / uGridSize;
  float sum    = 0.0;
  float weight = 0.0;
  int R = uRadius;

  // 2D Gaussian convolution (separable for performance)
  for (int dy = -R; dy <= R; dy++) {
    for (int dx = -R; dx <= R; dx++) {
      float dist2 = float(dx*dx + dy*dy);
      float w     = exp(-dist2 / (2.0 * uSigma * uSigma));
      vec2  coord = vUv + vec2(float(dx), float(dy)) * texel;
      float cell  = texture2D(uConwayTex, coord).r;
      sum    += cell * w;
      weight += w;
    }
  }

  float lenia = sum / weight;

  // Subtle pulse on living cells
  float pulse = 1.0 + 0.04 * sin(uTime * 2.5 + lenia * 6.28);
  lenia = clamp(lenia * pulse, 0.0, 1.0);

  vec3  col = leniaColor(lenia);
  float a   = lenia > 0.05 ? uAlpha : 0.0;

  gl_FragColor = vec4(col, a);
}
`;

// ── LeniaRenderPass ───────────────────────────────────────────────────────────

export class LeniaRenderPass {
  /**
   * @param {THREE.Scene}    scene     — Three.js scene to add mesh to
   * @param {THREE.Camera}   camera    — not used directly, kept for API symmetry
   * @param {number}         cols      — grid width
   * @param {number}         rows      — grid height
   */
  constructor(scene, camera, cols = GRID_COLS, rows = GRID_ROWS) {
    this.scene    = scene;
    this.cols     = cols;
    this.rows     = rows;
    this.enabled  = false;
    this.alpha    = 0.88;    // blend opacity
    this.radius   = DEFAULT_KERNEL_RADIUS;
    this.sigma    = DEFAULT_SIGMA;
    this._time    = 0;
    this._mesh    = null;
    this._texture = null;
    this._mat     = null;

    // Raw float32 texture data — one value per cell (R channel only)
    this._texData = new Float32Array(cols * rows * 4);
  }

  /** Build the Three.js overlay quad and ShaderMaterial. */
  init() {
    // DataTexture — updated every time the Conway grid changes
    this._texture = new THREE.DataTexture(
      this._texData,
      this.cols,
      this.rows,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    this._texture.needsUpdate = true;
    this._texture.magFilter   = THREE.LinearFilter;
    this._texture.minFilter   = THREE.LinearFilter;
    this._texture.wrapS       = THREE.RepeatWrapping;
    this._texture.wrapT       = THREE.RepeatWrapping;

    this._mat = new THREE.ShaderMaterial({
      vertexShader:   LENIA_VERT,
      fragmentShader: LENIA_FRAG,
      uniforms: {
        uConwayTex: { value: this._texture },
        uGridSize:  { value: new THREE.Vector2(this.cols, this.rows) },
        uSigma:     { value: this.sigma },
        uRadius:    { value: this.radius },
        uTime:      { value: 0 },
        uAlpha:     { value: this.alpha },
      },
      transparent: true,
      depthTest:   false,
      depthWrite:  false,
    });

    // Overlay sphere slightly larger than planet (1.003) so it wraps it
    const geo  = new THREE.SphereGeometry(1.003, 128, 64);
    this._mesh = new THREE.Mesh(geo, this._mat);
    this._mesh.visible = false;
    this.scene.add(this._mesh);

    console.log('[LeniaRenderPass] Initialized — feature flag:', this.enabled);
  }

  /**
   * Called every animation frame from UniverseRenderer._animate().
   * @param {number} dt  — delta time in seconds
   */
  tick(dt) {
    if (!this._mat) return;
    this._time += dt;
    this._mat.uniforms.uTime.value  = this._time;
    this._mat.uniforms.uAlpha.value = this.alpha;
  }

  /**
   * Update the texture from the current Conway binary grid.
   * Call this whenever the grid changes (after delta apply).
   * @param {Uint8Array} grid         — flat Uint8Array, value = factionId (0=dead)
   * @param {Object}     factionColors — { factionId: '#hex' }
   * @param {number}     myFactionId
   */
  updateGrid(grid, factionColors, myFactionId) {
    if (!this._texture || !this.enabled) return;

    const data = this._texData;
    const cols = this.cols;
    const rows = this.rows;

    for (let i = 0; i < cols * rows; i++) {
      const fid   = grid[i];
      const alive = fid !== 0 ? 1.0 : 0.0;
      // R channel = cell alive (used by shader for convolution)
      data[i * 4]     = alive;
      // G channel = own faction boost (slightly brighter in shader)
      data[i * 4 + 1] = (fid === myFactionId) ? 1.0 : 0.0;
      data[i * 4 + 2] = 0.0;
      data[i * 4 + 3] = alive;
    }

    this._texture.needsUpdate = true;
  }

  /** Enable or disable the pass. */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (this._mesh) this._mesh.visible = enabled;
    console.log('[LeniaRenderPass] Enabled:', enabled);
  }

  /** Adjust kernel sigma at runtime. */
  setSigma(sigma) {
    this.sigma = sigma;
    if (this._mat) this._mat.uniforms.uSigma.value = sigma;
  }

  /** Adjust kernel radius at runtime (0–6). */
  setRadius(r) {
    this.radius = Math.max(1, Math.min(6, r));
    if (this._mat) this._mat.uniforms.uRadius.value = this.radius;
  }

  dispose() {
    this._texture?.dispose();
    this._mat?.dispose();
    if (this._mesh) this.scene.remove(this._mesh);
  }
}
