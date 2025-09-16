import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import { SecurityManager } from '@/services/securityManager';
import { useSecurityPermissions } from '@/hooks/useSecurityAwareData';

interface SecurityEvent {
  event_type: string;
  event_count: number;
  last_occurrence: string;
  affected_users: number;
}

interface SecurityConfig {
  profileAccess: boolean;
  carAccess: boolean;
  assignmentAccess: boolean;
  fuelCodeAccess: boolean;
  adminAccess: boolean;
  errors: string[];
}

export const SecurityStatusPanel: React.FC = () => {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const permissions = useSecurityPermissions();

  const fetchSecurityData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [events, config] = await Promise.all([
        SecurityManager.getSecurityEventsSummary(),
        SecurityManager.testSecurityConfiguration()
      ]);

      setSecurityEvents(events);
      setSecurityConfig(config);
    } catch (err) {
      const errorMessage = SecurityManager.handleSecurityError(err, 'SecurityStatusPanel');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSecurityData();
  }, []);

  const getSecurityScore = () => {
    if (!securityConfig) return 0;
    
    const checks = [
      securityConfig.profileAccess,
      securityConfig.carAccess,
      securityConfig.assignmentAccess,
      !securityConfig.errors.length
    ];
    
    return Math.round((checks.filter(Boolean).length / checks.length) * 100);
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  if (!permissions.isAdmin) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Administrator privileges required to view security status.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6" />
          <h2 className="text-2xl font-bold">Security Status</h2>
        </div>
        <Button 
          onClick={fetchSecurityData} 
          disabled={loading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Security Score */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {securityConfig && getScoreIcon(getSecurityScore())}
              <span className={`text-2xl font-bold ${securityConfig ? getScoreColor(getSecurityScore()) : ''}`}>
                {securityConfig ? getSecurityScore() : '--'}%
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Based on security configuration checks
            </p>
          </CardContent>
        </Card>

        {/* Current Permissions */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Permissions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Profile Access</span>
              <Badge variant={permissions.canViewProfiles ? "default" : "secondary"}>
                {permissions.canViewProfiles ? "Granted" : "Restricted"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Fuel Codes</span>
              <Badge variant={permissions.canViewFuelCodes ? "default" : "secondary"}>
                {permissions.canViewFuelCodes ? "Granted" : "Restricted"}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Admin Role</span>
              <Badge variant={permissions.isAdmin ? "default" : "secondary"}>
                {permissions.isAdmin ? "Active" : "None"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Security Events */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Recent Security Events</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            {securityEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No security events recorded</p>
            ) : (
              <div className="space-y-2">
                {securityEvents.slice(0, 3).map((event, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="truncate">{event.event_type}</span>
                    <Badge variant="outline" className="text-xs">
                      {event.event_count}
                    </Badge>
                  </div>
                ))}
                {securityEvents.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{securityEvents.length - 3} more events
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Security Configuration Details */}
      {securityConfig && (
        <Card>
          <CardHeader>
            <CardTitle>Security Configuration</CardTitle>
            <CardDescription>Current RLS policy status and access controls</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                {securityConfig.profileAccess ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <span className="text-sm">Profile Access</span>
              </div>
              <div className="flex items-center space-x-2">
                {securityConfig.carAccess ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <span className="text-sm">Car Access</span>
              </div>
              <div className="flex items-center space-x-2">
                {securityConfig.assignmentAccess ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <span className="text-sm">Assignment Access</span>
              </div>
              <div className="flex items-center space-x-2">
                {securityConfig.fuelCodeAccess ? 
                  <CheckCircle className="h-4 w-4 text-green-600" /> : 
                  <XCircle className="h-4 w-4 text-red-600" />
                }
                <span className="text-sm">Fuel Code Access</span>
              </div>
            </div>

            {securityConfig.errors.length > 0 && (
              <div className="mt-4">
                <h4 className="text-sm font-medium mb-2">Configuration Issues:</h4>
                <div className="space-y-1">
                  {securityConfig.errors.map((error, index) => (
                    <Alert key={index} variant="destructive" className="py-2">
                      <AlertDescription className="text-xs">{error}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};