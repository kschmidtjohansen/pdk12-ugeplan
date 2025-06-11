
import { common } from './en/common';
import navigation from './en/navigation';
import notifications from './en/notifications';
import { en } from './en/index';
import dashboard from './en/dashboard';
import vacation from './en/vacation';
import employees from './en/employees';
import { profile } from './en/profile';
import login from './en/login';
import planner from './en/planner';
import cars from './en/cars';
import { admin } from './en/admin';
import { auth } from './en/auth';

const enTranslations = {
  // Common components
  common: {
    ...common,
    yes: 'Yes',
    no: 'No',
    week: 'Week',
    available: 'Available',
    unavailable: 'Unavailable',
    deleting: 'Deleting...',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    toggleTheme: 'Toggle theme'
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
  // Login
  login: login,
  // Planner
  planner: planner,
  // Cars
  cars: cars,
  // Admin
  admin: admin,
  // Auth
  auth: auth,
  // Access denied - adding for consistency
  accessDenied: {
    title: 'Access Denied',
    message: 'You need to be logged in to access this page.',
    restricted: 'You do not have permission to perform this action.'
  },
  // Delete confirmations - adding for consistency
  deleteConfirm: {
    title: 'Are you absolutely sure?',
    carWarning: 'You are about to delete {name} from the department. This action cannot be undone.',
    cancel: 'Cancel',
    delete: 'Delete'
  }
};

export type EnTranslations = typeof enTranslations;

export default enTranslations;
