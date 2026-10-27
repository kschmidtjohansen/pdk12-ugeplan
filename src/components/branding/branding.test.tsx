import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import PolyPlanMark from './PolyPlanMark';
import PolyPlanBrand from './PolyPlanBrand';
import { PRODUCT_MARK_SRC, ORG_LOGO_URL } from '@/config/product';

afterEach(cleanup);
const read = (p: string) => readFileSync(p, 'utf8');

it('product mark source is the approved favicon master', () => {
  expect(PRODUCT_MARK_SRC).toBe('/favicon.svg');
  render(<PolyPlanMark size={32} />);
  const img = screen.getByRole('img', { name: 'PolyPlan' });
  expect(img).toHaveAttribute('src', '/favicon.svg');
});

it('lockup shows wordmark with decorative mark; markOnly carries the accessible name', () => {
  const { container, unmount } = render(<PolyPlanBrand />);
  expect(screen.getByText('PolyPlan')).toBeInTheDocument();
  expect(container.querySelector('[data-brand="polyplan-mark"]')).toHaveAttribute('alt', '');
  unmount();
  render(<PolyPlanBrand markOnly />);
  expect(screen.getByRole('img', { name: 'PolyPlan' })).toHaveAttribute('src', '/favicon.svg');
});

it('sidebar (expanded+collapsed), mobile top bar and login use the shared brand, not polygon-mark', () => {
  const sidebar = read('src/components/Layout/AppSidebar.tsx');
  expect(sidebar).toMatch(/<PolyPlanBrand size=\{32\} markOnly \/>/);
  expect(sidebar).toMatch(/<PolyPlanBrand size=\{28\}/);
  expect(read('src/components/Layout/AppTopBar.tsx')).toMatch(/<PolyPlanMark size=\{28\} decorative \/>/);
  const login = read('src/pages/LoginPage.tsx');
  expect(login).toMatch(/<PolyPlanBrand/);
  for (const f of ['src/components/Layout/AppSidebar.tsx', 'src/components/Layout/AppTopBar.tsx', 'src/pages/LoginPage.tsx']) {
    expect(read(f)).not.toMatch(/polygon-mark/);
  }
});

it('corporate Polygon Group logo is preserved unchanged on the login brand panel', () => {
  expect(ORG_LOGO_URL).toBe('https://www.polygongroup.com/UI/build/svg/polygon-logo.svg');
  expect(read('src/pages/LoginPage.tsx')).toMatch(/src=\{ORG_LOGO_URL\}/);
});

it('favicon master, manifest and index keep pointing at the same original icon', () => {
  expect(read('index.html')).toMatch(/favicon\.svg/);
});
