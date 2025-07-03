
import { common } from './da/common';
import navigation from './da/navigation';
import notifications from './da/notifications';
import { dashboard } from './da/dashboard';
import vacation from './da/vacation';
import employees from './da/employees';
import { profile } from './da/profile';
import login from './da/login';
import planner from './da/planner';
import cars from './da/cars';
import { admin } from './da/admin';
import { auth } from './da/auth';
import screenDisplay from './da/screenDisplay';
import accessDenied from './da/accessDenied';
import deleteConfirm from './da/deleteConfirm';

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
    toggleTheme: 'Skift tema',
    today: 'I dag',
    tomorrow: 'I morgen'
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
  deleteConfirm: deleteConfirm
};

export type DaTranslations = typeof daTranslations;

export default daTranslations;
