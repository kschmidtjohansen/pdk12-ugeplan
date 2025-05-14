
import { ReactNode } from 'react';

export interface NavigationItem {
  path: string;
  name: string;
  icon: ReactNode;
  adminOnly?: boolean;
  skadelederVisible?: boolean;
  translationKey: string;
}
