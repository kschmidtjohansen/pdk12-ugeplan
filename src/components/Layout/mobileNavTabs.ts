import { Home, CalendarDays, Phone } from 'lucide-react';

export interface MobileTabItem {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface BuildMobileTabsArgs {
  isDa: boolean;
  isDutyEnabled: boolean;
  totalUnread: number;
}

/**
 * Bottom-tab configuration for the mobile navigation. The Vagter (/duty) tab
 * follows the same department feature flag as the desktop sidebar, so mobile
 * and desktop never disagree about available features.
 */
export const buildMobileTabs = ({ isDa, isDutyEnabled, totalUnread }: BuildMobileTabsArgs): MobileTabItem[] => {
  const tabs: MobileTabItem[] = [
    { to: '/dashboard', label: isDa ? 'Min Dag' : 'My Day', icon: Home },
    { to: '/planner', label: isDa ? 'Ugeplan' : 'Planner', icon: CalendarDays, badge: totalUnread },
  ];
  if (isDutyEnabled) {
    tabs.push({ to: '/duty', label: isDa ? 'Vagter' : 'Duties', icon: Phone });
  }
  return tabs;
};
