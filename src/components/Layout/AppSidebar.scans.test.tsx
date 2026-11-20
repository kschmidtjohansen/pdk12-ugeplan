import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { SidebarProvider } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';

vi.mock('@/context/TranslationContext', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
vi.mock('@/context/AuthContext', () => ({ useAuth: () => ({ user: { role: 'super_admin' }, isEffectiveAdmin: false, canViewDuty: false, canViewWarehouse: false }) }));
vi.mock('@/context/DepartmentContext', () => ({ useDepartment: () => ({ isDutyEnabled: false, isWarehouseEnabled: false }) }));
vi.mock('@/hooks/vacation/useVacationRequestsStatus', () => ({ useVacationRequestsStatus: () => ({ hasPendingRequests: false, pendingCount: 0 }) }));
vi.mock('@/context/UnreadMessagesContext', () => ({ useUnreadMessagesContext: () => ({ totalUnread: 0 }) }));
vi.mock('@/hooks/useScanAccess', () => ({ useScanAccess: () => true, SCANS_ROUTE: '/3d-scanninger' }));
vi.mock('./NavComponents/DepartmentSwitcherPill', () => ({ default: () => null }));
vi.mock('./NavComponents/UserMenu', () => ({ default: () => null }));
vi.mock('@/hooks/use-toast', () => ({ useToast: () => ({ toast: () => {} }) }));
vi.mock('@/hooks/use-mobile', () => ({ useIsMobile: () => false }));

describe('3D submenu interaction', () => {
  it('can be collapsed manually while staying on a 3D page, and reopened with the arrow', () => {
    render(<MemoryRouter initialEntries={['/3d-scanninger?view=archive']}><SidebarProvider><AppSidebar /></SidebarProvider></MemoryRouter>);
    expect(screen.getByRole('link', { name: 'Arkiv' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fold 3D-scanninger sammen' }));
    expect(screen.queryByRole('link', { name: 'Arkiv' })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Fold 3D-scanninger ud' }));
    expect(screen.getByRole('link', { name: 'Arkiv' })).toBeInTheDocument();
  });
});