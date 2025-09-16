import { supabase } from '@/integrations/supabase/client';

/**
 * Central security manager for handling security policies and permissions
 * Works with the new enhanced RLS policies and audit logging
 */
export class SecurityManager {
  
  /**
   * Check if current user can view fuel codes (with automatic logging)
   */
  static async canViewFuelCodes(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_view_fuel_codes_audited');
      if (error) {
        console.error('[SecurityManager] Error checking fuel code permissions:', error);
        return false;
      }
      return data || false;
    } catch (error) {
      console.error('[SecurityManager] Exception checking fuel code permissions:', error);
      return false;
    }
  }

  /**
   * Get security events summary (admin only)
   */
  static async getSecurityEventsSummary() {
    try {
      const { data, error } = await supabase.rpc('get_security_events_summary');
      if (error) {
        console.error('[SecurityManager] Error fetching security events:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.error('[SecurityManager] Exception fetching security events:', error);
      return [];
    }
  }

  /**
   * Log a security event with proper severity handling
   */
  static async logSecurityEvent(
    eventType: string,
    message: string,
    details?: Record<string, any>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'info'
  ): Promise<void> {
    try {
      await supabase.rpc('log_security_event_safe', {
        event_type: eventType,
        event_message: message,
        event_details: details || {},
        severity
      });
    } catch (error) {
      console.warn('[SecurityManager] Failed to log security event:', error);
    }
  }

  /**
   * Check if the current user has admin or skadeleder role
   */
  static async isAdminOrSkadeleder(): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('is_admin_or_skadeleder');
      if (error) {
        console.error('[SecurityManager] Error checking admin role:', error);
        return false;
      }
      return data || false;
    } catch (error) {
      console.error('[SecurityManager] Exception checking admin role:', error);
      return false;
    }
  }

  /**
   * Validate user access to a specific assignment
   */
  static async canAccessAssignment(assignmentId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_access_assignment', {
        assignment_id: assignmentId
      });
      if (error) {
        console.error('[SecurityManager] Error checking assignment access:', error);
        return false;
      }
      return data || false;
    } catch (error) {
      console.error('[SecurityManager] Exception checking assignment access:', error);
      return false;
    }
  }

  /**
   * Handle security error with proper logging and user-friendly messaging
   */
  static handleSecurityError(error: any, context: string): string {
    const errorMessage = error?.message || 'Unknown security error';
    
    // Log the security error
    this.logSecurityEvent(
      'security_error',
      `Security error in ${context}: ${errorMessage}`,
      { context, error: errorMessage },
      'error'
    );

    // Return user-friendly message based on error type
    if (errorMessage.includes('Authentication required')) {
      return 'Please log in to access this resource.';
    }
    if (errorMessage.includes('permission') || errorMessage.includes('access denied')) {
      return 'You do not have permission to access this resource.';
    }
    if (errorMessage.includes('row-level security')) {
      return 'Access to this data is restricted.';
    }
    
    return 'An error occurred while accessing this resource. Please try again.';
  }

  /**
   * Test database security configuration
   */
  static async testSecurityConfiguration(): Promise<{
    profileAccess: boolean;
    carAccess: boolean;
    assignmentAccess: boolean;
    fuelCodeAccess: boolean;
    adminAccess: boolean;
    errors: string[];
  }> {
    const results = {
      profileAccess: false,
      carAccess: false,
      assignmentAccess: false,
      fuelCodeAccess: false,
      adminAccess: false,
      errors: []
    };

    // Test profile access
    try {
      const { error } = await supabase.from('profiles').select('id').limit(1);
      results.profileAccess = !error;
      if (error) results.errors.push(`Profile access: ${error.message}`);
    } catch (error) {
      results.errors.push(`Profile access exception: ${error}`);
    }

    // Test car access
    try {
      const { error } = await supabase.from('cars').select('id').limit(1);
      results.carAccess = !error;
      if (error) results.errors.push(`Car access: ${error.message}`);
    } catch (error) {
      results.errors.push(`Car access exception: ${error}`);
    }

    // Test assignment access
    try {
      const { error } = await supabase.from('assignments').select('id').limit(1);
      results.assignmentAccess = !error;
      if (error) results.errors.push(`Assignment access: ${error.message}`);
    } catch (error) {
      results.errors.push(`Assignment access exception: ${error}`);
    }

    // Test fuel code access
    try {
      results.fuelCodeAccess = await this.canViewFuelCodes();
    } catch (error) {
      results.errors.push(`Fuel code access exception: ${error}`);
    }

    // Test admin access
    try {
      results.adminAccess = await this.isAdminOrSkadeleder();
    } catch (error) {
      results.errors.push(`Admin access exception: ${error}`);
    }

    return results;
  }
}