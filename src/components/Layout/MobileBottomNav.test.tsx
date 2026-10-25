import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import MobileBottomNav from './MobileBottomNav';

const state = vi.hoisted(() => ({ duty: true, open: vi.fn() }));
vi.mock('@/components/ui/sidebar', () => ({ useSidebar: () => ({ setOpenMobile: state.open, openMobile: false }) }));
vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ currentLanguage: 'da' }) }));
vi.mock('@/context/DepartmentContext', () => ({ useDepartment: () => ({ isDutyEnabled: state.duty }) }));
vi.mock('@/context/UnreadMessagesContext', () => ({ useUnreadMessagesContext: () => ({ totalUnread: 3 }) }));
afterEach(() => { cleanup(); state.duty = true; vi.clearAllMocks(); });
describe('Mobilmenuens bevarede handlinger', () => {
  it('åbner Mere-panelet og bevarer aktiv planner-adresse', () => {
    render(<MemoryRouter initialEntries={['/planner']}><MobileBottomNav /></MemoryRouter>);
    fireEvent.click(screen.getByRole('button', { name: 'Mere' }));
    expect(state.open).toHaveBeenCalledWith(true);
    expect(screen.getByRole('link', { name: /Ugeplan/ })).toHaveAttribute('aria-current', 'page');
  });
  it('viser ikke en vagtadresse når modulet er slukket', () => {
    state.duty = false;
    render(<MemoryRouter><MobileBottomNav /></MemoryRouter>);
    expect(screen.queryByRole('link', { name: 'Vagter' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Ugeplan/ })).toHaveAttribute('href', '/planner');
  });
});