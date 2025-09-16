
import { common } from './en/common';
import navigation from './en/navigation';
import notifications from './en/notifications';
import { dashboard } from './en/dashboard';
import vacation from './en/vacation';
import employees from './en/employees';
import { profile } from './en/profile';
import login from './en/login';
import planner from './en/planner';
import cars from './en/cars';
import { admin } from './en/admin';
import { auth } from './en/auth';
import screenDisplay from './en/screenDisplay';
import accessDenied from './en/accessDenied';
import deleteConfirm from './en/deleteConfirm';
import calibration from './en/calibration';

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
    toggleTheme: 'Toggle theme',
    today: 'Today',
    tomorrow: 'Tomorrow'
  },
  // Navigation items
  navigation: navigation,
  // Notifications
  notifications: notifications,
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
  // Screen Display
  screenDisplay: screenDisplay,
  // Access denied
  accessDenied: accessDenied,
  // Delete confirmations
  deleteConfirm: deleteConfirm,
  // Calibration
  calibration: calibration
};

export type EnTranslations = typeof enTranslations;

export default enTranslations;
