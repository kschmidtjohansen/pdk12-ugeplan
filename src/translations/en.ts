
import common from './en/common';
import navigation from './en/navigation';
import notifications from './en/notifications';
import index from './en/index';
import dashboard from './en/dashboard';
import vacation from './en/vacation';
import employees from './en/employees';
import departments from './en/departments';

const en = {
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
  index: index,
  // Dashboard
  dashboard: dashboard,
  // Vacation
  vacation: vacation,
  // Employees
  employees: employees,
  // Departments
  departments: departments,
};

export type EnTranslations = typeof en;

export default en;
