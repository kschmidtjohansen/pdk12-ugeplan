
import { common } from './en/common';
import navigation from './en/navigation';
import notifications from './en/notifications';
import { en } from './en/index';
import dashboard from './en/dashboard';
import vacation from './en/vacation';
import employees from './en/employees';
import { profile } from './en/profile';

const enTranslations = {
  // Common components
  common: {
    ...common,
    yes: 'Yes',
    no: 'No',
    week: 'Week',
    available: 'Available',
    unavailable: 'Unavailable'
  },
  // Navigation items
  navigation: navigation,
  // Notifications
  notifications: notifications,
  // Index page
  index: en,
  // Dashboard
  dashboard: dashboard,
  // Vacation
  vacation: vacation,
  // Employees
  employees: employees,
  // Profile
  profile: profile,
};

export type EnTranslations = typeof enTranslations;

export default enTranslations;
