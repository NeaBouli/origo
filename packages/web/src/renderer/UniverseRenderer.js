// UniverseRenderer — Three.js scene for ORIGO web client
import * as THREE from 'three';
import { GRID_COLS, GRID_ROWS } from '@origo/core/src/constants.js';

const ZOOM_LEVELS = {
  macro: { distance: 3.5, fov: 45 },
  meso:  { distance: 1.6, fov: 35 },
  micro: { distance: 0.5, fov: 25 },
};

export class UniverseRenderer {
  constructor(canvas) {
    this.canvas    = canvas;
    this.scene     = null;
    this.camera    = null;
    this.renderer  = null;
    this.planet    = null;
    this.cellLayer = null;   // InstancedMesh for cells
    this.fossils   = null;   // InstancedMesh for fossils
    this.animFrame = null;
    this.cols = GRID_COLS;
    this.rows = GRID_ROWS;
    this.zoom = 'macro';
    this.factionColors = {}; // factionId → THREE.Color
    this._mouse = new THREE.Vector2();
    this._raycaster = new THREE.Raycaster();
  }

  init() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: false,
    });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x04060E);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
    this.camera.position.set(0, 0, ZOOM_LEVELS.macro.distance);

    // Lighting
    const ambient = new THREE.AmbientLight(0x334466, 0.8);
    const sun = new THREE.DirectionalLight(0xfff8e0, 1.4);
    sun.position.set(5, 3, 5);
    this.scene.add(ambient, sun);

    // Skybox — deep space
    this._buildSkybox();

    // Planet
    this._buildPlanet();

    // Cell instance mesh
    this._buildCellLayer();

    // Resize handler
    window.addEventListener('resize', () => this._onResize());

    // Touch/drag rotation
    this._setupRotation();

    // Start render loop
    this._animate();
  }

  _buildSkybox() {
    // Procedural starfield as Points
    const count = 8000;
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi   = Math.acos(2 * Math.random() - 1);
      const r     = 40 + Math.random() * 10;
      positions[i * 3]     = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const mat = new THREE.PointsMaterial({
      color: 0xffffff, size: 0.06,
      sizeAttenuation: true, transparent: true, opacity: 0.8,
    });
    this.scene.add(new THREE.Points(geo, mat));

    // Nebula glow — large transparent sphere
    const nebula = new THREE.Mesh(
      new THREE.SphereGeometry(38, 32, 32),
      new THREE.MeshBasicMaterial({
        color: 0x0a1a3a, transparent: true, opacity: 0.4, side: THREE.BackSide,
      })
    );
    this.scene.add(nebula);
  }

  _buildPlanet() {
    const geo = new THREE.SphereGeometry(1, 64, 64);

    // Load NASA Blue Marble texture
    const loader = new THREE.TextureLoader();
    const texture = loader.load(
      '/textures/earth_day.jpg',
      () => console.log('[Renderer] Earth texture loaded'),
      undefined,
      () => {
        // Fallback: procedural planet if texture fails
        console.warn('[Renderer] Texture load failed — using procedural fallback');
        this.planet.material.color.set(0x1a4a8a);
      }
    );

    const mat = new THREE.MeshPhongMaterial({
      map:       texture,
      specular:  new THREE.Color(0x222244),
      shininess: 15,
    });

    this.planet = new THREE.Mesh(geo, mat);
    this.scene.add(this.planet);

    // Atmosphere glow
    const atmoGeo = new THREE.SphereGeometry(1.02, 32, 32);
    const atmoMat = new THREE.MeshPhongMaterial({
      color: 0x4488ff, transparent: true, opacity: 0.08, side: THREE.FrontSide,
    });
    this.scene.add(new THREE.Mesh(atmoGeo, atmoMat));
  }

  _buildCellLayer() {
    // InstancedMesh for cells — one instance per grid cell max
    const maxCells = this.cols * this.rows;
    const cellGeo  = new THREE.PlaneGeometry(
      (2 * Math.PI) / this.cols * 0.9,
      (Math.PI)     / this.rows * 0.9
    );
    const cellMat = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.85,
      depthTest: false,
    });

    this.cellLayer = new THREE.InstancedMesh(cellGeo, cellMat, maxCells);
    this.cellLayer.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.cellLayer.count = 0;
    this.scene.add(this.cellLayer);
  }

  updateGrid(grid, factions, myFactionId) {
    if (!this.cellLayer) return;

    // Build faction color cache
    for (const [id, f] of Object.entries(factions)) {
      if (!this.factionColors[id]) {
        this.factionColors[id] = new THREE.Color(f.color);
      }
    }

    const dummy    = new THREE.Object3D();
    const color    = new THREE.Color();
    let   count    = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const fid = grid[r * this.cols + c];
        if (fid === 0) continue;

        // Map (row, col) → spherical coordinates on planet surface
        const phi   = (r / this.rows) * Math.PI;
        const theta = (c / this.cols) * Math.PI * 2;
        const radius = 1.002; // slightly above surface

        dummy.position.set(
          radius * Math.sin(phi) * Math.cos(theta),
          radius * Math.cos(phi),
          radius * Math.sin(phi) * Math.sin(theta),
        );
        dummy.lookAt(0, 0, 0);
        dummy.rotateX(Math.PI); // face outward
        dummy.updateMatrix();

        this.cellLayer.setMatrixAt(count, dummy.matrix);

        // Color — own faction brighter
        const baseColor = this.factionColors[fid] || new THREE.Color(0x888888);
        if (fid === myFactionId) {
          color.copy(baseColor).multiplyScalar(1.5);
        } else {
          color.copy(baseColor);
        }
        this.cellLayer.setColorAt(count, color);

        count++;
        if (count >= this.cellLayer.geometry.attributes.position.count) break;
      }
    }

    this.cellLayer.count = count;
    this.cellLayer.instanceMatrix.needsUpdate = true;
    if (this.cellLayer.instanceColor) this.cellLayer.instanceColor.needsUpdate = true;
  }

  setZoom(level) {
    this.zoom = level;
    const target = ZOOM_LEVELS[level] || ZOOM_LEVELS.macro;
    // Smooth camera transition
    this._targetDistance = target.distance;
    this._targetFov      = target.fov;
  }

  screenToCell(screenX, screenY) {
    if (!this.renderer || !this.planet) return null;
    const rect = this.canvas.getBoundingClientRect();
    this._mouse.x =  ((screenX - rect.left)  / rect.width)  * 2 - 1;
    this._mouse.y = -((screenY - rect.top)    / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this.camera);
    const hits = this._raycaster.intersectObject(this.planet);
    if (!hits.length) return null;
    const pt  = hits[0].point.normalize();
    const phi = Math.acos(pt.y);
    const theta = Math.atan2(pt.z, pt.x) + Math.PI;
    const r = Math.floor((phi   / Math.PI)      * this.rows);
    const c = Math.floor((theta / (Math.PI * 2)) * this.cols);
    return [Math.min(r, this.rows - 1), Math.min(c, this.cols - 1)];
  }

  _animate() {
    this.animFrame = requestAnimationFrame(() => this._animate());

    // Slow planet rotation
    if (this.planet) this.planet.rotation.y += 0.0003;

    // Smooth camera zoom
    if (this._targetDistance !== undefined) {
      const curr = this.camera.position.length();
      const next = curr + (this._targetDistance - curr) * 0.06;
      this.camera.position.normalize().multiplyScalar(next);
    }
    if (this._targetFov !== undefined) {
      this.camera.fov += (this._targetFov - this.camera.fov) * 0.06;
      this.camera.updateProjectionMatrix();
    }

    this.renderer.render(this.scene, this.camera);
  }

  _setupRotation() {
    let dragging = false;
    let prevX = 0, prevY = 0;

    this.canvas.addEventListener('mousedown', e => { dragging = true; prevX = e.clientX; prevY = e.clientY; });
    this.canvas.addEventListener('mouseup',   () => { dragging = false; });
    this.canvas.addEventListener('mousemove', e => {
      if (!dragging || !this.planet) return;
      const dx = e.clientX - prevX;
      const dy = e.clientY - prevY;
      this.planet.rotation.y += dx * 0.004;
      this.planet.rotation.x += dy * 0.004;
      prevX = e.clientX; prevY = e.clientY;
    });

    // Touch
    this.canvas.addEventListener('touchstart', e => {
      dragging = true;
      prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
    });
    this.canvas.addEventListener('touchend',   () => { dragging = false; });
    this.canvas.addEventListener('touchmove',  e => {
      if (!dragging || !this.planet) return;
      const dx = e.touches[0].clientX - prevX;
      const dy = e.touches[0].clientY - prevY;
      this.planet.rotation.y += dx * 0.004;
      this.planet.rotation.x += dy * 0.004;
      prevX = e.touches[0].clientX; prevY = e.touches[0].clientY;
    });

    // Pinch zoom
    this.canvas.addEventListener('wheel', e => {
      if (!this.camera) return;
      const dist = this.camera.position.length();
      const next = Math.max(0.3, Math.min(6, dist + e.deltaY * 0.002));
      this._targetDistance = next;
    });
  }

  _onResize() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
  }

  dispose() {
    cancelAnimationFrame(this.animFrame);
    this.renderer?.dispose();
  }
}
