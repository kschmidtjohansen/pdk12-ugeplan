
/**
 * Utility functions for UUID validation and handling
 */

/**
 * Check if a string is a valid UUID
 */
export const isValidUUID = (uuid: string | null | undefined): boolean => {
  if (!uuid || typeof uuid !== 'string') {
    return false;
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Validate UUID and return null if invalid
 */
export const validateUUID = (uuid: string | null | undefined): string | null => {
  return isValidUUID(uuid) ? uuid as string : null;
};

/**
 * Validate UUID or throw error with context
 */
export const requireValidUUID = (uuid: string | null | undefined, context: string): string => {
  if (!isValidUUID(uuid)) {
    throw new Error(`Invalid or missing UUID in ${context}: ${uuid}`);
  }
  return uuid as string;
};

/**
 * Safe UUID for database operations - returns null for invalid UUIDs
 */
export const safeUUID = (uuid: string | null | undefined): string | null => {
  if (!uuid || uuid === 'undefined' || uuid === 'null') {
    return null;
  }
  return isValidUUID(uuid) ? uuid : null;
};
