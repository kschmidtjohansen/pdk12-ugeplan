
import { common } from './da/common';
import navigation from './da/navigation';
import notifications from './da/notifications';
import { da } from './da/index';
import accessDenied from './da/accessDenied';
import login from './da/login';
import { admin } from './da/admin';
import employees from './da/employees';
import planner from './da/planner';
import { dashboard } from './da/dashboard';
import vacation from './da/vacation';
import cars from './da/cars';
import deleteConfirm from './da/deleteConfirm';
import { profile } from './da/profile';
import { auth } from './da/auth';
import screenDisplay from './da/screenDisplay';

const daTranslations = {
  // Common components
  common: {
    ...common,
    yes: 'Ja',
    no: 'Nej',
    week: 'Uge',
    available: 'Tilgængelig',
    unavailable: 'Ikke tilgængelig',
    deleting: 'Sletter...',
    lightMode: 'Lys tilstand',
    darkMode: 'Mørk tilstand',
    toggleTheme: 'Skift tema'
  },
  // Navigation items
  navigation: navigation,
  // Notifications
  notifications: notifications,
  // Index page
  index: da,
  // Access denied
  accessDenied: accessDenied,
  // Login page
  login: login,
  // Admin pages
  admin: admin,
  // Employees page
  employees: employees,
  // Planner page
  planner: planner,
  // Dashboard
  dashboard: dashboard,
  // Vacation
  vacation: vacation,
  // Cars
  cars: cars,
  // Delete confirmations
  deleteConfirm: deleteConfirm,
  // Profile
  profile: profile,
  // Auth
  auth: auth,
  // Screen Display
  screenDisplay: screenDisplay,
};

export type DaTranslations = typeof daTranslations;

export default daTranslations;
