// packages/renderer/src/ProcGen.js
// Procedural planet texture generator using Perlin Noise.
// Used for Layer 2+ planets (Mars, alien worlds, etc.)
// No external dependencies — pure JS.

export class ProcGen {
  constructor(seed = 42) {
    this.seed = seed;
    this._p = this._buildPermutation(seed);
  }

  generateTexture(width, height, biome = 'alien') {
    const data = new Uint8ClampedArray(width * height * 4);
    const palette = BIOME_PALETTES[biome] || BIOME_PALETTES.alien;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const u = x / width;
        const v = y / height;
        const phi   = v * Math.PI;
        const theta = u * Math.PI * 2;
        const nx = Math.sin(phi) * Math.cos(theta);
        const ny = Math.sin(phi) * Math.sin(theta);
        const nz = Math.cos(phi);

        const n1 = this._noise(nx * 2, ny * 2, nz * 2);
        const n2 = this._noise(nx * 4 + 1.7, ny * 4 + 9.2, nz * 4) * 0.5;
        const n3 = this._noise(nx * 8 + 3.3, ny * 8 + 2.8, nz * 8) * 0.25;
        const val = (n1 + n2 + n3) / 1.75;

        const [r, g, b] = this._samplePalette(palette, val);
        const idx = (y * width + x) * 4;
        data[idx]     = r;
        data[idx + 1] = g;
        data[idx + 2] = b;
        data[idx + 3] = 255;
      }
    }
    return { data, width, height };
  }

  _samplePalette(palette, t) {
    const n = palette.length - 1;
    const i = Math.min(Math.floor(t * n), n - 1);
    const f = t * n - i;
    const a = palette[i];
    const b = palette[i + 1];
    return [
      Math.round(a[0] + (b[0] - a[0]) * f),
      Math.round(a[1] + (b[1] - a[1]) * f),
      Math.round(a[2] + (b[2] - a[2]) * f),
    ];
  }

  _buildPermutation(seed) {
    const p = Array.from({ length: 256 }, (_, i) => i);
    let s = seed;
    for (let i = 255; i > 0; i--) {
      s = (s * 1664525 + 1013904223) & 0xffffffff;
      const j = ((s >>> 0) % (i + 1));
      [p[i], p[j]] = [p[j], p[i]];
    }
    return [...p, ...p];
  }

  _fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
  _lerp(a, b, t) { return a + t * (b - a); }
  _grad(hash, x, y, z) {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : (h === 12 || h === 14 ? x : z);
    return ((h & 1) ? -u : u) + ((h & 2) ? -v : v);
  }

  _noise(x, y, z) {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
    const u = this._fade(x), v = this._fade(y), w = this._fade(z);
    const p = this._p;
    const A = p[X]+Y, AA = p[A]+Z, AB = p[A+1]+Z;
    const B = p[X+1]+Y, BA = p[B]+Z, BB = p[B+1]+Z;
    return this._lerp(
      this._lerp(
        this._lerp(this._grad(p[AA],x,y,z), this._grad(p[BA],x-1,y,z),u),
        this._lerp(this._grad(p[AB],x,y-1,z), this._grad(p[BB],x-1,y-1,z),u), v),
      this._lerp(
        this._lerp(this._grad(p[AA+1],x,y,z-1), this._grad(p[BA+1],x-1,y,z-1),u),
        this._lerp(this._grad(p[AB+1],x,y-1,z-1), this._grad(p[BB+1],x-1,y-1,z-1),u), v), w
    ) * 0.5 + 0.5;
  }
}

const BIOME_PALETTES = {
  earth:  [[10,40,80],[30,80,140],[60,140,60],[120,160,80],[200,190,160],[255,255,255]],
  mars:   [[60,20,10],[120,50,20],[160,80,40],[190,120,70],[210,160,100],[230,200,160]],
  alien:  [[10,5,30],[40,10,60],[80,20,100],[20,80,60],[40,160,120],[200,240,200]],
  nebula: [[5,5,20],[20,10,50],[60,20,80],[120,40,60],[180,80,40],[240,200,100]],
  void:   [[5,5,10],[10,10,20],[15,15,30],[8,20,25],[12,30,35],[20,40,50]],
};
