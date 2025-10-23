import { supabase } from './client';

// Baseline timestamp for demo data - everything before this is persistent baseline data
const BASELINE_TIMESTAMP = '2024-01-01T00:00:00Z';

/**
 * Schema-aware Supabase client that automatically routes queries to demo or public schema
 * based on whether the user is in demo mode
 */
export class DemoSchemaClient {
  constructor(private useDemo: boolean = false) {}
  
  /**
   * Get a table reference with the appropriate schema prefix
   * @param table - Table name without schema prefix
   * @returns Supabase query builder for the table
   */
  from(table: string) {
    // Prefix with demo schema if in demo mode
    const tableName = this.useDemo ? `demo.${table}` : table;
    return supabase.from(tableName as any);
  }
  
  /**
   * Get the baseline timestamp for demo data cleanup
   * Data created before this timestamp is persistent baseline data
   */
  getBaselineTimestamp(): string {
    return BASELINE_TIMESTAMP;
  }
  
  /**
   * Check if current user is in demo mode based on email
   */
  static isDemoMode(userEmail?: string): boolean {
    return userEmail === 'test@polygongroup.com';
  }
}

/**
 * Factory function to get schema-aware client instance
 * @param isDemoMode - Whether user is in demo mode
 * @returns DemoSchemaClient instance
 */
export const getSchemaClient = (isDemoMode: boolean) => {
  return new DemoSchemaClient(isDemoMode);
};
