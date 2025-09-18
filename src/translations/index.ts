
import { en } from './en/index';
import { da } from './da/index';

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
