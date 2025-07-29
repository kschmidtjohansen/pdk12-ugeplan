
import en from './en';
import da from './da';

// Define available languages
export const languageNames = {
  'en': 'English',
  'da': 'Dansk'
};

// Export all translations - Force cache refresh
const translations = {
  en,
  da,
};

export default translations;
