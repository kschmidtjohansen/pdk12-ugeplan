
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
  // Login
  login: login,
  // Planner
  planner: planner,
  // Cars
  cars: cars,
  // Admin
  admin: admin,
};

export type EnTranslations = typeof enTranslations;

export default enTranslations;
