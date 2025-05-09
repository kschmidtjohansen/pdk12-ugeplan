
import { PostgrestSingleResponse } from "@supabase/supabase-js";

// Helper function to safely get data from a potentially nullable nested property
export function safeGet<T>(data: any, path: string, defaultValue: T): T {
  if (!data) return defaultValue;
  
  const keys = path.split('.');
  let current = data;
  
  for (const key of keys) {
    if (current === null || current === undefined) {
      return defaultValue;
    }
    current = current[key];
  }
  
  return (current !== null && current !== undefined) ? current : defaultValue;
}

// Handle proper error typing for Supabase join queries
export function handleJoinQueryResult<T>(result: PostgrestSingleResponse<any>, defaultValue: T): T {
  if (result.error) {
    console.error("Database query error:", result.error);
    return defaultValue;
  }
  
  // The data might be an error object if join relations aren't found
  if (result.data && typeof result.data === 'object' && 'message' in result.data) {
    console.error("Join relation error:", result.data);
    return defaultValue;
  }
  
  return result.data as T;
}

// Safe property accessor that works with possible error objects
export function safeProperty<T>(obj: any, property: string, defaultValue: T): T {
  // Check if obj is an error object
  if (obj && typeof obj === 'object' && 'message' in obj) {
    return defaultValue;
  }
  
  // Normal property access
  return obj && obj[property] !== undefined ? obj[property] : defaultValue;
}
