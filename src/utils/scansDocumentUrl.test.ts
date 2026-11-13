import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../public/3d/index.html', import.meta.url), 'utf8');
const normalizer = html.match(/<script>(try\{if\([^<]*history\.replaceState[^<]*)<\/script>/)?.[1];
if (!normalizer) throw new Error('3D document URL normalizer not found');

function normalize(embedded: boolean) {
  const replacements: string[] = [];
  const window: { parent?: unknown } = {};
  window.parent = embedded ? {} : window;
  runInNewContext(normalizer, {
    window,
    location: { pathname: '/3d/index.html', search: '?embed=1', hash: '#t-case123' },
    history: { state: null, replaceState: (_state: unknown, _title: string, url: string) => replacements.push(url) },
  });
  return replacements;
}

describe('3D document reload destination', () => {
  it('retains the static document URL inside PolyPlan instead of entering the React redirect', () => {
    expect(normalize(true)).toEqual([]);
  });

  it('preserves legacy standalone URL cleanup with the tour and query intact', () => {
    expect(normalize(false)).toEqual(['/3d?embed=1#t-case123']);
  });
});