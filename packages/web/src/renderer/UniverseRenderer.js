// UniverseRenderer.js — Lenia Phase 1 integrated
// Conway remains canonical engine. LeniaRenderPass adds visual layer only.
import * as THREE from 'three';
import { LeniaRenderPass } from './LeniaRenderPass.js';
import { GRID_COLS, GRID_ROWS } from '@origo/core/src/constants.js';

const ZOOM_LEVELS = {
  macro: { distance: 3.5, fov: 45 },
  meso:  { distance: 1.6, fov: 35 },
  micro: { distance: 0.5, fov: 25 },
};

const LENIA_ENABLED_DEFAULT = import.meta.env?.VITE_LENIA_RENDER === 'true';

export class UniverseRenderer {
  constructor(canvas) {
    this.canvas        = canvas;
    this.scene         = null;
    this.camera        = null;
    this.renderer      = null;
    this.planet        = null;
    this.cellLayer     = null;
    this.animFrame     = null;
    this.cols          = GRID_COLS;
    this.rows          = GRID_ROWS;
    this.zoom          = 'macro';
    this.factionColors = {};
    this._mouse        = new THREE.Vector2();
    this._raycaster    = new THREE.Raycaster();
    this._clock        = new THREE.Clock();
    this.leniaPass     = null;
    this.leniaMode     = LENIA_ENABLED_DEFAULT;
    this._targetDistance = undefined;
    this._targetFov      = undefined;
  }

  init() {
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;

    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
    this.renderer.setSize(w, h, false);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setClearColor(0x04060E);

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
    this.camera.position.set(0, 0, ZOOM_LEVELS.macro.distance);

    this.scene.add(new THREE.AmbientLight(0x334466, 0.8));
    const sun = new THREE.DirectionalLight(0xfff8e0, 1.4);
    sun.position.set(5, 3, 5);
    this.scene.add(sun);

    this._buildSkybox();
    this._buildPlanet();
    this._buildCellLayer();

    // Lenia Phase 1 — visual-only render pass
    this.leniaPass = new LeniaRenderPass(this.scene, this.camera, this.cols, this.rows);
    this.leniaPass.init();
    this.leniaPass.setEnabled(this.leniaMode);

    window.addEventListener('resize', () => this._onResize());
    this._setupRotation();
    this._animate();
  }

  setLeniaMode(enabled) {
    this.leniaMode = enabled;
    this.leniaPass?.setEnabled(enabled);
    if (this.cellLayer) this.cellLayer.visible = !enabled;
  }

  getLeniaMode() { return this.leniaMode; }

  updateGrid(grid, factions, myFactionId) {
    if (!this.cellLayer) return;
    for (const [id, f] of Object.entries(factions)) {
      if (!this.factionColors[id]) this.factionColors[id] = new THREE.Color(f.color);
    }
    this.leniaPass?.updateGrid(grid, this.factionColors, myFactionId);
    if (this.leniaMode) return; // skip binary cells when Lenia is on

    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let count   = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const fid = grid[r * this.cols + c];
        if (!fid) continue;
        const phi   = (r / this.rows) * Math.PI;
        const theta = (c / this.cols) * Math.PI * 2;
        dummy.position.set(
          1.002 * Math.sin(phi) * Math.cos(theta),
          1.002 * Math.cos(phi),
          1.002 * Math.sin(phi) * Math.sin(theta)
        );
        dummy.lookAt(0, 0, 0);
        dummy.rotateX(Math.PI);
        dummy.updateMatrix();
        this.cellLayer.setMatrixAt(count, dummy.matrix);
        color.copy(this.factionColors[fid] || new THREE.Color(0x888888));
        if (fid === myFactionId) color.multiplyScalar(1.5);
        this.cellLayer.setColorAt(count, color);
        if (++count >= this.cellLayer.geometry.attributes.position.count) break;
      }
    }
    this.cellLayer.count = count;
    this.cellLayer.instanceMatrix.needsUpdate = true;
    if (this.cellLayer.instanceColor) this.cellLayer.instanceColor.needsUpdate = true;
  }

  setZoom(level) {
    const t = ZOOM_LEVELS[level] || ZOOM_LEVELS.macro;
    this._targetDistance = t.distance;
    this._targetFov      = t.fov;
    this.zoom = level;
  }

  screenToCell(sx, sy) {
    if (!this.planet) return null;
    const rect = this.canvas.getBoundingClientRect();
    this._mouse.set(((sx - rect.left) / rect.width) * 2 - 1, -((sy - rect.top) / rect.height) * 2 + 1);
    this._raycaster.setFromCamera(this._mouse, this.camera);
    const hits = this._raycaster.intersectObject(this.planet);
    if (!hits.length) return null;
    const pt  = hits[0].point.normalize();
    const phi = Math.acos(pt.y);
    const th  = Math.atan2(pt.z, pt.x) + Math.PI;
    return [
      Math.min(Math.floor((phi / Math.PI)      * this.rows), this.rows - 1),
      Math.min(Math.floor((th  / (Math.PI * 2)) * this.cols), this.cols - 1),
    ];
  }

  _animate() {
    this.animFrame = requestAnimationFrame(() => this._animate());
    const dt = this._clock.getDelta();
    if (this.planet) this.planet.rotation.y += 0.0003;
    this.leniaPass?.tick(dt);
    if (this._targetDistance !== undefined) {
      const cur = this.camera.position.length();
      this.camera.position.normalize().multiplyScalar(cur + (this._targetDistance - cur) * 0.06);
    }
    if (this._targetFov !== undefined) {
      this.camera.fov += (this._targetFov - this.camera.fov) * 0.06;
      this.camera.updateProjectionMatrix();
    }
    this.renderer.render(this.scene, this.camera);
  }

  _buildSkybox() {
    const n = 8000, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const t = Math.random() * Math.PI * 2, p = Math.acos(2 * Math.random() - 1), r = 40 + Math.random() * 10;
      pos[i*3] = r*Math.sin(p)*Math.cos(t); pos[i*3+1] = r*Math.sin(p)*Math.sin(t); pos[i*3+2] = r*Math.cos(p);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    this.scene.add(new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 0.06, transparent: true, opacity: 0.8 })));
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(38,32,32), new THREE.MeshBasicMaterial({ color: 0x0a1a3a, transparent: true, opacity: 0.4, side: THREE.BackSide })));
  }

  _buildPlanet() {
    const texture = new THREE.TextureLoader().load('/textures/earth_day.jpg',
      () => console.log('[Renderer] Earth texture loaded'),
      undefined,
      () => console.warn('[Renderer] Earth texture missing')
    );
    this.planet = new THREE.Mesh(
      new THREE.SphereGeometry(1, 64, 64),
      new THREE.MeshPhongMaterial({ map: texture, specular: new THREE.Color(0x222244), shininess: 15 })
    );
    this.scene.add(this.planet);
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.02,32,32), new THREE.MeshPhongMaterial({ color: 0x4488ff, transparent: true, opacity: 0.08 })));
  }

  _buildCellLayer() {
    this.cellLayer = new THREE.InstancedMesh(
      new THREE.PlaneGeometry((2*Math.PI)/this.cols*0.9, Math.PI/this.rows*0.9),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.85, depthTest: false }),
      this.cols * this.rows
    );
    this.cellLayer.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.cellLayer.count = 0;
    this.scene.add(this.cellLayer);
  }

  _setupRotation() {
    let drag=false,px=0,py=0;
    const mv = (dx,dy) => { if(!drag||!this.planet) return; this.planet.rotation.y+=dx*0.004; this.planet.rotation.x+=dy*0.004; };
    this.canvas.addEventListener('mousedown',  e=>{drag=true;  px=e.clientX; py=e.clientY;});
    this.canvas.addEventListener('mouseup',    ()=>{drag=false;});
    this.canvas.addEventListener('mousemove',  e=>{mv(e.clientX-px,e.clientY-py); px=e.clientX; py=e.clientY;});
    this.canvas.addEventListener('touchstart', e=>{drag=true;  px=e.touches[0].clientX; py=e.touches[0].clientY;});
    this.canvas.addEventListener('touchend',   ()=>{drag=false;});
    this.canvas.addEventListener('touchmove',  e=>{mv(e.touches[0].clientX-px,e.touches[0].clientY-py); px=e.touches[0].clientX; py=e.touches[0].clientY;});
    this.canvas.addEventListener('wheel', e => {
      const d = this.camera.position.length();
      this._targetDistance = Math.max(0.3, Math.min(6, d + e.deltaY * 0.002));
    });
  }

  _onResize() {
    const w=this.canvas.clientWidth, h=this.canvas.clientHeight;
    this.camera.aspect = w/h; this.camera.updateProjectionMatrix();
    this.renderer.setSize(w,h,false);
  }

  dispose() {
    cancelAnimationFrame(this.animFrame);
    this.leniaPass?.dispose();
    this.renderer?.dispose();
  }
}
