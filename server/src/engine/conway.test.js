import { ConwayEngine, PATTERNS } from './conway.js';

test('determinism: same seed → same output', () => {
  const e1 = new ConwayEngine(50, 50);
  const e2 = new ConwayEngine(50, 50);
  e1.seed(PATTERNS.glider, 5, 5, 1);
  e2.seed(PATTERNS.glider, 5, 5, 1);
  for (let i = 0; i < 100; i++) { e1.tick(); e2.tick(); }
  expect(Array.from(e1.grid)).toEqual(Array.from(e2.grid));
});

test('glider: survives 4 ticks', () => {
  const e = new ConwayEngine(20, 20);
  e.seed(PATTERNS.glider, 1, 1, 1);
  const before = e.grid.reduce((a, v) => a + (v > 0 ? 1 : 0), 0);
  for (let i = 0; i < 4; i++) e.tick();
  const after = e.grid.reduce((a, v) => a + (v > 0 ? 1 : 0), 0);
  expect(after).toBe(before);
});

test('torus wrap: cell at edge reappears opposite', () => {
  const e = new ConwayEngine(10, 10);
  e.set(0, 0, 1); e.set(0, 9, 1);
  expect(e.get(0, 9)).toBe(1);
});

test('majority faction wins birth', () => {
  const e = new ConwayEngine(10, 10);
  e.set(1, 0, 2); e.set(1, 1, 2); e.set(1, 2, 2);
  e.tick();
  const counts = {};
  for (let i = 0; i < 100; i++) {
    const v = e.grid[i];
    if (v) counts[v] = (counts[v]||0) + 1;
  }
  expect(counts[2]).toBeGreaterThan(0);
});

test('performance: 100x100 grid 1000 ticks < 5s', () => {
  const e = new ConwayEngine(100, 100);
  e.seed(PATTERNS.rpentomino, 40, 40, 1);
  const start = Date.now();
  for (let i = 0; i < 1000; i++) e.tick();
  expect(Date.now() - start).toBeLessThan(5000);
});
