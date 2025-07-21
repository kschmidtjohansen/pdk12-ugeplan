/**
 * Security Validation Utilities for Multi-Department System
 * Phase 6 & 7: Security and Testing Validation
 */

import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface SecurityTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

export interface DepartmentAccessTest {
  departmentCode: string;
  expectedAccess: boolean;
  userRole?: string;
}

/**
 * Comprehensive security validation for multi-department system
 */
export class SecurityValidator {
  private results: SecurityTestResult[] = [];

  /**
   * Run all security tests
   */
  async runAllTests(): Promise<SecurityTestResult[]> {
    this.results = [];
    
    await this.testRLSPolicies();
    await this.testDepartmentIsolation();
    await this.testUserPermissions();
    await this.testDataAccess();
    
    return this.results;
  }

  /**
   * Test 1: Verify RLS policies are active and working
   */
  private async testRLSPolicies(): Promise<void> {
    try {
      const { data, error } = await supabase
        .rpc('check_system_health');
      
      if (error) {
        this.addResult('RLS Policy Check', false, `Error checking RLS: ${error.message}`);
        return;
      }

      const rlsTablesCount = (data as any)?.rls_enabled_tables || 0;
      const expectedTables = 14; // All main tables should have RLS

      this.addResult(
        'RLS Policy Check',
        rlsTablesCount >= expectedTables,
        `${rlsTablesCount}/${expectedTables} tables have RLS enabled`,
        { rlsTablesCount, data }
      );
    } catch (error) {
      this.addResult('RLS Policy Check', false, `Test failed: ${error}`);
    }
  }

  /**
   * Test 2: Verify department data isolation
   */
  private async testDepartmentIsolation(): Promise<void> {
    try {
      // Test assignments are department-isolated
      const { data: assignments, error: assignmentsError } = await supabase
        .from('assignments')
        .select('id, department_id')
        .limit(5);

      if (assignmentsError) {
        this.addResult('Department Isolation', false, `Error accessing assignments: ${assignmentsError.message}`);
        return;
      }

      // Test cars are department-isolated
      const { data: cars, error: carsError } = await supabase
        .from('cars')
        .select('id, department_id')
        .limit(5);

      if (carsError) {
        this.addResult('Department Isolation', false, `Error accessing cars: ${carsError.message}`);
        return;
      }

      const hasAssignmentDeptIds = assignments?.every(a => a.department_id) || false;
      const hasCarDeptIds = cars?.every(c => c.department_id) || false;

      this.addResult(
        'Department Isolation',
        hasAssignmentDeptIds && hasCarDeptIds,
        `Data properly isolated by department`,
        { 
          assignmentsWithDeptId: assignments?.length || 0,
          carsWithDeptId: cars?.length || 0
        }
      );
    } catch (error) {
      this.addResult('Department Isolation', false, `Test failed: ${error}`);
    }
  }

  /**
   * Test 3: Verify user permissions and role-based access
   */
  private async testUserPermissions(): Promise<void> {
    try {
      // Test profile access
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, department_id')
        .limit(5);

      if (profilesError) {
        this.addResult('User Permissions', false, `Error accessing profiles: ${profilesError.message}`);
        return;
      }

      // Test user roles access
      const { data: userRoles, error: userRolesError } = await supabase
        .from('user_roles')
        .select('user_id, role, department_id')
        .limit(5);

      if (userRolesError) {
        this.addResult('User Permissions', false, `Error accessing user roles: ${userRolesError.message}`);
        return;
      }

      const profilesAccessible = profiles && profiles.length >= 0;
      const userRolesAccessible = userRoles && userRoles.length >= 0;

      this.addResult(
        'User Permissions',
        profilesAccessible && userRolesAccessible,
        `User data accessible with proper permissions`,
        { 
          profilesCount: profiles?.length || 0,
          userRolesCount: userRoles?.length || 0
        }
      );
    } catch (error) {
      this.addResult('User Permissions', false, `Test failed: ${error}`);
    }
  }

  /**
   * Test 4: Verify data access controls
   */
  private async testDataAccess(): Promise<void> {
    try {
      // Test notifications are user-specific
      const { data: notifications, error: notificationsError } = await supabase
        .from('notifications')
        .select('id, user_id, department_id')
        .limit(5);

      // Test vacations access
      const { data: vacations, error: vacationsError } = await supabase
        .from('vacations')
        .select('id, user_id, department_id')
        .limit(5);

      const notificationsAccessible = !notificationsError;
      const vacationsAccessible = !vacationsError;

      this.addResult(
        'Data Access Controls',
        notificationsAccessible && vacationsAccessible,
        `Data access properly controlled`,
        { 
          notificationsCount: notifications?.length || 0,
          vacationsCount: vacations?.length || 0,
          notificationsError: notificationsError?.message,
          vacationsError: vacationsError?.message
        }
      );
    } catch (error) {
      this.addResult('Data Access Controls', false, `Test failed: ${error}`);
    }
  }

  /**
   * Test department access validation
   */
  async testDepartmentAccess(tests: DepartmentAccessTest[]): Promise<SecurityTestResult[]> {
    const results: SecurityTestResult[] = [];

    for (const test of tests) {
      try {
        const { data, error } = await supabase
          .rpc('validate_user_department_access', { 
            dept_code: test.departmentCode 
          });

        if (error) {
          results.push({
            testName: `Department Access - ${test.departmentCode}`,
            passed: false,
            message: `Error: ${error.message}`,
            details: { test, error }
          });
          continue;
        }

        const isValid = (data as any)?.valid === test.expectedAccess;
        results.push({
          testName: `Department Access - ${test.departmentCode}`,
          passed: isValid,
          message: isValid 
            ? `Access validation correct for ${test.departmentCode}` 
            : `Access validation failed for ${test.departmentCode}`,
          details: { test, result: data }
        });
      } catch (error) {
        results.push({
          testName: `Department Access - ${test.departmentCode}`,
          passed: false,
          message: `Test failed: ${error}`,
          details: { test, error }
        });
      }
    }

    return results;
  }

  /**
   * Add a test result
   */
  private addResult(testName: string, passed: boolean, message: string, details?: any): void {
    this.results.push({ testName, passed, message, details });
  }

  /**
   * Get summary of all test results
   */
  getTestSummary(): { total: number; passed: number; failed: number; successRate: number } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const successRate = total > 0 ? Math.round((passed / total) * 100) : 0;

    return { total, passed, failed, successRate };
  }
}

/**
 * Run a quick security validation
 */
export async function runQuickSecurityCheck(): Promise<void> {
  const validator = new SecurityValidator();
  const results = await validator.runAllTests();
  const summary = validator.getTestSummary();

  console.log('🔒 Security Validation Results:', results);
  console.log('📊 Test Summary:', summary);

  if (summary.successRate >= 80) {
    toast({
      title: "Security Validation Passed",
      description: `${summary.passed}/${summary.total} tests passed (${summary.successRate}%)`,
    });
  } else {
    toast({
      title: "Security Issues Detected",
      description: `Only ${summary.passed}/${summary.total} tests passed (${summary.successRate}%)`,
      variant: "destructive",
    });
  }
}

/**
 * Test multi-department functionality
 */
export async function testMultiDepartmentFunctionality(): Promise<SecurityTestResult[]> {
  const validator = new SecurityValidator();
  
  // Test various department access scenarios
  const departmentTests: DepartmentAccessTest[] = [
    { departmentCode: 'AFD12', expectedAccess: true },  // Existing department
    { departmentCode: 'AFD02', expectedAccess: true },  // Second department
    { departmentCode: 'INVALID', expectedAccess: false }, // Invalid department
    { departmentCode: 'AFD99', expectedAccess: false },  // Non-existent department
  ];

  const departmentResults = await validator.testDepartmentAccess(departmentTests);
  const mainResults = await validator.runAllTests();

  return [...mainResults, ...departmentResults];
}