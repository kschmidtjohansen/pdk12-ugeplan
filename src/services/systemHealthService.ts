
import { supabase } from '@/integrations/supabase/client';

interface SystemHealthReport {
  authentication: {
    isAuthenticated: boolean;
    userId: string | null;
    userExists: boolean;
    hasRole: boolean;
    role: string | null;
    sessionValid: boolean;
  };
  dataAccess: {
    profilesAccessible: boolean;
    assignmentsAccessible: boolean;
    carsAccessible: boolean;
    userRolesAccessible: boolean;
    vacationsAccessible: boolean;
  };
  policies: {
    userRolesPolicyCount: number;
    expectedPolicyCount: number;
    policiesCorrect: boolean;
    policyNames: string[];
  };
  errors: string[];
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL';
}

class SystemHealthService {
  async runComprehensiveHealthCheck(): Promise<SystemHealthReport> {
    console.log('[SystemHealthService] Starting comprehensive health check...');
    
    const report: SystemHealthReport = {
      authentication: {
        isAuthenticated: false,
        userId: null,
        userExists: false,
        hasRole: false,
        role: null,
        sessionValid: false
      },
      dataAccess: {
        profilesAccessible: false,
        assignmentsAccessible: false,
        carsAccessible: false,
        userRolesAccessible: false,
        vacationsAccessible: false
      },
      policies: {
        userRolesPolicyCount: 0,
        expectedPolicyCount: 2,
        policiesCorrect: false,
        policyNames: []
      },
      errors: [],
      overallHealth: 'CRITICAL'
    };

    try {
      // Phase 1: Authentication Check
      await this.checkAuthentication(report);
      
      // Phase 2: Policy Verification
      await this.verifyPolicies(report);
      
      // Phase 3: Data Access Testing
      await this.testDataAccess(report);
      
      // Phase 4: Overall Health Assessment
      this.assessOverallHealth(report);
      
      console.log('[SystemHealthService] Health check completed:', report);
      return report;
      
    } catch (error) {
      console.error('[SystemHealthService] Health check failed:', error);
      report.errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      report.overallHealth = 'CRITICAL';
      return report;
    }
  }

  private async checkAuthentication(report: SystemHealthReport) {
    try {
      // Check session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        report.errors.push(`Session error: ${sessionError.message}`);
        return;
      }
      
      if (!session?.user) {
        report.errors.push('No active session or user');
        return;
      }
      
      report.authentication.isAuthenticated = true;
      report.authentication.userId = session.user.id;
      report.authentication.sessionValid = true;
      
      // Check if user exists in profiles
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, name')
        .eq('id', session.user.id)
        .single();
      
      if (profileError) {
        report.errors.push(`Profile lookup error: ${profileError.message}`);
      } else if (profile) {
        report.authentication.userExists = true;
      }
      
      // Check user role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single();
      
      if (roleError) {
        report.errors.push(`Role lookup error: ${roleError.message}`);
      } else if (roleData) {
        report.authentication.hasRole = true;
        report.authentication.role = roleData.role;
      }
      
    } catch (error) {
      report.errors.push(`Authentication check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async verifyPolicies(report: SystemHealthReport) {
    try {
      const { data: verificationData, error } = await supabase.rpc('verify_complete_fix');
      
      if (error) {
        report.errors.push(`Policy verification failed: ${error.message}`);
        return;
      }
      
      if (verificationData) {
        report.policies.userRolesPolicyCount = verificationData.policy_count || 0;
        report.policies.policiesCorrect = verificationData.fix_status === 'SUCCESS';
        
        if (verificationData.policy_count !== 2) {
          report.errors.push(`Incorrect policy count: ${verificationData.policy_count} (expected 2)`);
        }
      }
      
    } catch (error) {
      report.errors.push(`Policy verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testDataAccess(report: SystemHealthReport) {
    // Test profiles access
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      if (!error) {
        report.dataAccess.profilesAccessible = true;
      } else {
        report.errors.push(`Profiles access error: ${error.message}`);
      }
    } catch (error) {
      report.errors.push(`Profiles test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test assignments access
    try {
      const { data, error } = await supabase.from('assignments').select('count').limit(1);
      if (!error) {
        report.dataAccess.assignmentsAccessible = true;
      } else {
        report.errors.push(`Assignments access error: ${error.message}`);
      }
    } catch (error) {
      report.errors.push(`Assignments test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test cars access
    try {
      const { data, error } = await supabase.from('cars').select('count').limit(1);
      if (!error) {
        report.dataAccess.carsAccessible = true;
      } else {
        report.errors.push(`Cars access error: ${error.message}`);
      }
    } catch (error) {
      report.errors.push(`Cars test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test user_roles access (the critical one)
    try {
      const { data, error } = await supabase.from('user_roles').select('count').limit(1);
      if (!error) {
        report.dataAccess.userRolesAccessible = true;
      } else {
        report.errors.push(`User roles access error: ${error.message}`);
      }
    } catch (error) {
      report.errors.push(`User roles test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Test vacations access
    try {
      const { data, error } = await supabase.from('vacations').select('count').limit(1);
      if (!error) {
        report.dataAccess.vacationsAccessible = true;
      } else {
        report.errors.push(`Vacations access error: ${error.message}`);
      }
    } catch (error) {
      report.errors.push(`Vacations test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private assessOverallHealth(report: SystemHealthReport) {
    const criticalIssues = [
      !report.authentication.isAuthenticated,
      !report.authentication.sessionValid,
      !report.policies.policiesCorrect,
      !report.dataAccess.userRolesAccessible
    ].filter(Boolean).length;

    const minorIssues = [
      !report.authentication.userExists,
      !report.authentication.hasRole,
      !report.dataAccess.profilesAccessible,
      !report.dataAccess.assignmentsAccessible,
      !report.dataAccess.carsAccessible,
      !report.dataAccess.vacationsAccessible
    ].filter(Boolean).length;

    if (criticalIssues === 0 && minorIssues === 0) {
      report.overallHealth = 'HEALTHY';
    } else if (criticalIssues === 0 && minorIssues <= 2) {
      report.overallHealth = 'DEGRADED';
    } else {
      report.overallHealth = 'CRITICAL';
    }
  }

  async quickHealthCheck(): Promise<boolean> {
    try {
      // Quick test of the most critical components
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return false;

      const { error: userRolesError } = await supabase.from('user_roles').select('count').limit(1);
      if (userRolesError) return false;

      const { error: profilesError } = await supabase.from('profiles').select('count').limit(1);
      if (profilesError) return false;

      return true;
    } catch {
      return false;
    }
  }
}

export const systemHealthService = new SystemHealthService();
