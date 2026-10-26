import React from 'react';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import SubDepartmentQuickSwitcher from './SubDepartmentQuickSwitcher';

const state = vi.hoisted(() => ({
  selectedSubDepartmentId: 'sub-fugt' as string | null,
  setSelectedSubDepartmentId: vi.fn(),
  userSubDepartments: [{ id: 'sub-fugt', name: 'Fugt' }] as { id: string; name: string }[],
  userDepartments: [{ id: 'dept-12', name: '12 - Fredericia' }] as { id: string; name: string }[],
  selectedDepartmentId: 'dept-12',
  switchDepartment: vi.fn(),
}));

vi.mock('@/context/DepartmentContext', () => ({ useDepartment: () => state }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  state.selectedSubDepartmentId = 'sub-fugt';
});

describe('SubDepartmentQuickSwitcher', () => {
  it('tilbyder "Alle" også når der kun findes én underafdeling (Fugt)', () => {
    render(<SubDepartmentQuickSwitcher />);
    const allPill = screen.getByRole('button', { name: 'common.all' });
    expect(allPill).toBeInTheDocument();
  });

  it('slår underafdelingen fra til "Alle" (null) ved klik på "Alle"', () => {
    render(<SubDepartmentQuickSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.all' }));
    expect(state.setSelectedSubDepartmentId).toHaveBeenCalledWith(null);
  });

  it('viser underafdelingspiller uanset antal', () => {
    render(<SubDepartmentQuickSwitcher />);
    expect(screen.getByRole('button', { name: 'Fugt' })).toBeInTheDocument();
  });

  it('markerer aktiv underafdeling korrekt', () => {
    render(<SubDepartmentQuickSwitcher />);
    expect(screen.getByRole('button', { name: 'Fugt' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'common.all' })).toHaveAttribute('aria-pressed', 'false');
  });
});
