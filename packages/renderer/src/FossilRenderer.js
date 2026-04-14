// packages/renderer/src/FossilRenderer.js
// Manages fossil cell rendering with alpha-decay over 30 days.
// Uses a separate InstancedMesh from live cells.
import * as THREE from 'three';

export class FossilRenderer {
  constructor(scene, maxFossils = 50000) {
    this.scene      = scene;
    this.maxFossils = maxFossils;
    this._mesh      = null;
  }

  init(cols, rows) {
    this.cols = cols;
    this.rows = rows;
    const geo = new THREE.PlaneGeometry(
      (2 * Math.PI) / cols * 0.85,
      Math.PI       / rows * 0.85
    );
    const mat = new THREE.MeshBasicMaterial({
      transparent: true, depthTest: false, depthWrite: false,
    });
    this._mesh = new THREE.InstancedMesh(geo, mat, this.maxFossils);
    this._mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this._mesh.count = 0;
    this.scene.add(this._mesh);
  }

  // fossils: [{ row, col, decayDay, color }]
  update(fossils) {
    if (!this._mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    let count = 0;

    for (const f of fossils) {
      if (count >= this.maxFossils) break;
      const alpha = fossilAlpha(f.decayDay);
      if (alpha <= 0) continue;

      const phi   = (f.row / this.rows) * Math.PI;
      const theta = (f.col / this.cols) * Math.PI * 2;
      dummy.position.set(
        1.001 * Math.sin(phi) * Math.cos(theta),
        1.001 * Math.cos(phi),
        1.001 * Math.sin(phi) * Math.sin(theta)
      );
      dummy.lookAt(0, 0, 0);
      dummy.rotateX(Math.PI);
      dummy.updateMatrix();
      this._mesh.setMatrixAt(count, dummy.matrix);

      color.set(f.color || '#888888');
      color.multiplyScalar(alpha);
      this._mesh.setColorAt(count, color);
      count++;
    }

    this._mesh.count = count;
    this._mesh.instanceMatrix.needsUpdate = true;
    if (this._mesh.instanceColor) this._mesh.instanceColor.needsUpdate = true;
  }

  dispose() {
    if (this._mesh) this.scene.remove(this._mesh);
    this._mesh?.geometry.dispose();
    this._mesh?.material.dispose();
  }
}

function fossilAlpha(decayDay) {
  if (decayDay >= 30) return 0;
  return 1 - (decayDay / 30);
}
