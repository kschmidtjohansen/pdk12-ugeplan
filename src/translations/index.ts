
import en from './en';
import da from './da';
import daPlanner from './da/planner';
import daLogin from './da/login';
import daDashboard from './da/dashboard';
import daNavigation from './da/navigation';

// Define available languages
export const languageNames = {
  'en': 'English',
  'da': 'Dansk'
};

// Merge Danish nested files with main file
const mergedDa = {
  ...da,
  planner: daPlanner,
  login: daLogin,
  dashboard: daDashboard,
  navigation: daNavigation
};

// Export all translations
const translations = {
  en,
  da: mergedDa,
};

export default translations;
