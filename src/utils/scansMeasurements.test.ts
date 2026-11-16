import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const html = readFileSync('public/3d/index.html', 'utf8');
const core = html.match(/\n(\/\* P360 viewer core\.[\s\S]*?)\n<\/script>/)?.[1];
if (!core) throw new Error('Active 3D core missing');
type Point = [number, number];
interface Measurement { t: string; surface?: string; p: Point[] }
interface Core {
  measure: (m: Measurement, height: number) => { len: number; area?: number };
  wall3: (base: Point, point: Point, height: number) => number[] | null;
  Player: { prototype: { _measureTap: (this: unknown, p: Point, x: number, y: number) => void; wallReference: (this: unknown) => Point | null; resetWallReference: (this: unknown) => void } };
}
function load(source: string): Core {
  const window = { P360: {} };
  runInNewContext(source, { window });
  return window.P360 as Core;
}
const bundle = JSON.parse(html.match(/id="p3-bundle">([\s\S]*?)<\/script>/)?.[1] ?? '{}') as { js: string };
// Synthetic window: wall 3 m away, sill 0.9 m and top 2 m above floor, camera 1.5 m.
const ray = (x: number, y: number): Point => [Math.atan2(x, 3) * 180 / Math.PI, Math.atan2(y - 1.5, Math.hypot(x, 3)) * 180 / Math.PI];
const base = ray(0, 0);
describe.each([['active', core], ['export', bundle.js]])('%s 360 wall measurements', (_name, source) => {
  const api = load(source);
  it('measures the 1.10 m window height without adding camera height to its raised sill', () => {
    expect(api.measure({ t: 'height', surface: 'wall', p: [base, ray(0, 0.9), ray(0, 2)] }, 1.5).len).toBeCloseTo(1.1, 8);
  });
  it('measures window width across the vertical plane, including points above the horizon', () => {
    expect(api.measure({ t: 'dist', surface: 'wall', p: [base, ray(-0.6, 2), ray(0.6, 2)] }, 1.5).len).toBeCloseTo(1.2, 8);
  });
  it('measures 1.32 square metres for a 1.20 by 1.10 window', () => {
    const m = api.measure({ t: 'area', surface: 'wall', p: [base, ray(-0.6, 0.9), ray(0.6, 0.9), ray(0.6, 2), ray(-0.6, 2)] }, 1.5);
    expect(m.area).toBeCloseTo(1.32, 8);
    expect(m.len).toBeCloseTo(4.6, 8);
  });
  it('rejects a raised sill used as a floor reference and rays behind the wall plane', () => {
    expect(api.wall3([0, 0], ray(0, 2), 1.5)).toBeNull();
    expect(api.wall3(base, [180, 20], 1.5)).toBeNull();
  });
  it('retains old floor-to-top height measurements', () => {
    expect(api.measure({ t: 'height', p: [base, ray(0, 2)] }, 1.5).len).toBeCloseTo(2, 8);
  });
  it('accepts above-horizon endpoint clicks after the reference, committing only after three clicks', () => {
    let committed = 0;
    const player = { tool: 'height', measureSurface: 'wall', draft: null, wallReference: () => null, camH: () => 1.5, toast: () => { throw new Error('Valid wall click rejected'); }, _commit: () => { committed++; }, _renderPanel: () => {}, dirty: false };
    const tap = (p: Point) => api.Player.prototype._measureTap.call(player, p, 0, 0);
    tap(base); tap(ray(0, 0.9)); expect(committed).toBe(0);
    tap(ray(0, 2)); expect(committed).toBe(1);
  });
  it('reuses the same image reference for two-click height and width and wall area', () => {
    const player = { scene: { id: 'one' }, wallRefs: {} as Record<string, Point | false>, tool: 'height', measureSurface: 'wall', draft: null as Measurement | null, wallReference: api.Player.prototype.wallReference, ypToScreen: () => null, camH: () => 1.5, toast: () => { throw new Error('Valid click rejected'); }, _renderPanel: () => {}, dirty: false, _commit() { this.draft = null; committed++; } };
    let committed = 0;
    const tap = (p: Point) => api.Player.prototype._measureTap.call(player, p, 0, 0);
    tap(base); tap(ray(0, 0.9)); tap(ray(0, 2));
    expect(committed).toBe(1);
    player.tool = 'dist'; tap(ray(-0.6, 2)); tap(ray(0.6, 2));
    expect(committed).toBe(2);
    player.tool = 'area'; tap(ray(-0.6, 0.9)); tap(ray(0.6, 0.9)); tap(ray(0.6, 2)); tap(ray(-0.6, 2));
    expect(player.draft?.p).toHaveLength(5);
    expect(api.measure(player.draft as Measurement, 1.5).area).toBeCloseTo(1.32, 8);
    player.scene = { id: 'two' }; expect(player.wallReference()).toBeNull();
    player.scene = { id: 'one' }; expect(player.wallReference()).toEqual(base);
    api.Player.prototype.resetWallReference.call(player); expect(player.wallReference()).toBeNull();
  });
  it('loads a saved reference only from the current image', () => {
    expect(api.Player.prototype.wallReference.call({ scene: { id: 'one', wallReference: base } })).toEqual(base);
    expect(api.Player.prototype.wallReference.call({ scene: { id: 'two' }, wallRefs: { one: base } })).toBeNull();
  });
});