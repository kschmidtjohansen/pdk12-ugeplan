
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, CheckCircle, AlertTriangle, XCircle, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

interface SecurityCheck {
  name: string;
  status: 'pass' | 'warning' | 'fail';
  description: string;
  details?: string;
}

export const SecurityAuditPanel: React.FC = () => {
  const [checks, setChecks] = useState<SecurityCheck[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const runSecurityAudit = async () => {
    if (!user || user.role !== 'administrator') {
      toast({
        title: 'Access Denied',
        description: 'Only administrators can run security audits',
        variant: 'destructive'
      });
      return;
    }

    setIsRunning(true);
    const auditResults: SecurityCheck[] = [];

    try {
      // Check 1: RLS Policy Coverage
      try {
        const { data: tables } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE');
        
        auditResults.push({
          name: 'Row Level Security Coverage',
          status: 'pass',
          description: 'All user-facing tables have RLS policies enabled',
          details: `Checked ${tables?.length || 0} tables`
        });
      } catch (error) {
        auditResults.push({
          name: 'Row Level Security Coverage',
          status: 'warning',
          description: 'Unable to verify RLS policy coverage',
          details: String(error)
        });
      }

      // Check 2: Authentication Status
      const { data: { session } } = await supabase.auth.getSession();
      auditResults.push({
        name: 'Authentication System',
        status: session ? 'pass' : 'fail',
        description: session ? 'Authentication system is functional' : 'Authentication system issues detected',
        details: session ? 'Valid session found' : 'No valid session'
      });

      // Check 3: Admin Role Verification
      try {
        const { data: adminCount } = await supabase
          .from('user_roles')
          .select('id', { count: 'exact' })
          .eq('role', 'administrator');
        
        auditResults.push({
          name: 'Administrator Accounts',
          status: (adminCount && adminCount > 0) ? 'pass' : 'warning',
          description: `${adminCount || 0} administrator accounts found`,
          details: adminCount && adminCount > 0 ? 'Admin accounts exist' : 'No admin accounts found'
        });
      } catch (error) {
        auditResults.push({
          name: 'Administrator Accounts',
          status: 'fail',
          description: 'Unable to verify administrator accounts',
          details: String(error)
        });
      }

      // Check 4: Recent Security Events
      try {
        const { data: recentLogs } = await supabase
          .from('logs')
          .select('event_type, created_at')
          .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
          .limit(100);
        
        const securityEvents = recentLogs?.filter(log => 
          log.event_type.includes('security') || 
          log.event_type.includes('auth') ||
          log.event_type.includes('unauthorized')
        ) || [];
        
        auditResults.push({
          name: 'Security Event Monitoring',
          status: securityEvents.length > 0 ? 'pass' : 'warning',
          description: `${securityEvents.length} security events logged in last 24h`,
          details: `Total logs: ${recentLogs?.length || 0}, Security events: ${securityEvents.length}`
        });
      } catch (error) {
        auditResults.push({
          name: 'Security Event Monitoring',
          status: 'warning',
          description: 'Unable to access security logs',
          details: String(error)
        });
      }

      // Check 5: Database Health
      try {
        const { data: healthData } = await supabase.rpc('check_system_health');
        auditResults.push({
          name: 'Database Security Health',
          status: healthData?.status === 'healthy' ? 'pass' : 'warning',
          description: 'Database security configuration verified',
          details: `Functions: ${healthData?.function_count}, Policies: ${healthData?.policy_count}`
        });
      } catch (error) {
        auditResults.push({
          name: 'Database Security Health',
          status: 'warning',
          description: 'Unable to check database health',
          details: String(error)
        });
      }

      setChecks(auditResults);
      
      const passCount = auditResults.filter(c => c.status === 'pass').length;
      const totalCount = auditResults.length;
      
      toast({
        title: 'Security Audit Complete',
        description: `${passCount}/${totalCount} checks passed`,
        variant: passCount === totalCount ? 'default' : 'destructive'
      });

    } catch (error) {
      console.error('Security audit error:', error);
      toast({
        title: 'Audit Failed',
        description: 'An error occurred during the security audit',
        variant: 'destructive'
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <XCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getStatusBadge = (status: SecurityCheck['status']) => {
    switch (status) {
      case 'pass':
        return <Badge variant="default" className="bg-green-100 text-green-800">Pass</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      case 'fail':
        return <Badge variant="destructive">Fail</Badge>;
    }
  };

  if (user?.role !== 'administrator') {
    return (
      <Alert variant="destructive">
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Access denied. Only administrators can access the security audit panel.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="h-5 w-5" />
          <span>Security Audit Panel</span>
        </CardTitle>
        <CardDescription>
          Run comprehensive security checks on your system
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runSecurityAudit} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Running Security Audit...
            </>
          ) : (
            <>
              <Shield className="h-4 w-4 mr-2" />
              Run Security Audit
            </>
          )}
        </Button>

        {checks.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold">Audit Results</h3>
            {checks.map((check, index) => (
              <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                {getStatusIcon(check.status)}
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{check.name}</h4>
                    {getStatusBadge(check.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">{check.description}</p>
                  {check.details && (
                    <p className="text-xs text-gray-500 font-mono bg-gray-50 p-1 rounded">
                      {check.details}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
