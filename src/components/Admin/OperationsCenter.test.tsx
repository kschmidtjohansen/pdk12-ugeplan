import React from 'react';
import { render, screen, fireEvent, cleanup, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import OperationsCenter from './OperationsCenter';
import WorkspaceSection from '@/components/shared/WorkspaceSection';
import EmptyState from '@/components/shared/EmptyState';
import { StatusBadge } from '@/components/ui/status-badge';

const state = vi.hoisted(() => ({
  campaigns: { data: [] as unknown[], isLoading: false, isError: false, isFetching: false, error: null as unknown, dataUpdatedAt: 0, refetch: vi.fn() },
  auto: { data: [] as unknown[], isLoading: false, isError: false, isFetching: false, refetch: vi.fn() },
}));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ currentLanguage: 'da', t: (k: string) => k }) }));
vi.mock('@/hooks/useBroadcastCampaigns', () => ({ useBroadcastCampaigns: () => state.campaigns }));
vi.mock('@/hooks/useAutoPublishLog', () => ({ useAutoPublishLog: () => state.auto }));
vi.mock('@/lib/realtimeChannels', () => ({ getRealtimeChannelDiagnostics: () => [] }));

afterEach(() => { cleanup(); state.campaigns.data = []; state.campaigns.isError = false; });

const camp = (o = {}) => ({ id: 'c1', created_at: new Date().toISOString(), created_by_name: 'A', department_id: null, roles: [], title: 'Storm', message: '', link: null,
  total_recipients: 4, push_sent: 2, push_failed: 1, push_skipped_preference: 0, push_no_subscription: 0, ...o });

describe('OperationsCenter', () => {
  it('shows cron as not monitored and never as success', () => {
    render(<OperationsCenter onOpenBroadcast={vi.fn()} />);
    const cron = screen.getByTestId('cron-status');
    expect(within(cron).getByText('Ikke overvåget')).toBeTruthy();
    expect(cron.querySelector('[data-status="success"]')).toBeNull();
    expect(screen.getByText('Ikke konfigureret')).toBeTruthy();
  });
  it('shows "Ingen målinger" when there are no campaigns', () => {
    render(<OperationsCenter onOpenBroadcast={vi.fn()} />);
    expect(screen.getAllByText('Ingen målinger').length).toBeGreaterThan(0);
  });
  it('renders KPIs with explicit denominator and links to delivery status', () => {
    state.campaigns.data = [camp()];
    const open = vi.fn();
    render(<OperationsCenter onOpenBroadcast={open} />);
    expect(screen.getByText('2 accepteret / 3 forsøg med resultat')).toBeTruthy();
    expect(screen.getByText('1 fejlet')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Åbn leveringsstatus/ }));
    expect(open).toHaveBeenCalledOnce();
    expect(screen.queryByRole('button', { name: /send alle igen/i })).toBeNull();
  });
  it('shows an error state with retry instead of success on load failure', () => {
    state.campaigns.isError = true;
    state.campaigns.error = new Error('boom');
    render(<OperationsCenter onOpenBroadcast={vi.fn()} />);
    expect(screen.getByRole('alert')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Prøv igen|common.retry/ }));
    expect(state.campaigns.refetch).toHaveBeenCalled();
  });
  it('period buttons toggle aria-pressed and refresh refetches', () => {
    render(<OperationsCenter onOpenBroadcast={vi.fn()} />);
    const seven = screen.getByRole('button', { name: '7 dage' });
    fireEvent.click(seven);
    expect(seven.getAttribute('aria-pressed')).toBe('true');
    fireEvent.click(screen.getByRole('button', { name: /Opdater data/ }));
    expect(state.auto.refetch).toHaveBeenCalled();
  });
});

describe('Design System 2.0 primitives', () => {
  it('WorkspaceSection labels its region by the heading', () => {
    render(<WorkspaceSection title="Lager" meta="3 / 5"><p>x</p></WorkspaceSection>);
    expect(screen.getByRole('region', { name: 'Lager' })).toBeTruthy();
    expect(screen.getByText('3 / 5')).toBeTruthy();
  });
  it('EmptyState filtered variant exposes a working reset button', () => {
    const reset = vi.fn();
    render(<EmptyState variant="filtered" title="Ingen match" action={{ label: 'Ryd filtre', onClick: reset }} />);
    expect(screen.getByRole('status').getAttribute('data-variant')).toBe('filtered');
    fireEvent.click(screen.getByRole('button', { name: 'Ryd filtre' }));
    expect(reset).toHaveBeenCalled();
  });
  it('StatusBadge keeps a text label alongside the dot', () => {
    render(<StatusBadge variant="warning" dot>Afventer</StatusBadge>);
    expect(screen.getByText('Afventer').getAttribute('data-status')).toBe('warning');
  });
});
