
// Export all date utility functions from a central file
export * from './weekCore';
export * from './weekNavigation';
export * from './weekFormatting';

// Add console log to help debugging
if (import.meta.env.DEV) console.log("Date utilities loaded from src/utils/dates/index.ts");
