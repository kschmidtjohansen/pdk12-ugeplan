// @vitest-environment node
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

const html = readFileSync(new URL('../../index.html', import.meta.url), 'utf8');
const guard = html.match(/<script>([\s\S]*?)<\/script>/)?.[1];
if (!guard) throw new Error('Missing frame guard');

function embeddedDisplay(pathname: string, search: string) {
  const style = { display: '' };
  const topLocation = { href: '' };
  Object.defineProperty(topLocation, 'origin', { get() { throw new Error('Cross-origin frame'); } });
  runInNewContext(guard, {
    location: { hostname: 'polyplan.dk', origin: 'https://polyplan.dk', pathname, search, href: `https://polyplan.dk${pathname}${search}` },
    window: { top: { location: topLocation }, self: {} },
    document: { documentElement: { style } },
    URLSearchParams,
  });
  return style.display;
}

describe('external signage frame boundary', () => {
  it('allows read-only screen display with a screen code', () => {
    expect(embeddedDisplay('/screen-display', '?departmentId=d-12&screen=' + 'a'.repeat(48))).toBe('');
  });
  it('continues blocking admin even with a screen code', () => {
    expect(embeddedDisplay('/admin', '?screen=' + 'a'.repeat(48))).toBe('none');
  });
  it('continues blocking screen display without a screen code', () => {
    expect(embeddedDisplay('/screen-display', '?departmentId=d-12')).toBe('none');
  });
  it('continues blocking malformed screen codes', () => {
    expect(embeddedDisplay('/screen-display', '?screen=invalid')).toBe('none');
  });
});