
import { ReactNode } from 'react';

export interface NavigationItem {
  path: string;
  name: string;
  icon: ReactNode;
  adminOnly?: boolean;
  skadelederVisible?: boolean;
  translationKey: string;
  hasNotification?: boolean;
}

// Add NavItem as an alias for NavigationItem to maintain compatibility
export type NavItem = NavigationItem;
