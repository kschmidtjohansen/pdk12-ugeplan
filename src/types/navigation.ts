
import { ReactNode } from 'react';

export interface NavigationItem {
  path: string;
  name: string;
  icon: ReactNode;
  adminOnly?: boolean;
  translationKey: string;
}
