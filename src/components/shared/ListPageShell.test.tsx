import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import ListPageShell from './ListPageShell';
import { formatListCount } from './listCount';

vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ currentLanguage: 'da', t: (k: string) => k }) }));

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

it('shows department, count and toggles a remembered compact density', () => {
  const { container } = render(<ListPageShell title="Biler" eyebrow="Kolding" meta="3 i alt"><table><tbody><tr><td>x</td></tr></tbody></table></ListPageShell>);
  expect(screen.getByText('Kolding')).toBeInTheDocument();
  expect(screen.getByText('3 i alt')).toBeInTheDocument();
  const root = container.firstElementChild as HTMLElement;
  expect(root.dataset.density).toBe('comfortable');
  fireEvent.click(screen.getByRole('button', { name: 'Kompakt visning' }));
  expect(root.dataset.density).toBe('compact');
  expect(window.localStorage.getItem('polyplan.listDensity')).toBe('compact');
  expect(screen.getByRole('button', { name: 'Normal visning' })).toHaveAttribute('aria-pressed', 'true');
});

it('formats header counts for filtered and unfiltered lists', () => {
  expect(formatListCount(3, 12, false, true)).toBe('12 i alt');
  expect(formatListCount(3, 12, true, true)).toBe('3 af 12');
  expect(formatListCount(3, 12, true, false)).toBe('3 of 12');
});
