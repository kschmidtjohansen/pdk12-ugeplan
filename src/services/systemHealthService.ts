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

interface VerificationResponse {
  policy_count?: number;
  fix_status?: string;
  [key: string]: any;
}

class SystemHealthService {
  async runComprehensiveHealthCheck(): Promise<SystemHealthReport> {
    if (import.meta.env.DEV) console.log('[SystemHealthService] Starting comprehensive health check...');
    
    const report: SystemHealthReport = {
      authentication: { isAuthenticated: false, userId: null, userExists: false, hasRole: false, role: null, sessionValid: false },
      dataAccess: { profilesAccessible: false, assignmentsAccessible: false, carsAccessible: false, userRolesAccessible: false, vacationsAccessible: false },
      policies: { userRolesPolicyCount: 0, expectedPolicyCount: 2, policiesCorrect: false, policyNames: [] },
      errors: [],
      overallHealth: 'CRITICAL'
    };

    try {
      await this.checkAuthentication(report);
      await this.verifyPolicies(report);
      await this.testDataAccess(report);
      this.assessOverallHealth(report);
      
      if (import.meta.env.DEV) console.log('[SystemHealthService] Health check completed:', report);
      return report;
    } catch (error) {
      if (import.meta.env.DEV) console.error('[SystemHealthService] Health check failed:', error);
      report.errors.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      report.overallHealth = 'CRITICAL';
      return report;
    }
  }

  private async checkAuthentication(report: SystemHealthReport) {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) { report.errors.push(`Session error: ${sessionError.message}`); return; }
      if (!session?.user) { report.errors.push('No active session or user'); return; }
      
      report.authentication.isAuthenticated = true;
      report.authentication.userId = session.user.id;
      report.authentication.sessionValid = true;
      
      const { data: profile, error: profileError } = await supabase.from('profiles').select('id, name').eq('id', session.user.id).single();
      if (profileError) { report.errors.push(`Profile lookup error: ${profileError.message}`); } else if (profile) { report.authentication.userExists = true; }
      
      const { data: roleData, error: roleError } = await supabase.from('user_roles').select('role').eq('user_id', session.user.id).single();
      if (roleError) { report.errors.push(`Role lookup error: ${roleError.message}`); } else if (roleData) { report.authentication.hasRole = true; report.authentication.role = roleData.role; }
    } catch (error) {
      report.errors.push(`Authentication check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async verifyPolicies(report: SystemHealthReport) {
    try {
      const { data: verificationData, error } = await supabase.rpc('verify_complete_fix');
      if (error) { report.errors.push(`Policy verification failed: ${error.message}`); return; }
      if (verificationData) {
        const response = verificationData as VerificationResponse;
        report.policies.userRolesPolicyCount = response.policy_count || 0;
        report.policies.policiesCorrect = response.fix_status === 'SUCCESS';
        if ((response.policy_count || 0) !== 2) { report.errors.push(`Incorrect policy count: ${response.policy_count || 0} (expected 2)`); }
      }
    } catch (error) {
      report.errors.push(`Policy verification error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async testDataAccess(report: SystemHealthReport) {
    const tables = ['profiles', 'assignments', 'cars', 'user_roles', 'vacations'] as const;
    const keys: (keyof SystemHealthReport['dataAccess'])[] = ['profilesAccessible', 'assignmentsAccessible', 'carsAccessible', 'userRolesAccessible', 'vacationsAccessible'];
    
    for (let i = 0; i < tables.length; i++) {
      try {
        const { error } = await supabase.from(tables[i]).select('count').limit(1);
        if (!error) { report.dataAccess[keys[i]] = true; } else { report.errors.push(`${tables[i]} access error: ${error.message}`); }
      } catch (error) {
        report.errors.push(`${tables[i]} test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  }

  private assessOverallHealth(report: SystemHealthReport) {
    const criticalIssues = [!report.authentication.isAuthenticated, !report.authentication.sessionValid, !report.policies.policiesCorrect, !report.dataAccess.userRolesAccessible].filter(Boolean).length;
    const minorIssues = [!report.authentication.userExists, !report.authentication.hasRole, !report.dataAccess.profilesAccessible, !report.dataAccess.assignmentsAccessible, !report.dataAccess.carsAccessible, !report.dataAccess.vacationsAccessible].filter(Boolean).length;

    if (criticalIssues === 0 && minorIssues === 0) { report.overallHealth = 'HEALTHY'; }
    else if (criticalIssues === 0 && minorIssues <= 2) { report.overallHealth = 'DEGRADED'; }
    else { report.overallHealth = 'CRITICAL'; }
  }

  async quickHealthCheck(): Promise<boolean> {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) return false;
      const { error: userRolesError } = await supabase.from('user_roles').select('count').limit(1);
      if (userRolesError) return false;
      const { error: profilesError } = await supabase.from('profiles').select('count').limit(1);
      if (profilesError) return false;
      return true;
    } catch { return false; }
  }
}

export const systemHealthService = new SystemHealthService();
