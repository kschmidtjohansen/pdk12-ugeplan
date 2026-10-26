import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import PlannerCalendarView from './PlannerCalendarView';
import type { Assignment } from '@/types/assignment';
import type { Employee } from '@/types/employee';

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'emp-1' } }),
  usePermissions: () => ({ canEdit: true }),
}));
vi.mock('@/context/TranslationContext', () => ({
  useTranslation: () => ({ currentLanguage: 'da', t: (key: string) => key }),
}));

const employee: Employee = {
  id: 'emp-1',
  name: 'Anna Andersen',
  email: 'anna@test.dk',
  role: 'servicemedarbejder',
  status: 'active',
};

const lateTask: Assignment = {
  id: 'late',
  title: 'Vagt',
  date: '2026-12-28',
  fromTime: '23:30',
  toTime: '23:59',
  location: 'Havnegade 12',
  published: true,
  assignedEmployees: [{ id: 'emp-1', name: 'Anna Andersen', email: 'anna@test.dk' }],
};

const renderView = () =>
  render(
    <PlannerCalendarView
      dates={['2026-12-28']}
      assignments={[lateTask]}
      employees={[employee]}
      vacations={[]}
      onViewDetails={vi.fn()}
      onCreateAssignment={vi.fn()}
      canEdit
      onEditAssignment={vi.fn()}
    />,
  );

beforeAll(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  localStorage.setItem('plannerCalendarEmployees', JSON.stringify(['emp-1']));
  localStorage.setItem('plannerCalendarSidebarMinimized', '1');
});

afterEach(() => cleanup());

describe('Kalendervisningens dagsinterval', () => {
  it('har tidslot fra 00:00 til 23:59', () => {
    renderView();
    expect(screen.getAllByRole('button', { name: /^Opret opgave / })).toHaveLength(24);
    expect(screen.getByRole('button', { name: 'Opret opgave 00:00' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Opret opgave 23:00' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Opret opgave 24:00' })).not.toBeInTheDocument();
  });

  it('placering af en sen aften opgave bliver i dagsgitteret', () => {
    renderView();
    const slot = screen.getByText('Vagt').closest('button');
    expect(slot).not.toBeNull();
    const top = Number.parseFloat(slot!.style.top);
    expect(top).toBeGreaterThan(0);
    expect(top).toBeLessThan(24 * 40);
  });
});
