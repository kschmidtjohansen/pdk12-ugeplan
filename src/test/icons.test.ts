import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const pub = (f: string) => resolve(__dirname, '../../public', f.replace(/^\//, '').split('?')[0]);

function pngInfo(file: string) {
  const b = readFileSync(pub(file));
  expect(b.subarray(1, 4).toString('ascii')).toBe('PNG');
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), colorType: b[25] };
}

describe('PolyPlan icons', () => {
  const manifest = JSON.parse(readFileSync(pub('manifest.webmanifest'), 'utf8'));

  it('manifest has separate any + maskable icons at 192 and 512 that exist with exact size', () => {
    for (const purpose of ['any', 'maskable']) {
      const icons = manifest.icons.filter((i: { purpose: string }) => i.purpose === purpose);
      expect(icons.map((i: { sizes: string }) => i.sizes).sort()).toEqual(['192x192', '512x512']);
      for (const i of icons) {
        const n = Number(i.sizes.split('x')[0]);
        expect(pngInfo(i.src)).toMatchObject({ w: n, h: n });
      }
    }
    const srcs = manifest.icons.map((i: { src: string }) => i.src);
    expect(new Set(srcs).size).toBe(srcs.length);
    expect(manifest.id).toBe('/');
    expect(manifest.start_url).toBe('/');
  });

  it('opaque icons (apple + maskable) have no alpha channel', () => {
    for (const f of ['apple-touch-icon.png', 'icon-maskable-192.png', 'icon-maskable-512.png']) {
      expect([2]).toContain(pngInfo(f).colorType); // RGB, no alpha
    }
    expect(pngInfo('apple-touch-icon.png')).toMatchObject({ w: 180, h: 180 });
  });

  it('favicon PNGs are square with announced size', () => {
    for (const s of [16, 32, 48]) expect(pngInfo(`favicon-${s}x${s}.png`)).toMatchObject({ w: s, h: s });
    expect(pngInfo('favicon.png')).toMatchObject({ w: 192, h: 192 });
    const ico = readFileSync(pub('favicon.ico'));
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBeGreaterThanOrEqual(3);
  });

  it('favicon.svg is a real vector with viewBox and brand colours', () => {
    const svg = readFileSync(pub('favicon.svg'), 'utf8');
    expect(svg).toMatch(/^<svg[^>]+viewBox="0 0 64 64"/);
    expect(svg).toContain('#003E5C');
    expect(svg).toContain('#00AEEF');
  });

  it('index.html references every icon that exists and the official canonical', () => {
    const html = readFileSync(resolve(__dirname, '../../index.html'), 'utf8');
    expect(html).toContain('<link rel="canonical" href="https://www.pdk12.dk/" />');
    expect(html).not.toContain('pdk12-ugeplan.lovable.app');
    expect(html).toContain('type="image/svg+xml"');
    const hrefs = [...html.matchAll(/rel="(?:icon|alternate icon|apple-touch-icon|manifest)"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*rel="icon"/g)]
      .map((m) => m[1] ?? m[2]);
    const all = [...html.matchAll(/<link rel="(?:icon|alternate icon|apple-touch-icon|manifest)"[^>]*href="([^"]+)"/g)].map((m) => m[1]);
    expect(all.length).toBeGreaterThanOrEqual(5);
    for (const h of [...hrefs, ...all]) expect(existsSync(pub(h))).toBe(true);
  });
});
