
import en from './en';
import da from './da';
import daPlanner from './da/planner';
import daLogin from './da/login';
import daDashboard from './da/dashboard';
import daNavigation from './da/navigation';
import daVacation from './da/vacation';
import daAdmin from './da/admin';
import daNotifications from './da/notifications';
import daAccessDenied from './da/accessDenied';
import daCars from './da/cars';
import daDeleteConfirm from './da/deleteConfirm';
import daEmployees from './da/employees';
import daCommon from './da/common';

// Define available languages
export const languageNames = {
  'en': 'English',
  'da': 'Dansk'
};

// Merge Danish nested files with main file
const mergedDa = {
  ...da,
  common: daCommon,
  planner: daPlanner,
  login: daLogin,
  dashboard: daDashboard,
  navigation: daNavigation,
  vacation: daVacation,
  admin: daAdmin,
  notifications: daNotifications,
  accessDenied: daAccessDenied,
  cars: daCars,
  deleteConfirm: daDeleteConfirm,
  employees: daEmployees
};

// Export all translations
const translations = {
  en,
  da: mergedDa,
};

export default translations;
