
import common from './da/common';
import navigation from './da/navigation';
import notifications from './da/notifications';
import index from './da/index';
import accessDenied from './da/accessDenied';
import login from './da/login';
import admin from './da/admin';
import employees from './da/employees';
import planner from './da/planner';
import dashboard from './da/dashboard';
import vacation from './da/vacation';
import cars from './da/cars';
import deleteConfirm from './da/deleteConfirm';
import departments from './da/departments';

const da = {
  // Common components
  common: {
    ...common,
    yes: 'Ja',
    no: 'Nej',
    week: 'Uge',
    available: 'Tilgængelig',
    unavailable: 'Ikke tilgængelig'
  },
  // Navigation items
  navigation: navigation,
  // Notifications
  notifications: notifications,
  // Index page
  index: index,
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
  // Departments
  departments: departments,
};

export type DaTranslations = typeof da;

export default da;
