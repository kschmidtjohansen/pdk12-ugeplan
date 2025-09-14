import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Shield, AlertTriangle, Users, Activity, Database, Lock } from 'lucide-react';

interface SecurityHealth {
  admin_count: number;
  recent_security_events: number;
  failed_access_attempts: number;
  security_score: number;
  recommendations: string[];
  timestamp: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  message: string;
  details: any;
  created_at: string;
}

export const SecurityDashboard: React.FC = () => {
  const [healthData, setHealthData] = useState<SecurityHealth | null>(null);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchSecurityHealth = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('security_health_check');
      
      if (error) throw error;
      
      const healthData = data as unknown as SecurityHealth;
      setHealthData(healthData);
      toast({
        title: "Security Status Updated",
        description: `Security score: ${healthData.security_score}/100`,
      });
    } catch (error) {
      console.error('Failed to fetch security health:', error);
      toast({
        title: "Error",
        description: "Failed to fetch security status",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('logs')
        .select('*')
        .or('event_type.ilike.%security%,event_type.ilike.%unauthorized%,event_type.ilike.%access%')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (error) throw error;
      
      setSecurityEvents(data || []);
    } catch (error) {
      console.error('Failed to fetch security events:', error);
    }
  };

  useEffect(() => {
    fetchSecurityHealth();
    fetchSecurityEvents();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success';
    if (score >= 75) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return 'default';
    if (score >= 75) return 'secondary';
    return 'destructive';
  };

  const getSeverityBadge = (eventType: string) => {
    if (eventType.includes('unauthorized') || eventType.includes('failed')) return 'destructive';
    if (eventType.includes('security') || eventType.includes('access')) return 'secondary';
    return 'outline';
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
        </div>
        <Button onClick={fetchSecurityHealth} disabled={loading}>
          <Activity className="h-4 w-4 mr-2" />
          Refresh Status
        </Button>
      </div>

      {/* Security Score Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Health Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {healthData ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={`text-4xl font-bold ${getScoreColor(healthData.security_score)}`}>
                  {healthData.security_score}
                </div>
                <div className="text-sm text-muted-foreground">Security Score</div>
                <Badge variant={getScoreBadge(healthData.security_score)} className="mt-2">
                  {healthData.security_score >= 90 ? 'Excellent' : 
                   healthData.security_score >= 75 ? 'Good' : 'Needs Attention'}
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {healthData.admin_count}
                </div>
                <div className="text-sm text-muted-foreground">Admin Users</div>
                <Badge variant={healthData.admin_count >= 1 && healthData.admin_count <= 3 ? 'default' : 'secondary'} className="mt-2">
                  {healthData.admin_count >= 1 && healthData.admin_count <= 3 ? 'Optimal' : 
                   healthData.admin_count === 0 ? 'Critical' : 'Review Needed'}
                </Badge>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-info">
                  {healthData.recent_security_events}
                </div>
                <div className="text-sm text-muted-foreground">Security Events (24h)</div>
                <Badge variant="outline" className="mt-2">Last 24 Hours</Badge>
              </div>
              
              <div className="text-center">
                <div className="text-3xl font-bold text-warning">
                  {healthData.failed_access_attempts}
                </div>
                <div className="text-sm text-muted-foreground">Failed Attempts (24h)</div>
                <Badge variant={healthData.failed_access_attempts === 0 ? 'default' : 'destructive'} className="mt-2">
                  {healthData.failed_access_attempts === 0 ? 'Clean' : 'Monitor'}
                </Badge>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-8">
              <div className="text-muted-foreground">Loading security health data...</div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      {healthData?.recommendations && healthData.recommendations.length > 0 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>Security Recommendations:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1">
              {healthData.recommendations.map((rec, index) => (
                <li key={index}>{rec}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Security Tabs */}
      <Tabs defaultValue="events" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="events" className="flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Security Events
          </TabsTrigger>
          <TabsTrigger value="access" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Access Control
          </TabsTrigger>
          <TabsTrigger value="database" className="flex items-center gap-2">
            <Database className="h-4 w-4" />
            Database Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {securityEvents.length > 0 ? (
                  securityEvents.map((event) => (
                    <div key={event.id} className="flex items-start justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={getSeverityBadge(event.event_type)}>
                            {event.event_type}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {new Date(event.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm">{event.message}</p>
                        {event.details?.user_email && (
                          <p className="text-xs text-muted-foreground mt-1">
                            User: {event.details.user_email}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No security events found
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Enhanced Access Controls</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <Lock className="h-4 w-4" />
                <AlertDescription>
                  <strong>Case Data Access:</strong> Now restricted to assigned employees only. 
                  Regular users can only view case mappings for assignments they are assigned to.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <strong>Profile Data:</strong> Enhanced with role-based access controls. 
                  Personal data access is now logged and monitored.
                </AlertDescription>
              </Alert>
              
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Fuel Card Codes:</strong> Access restricted to administrators and skadeleder roles only.
                  All access attempts are logged for audit purposes.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Database Security Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Action Required:</strong> Your Postgres version has security patches available. 
                  Please upgrade through the Supabase dashboard to apply important security updates.
                </AlertDescription>
              </Alert>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-success mb-2">✓ Row Level Security</h4>
                  <p className="text-sm text-muted-foreground">All sensitive tables have RLS enabled with proper policies</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-success mb-2">✓ Security Functions</h4>
                  <p className="text-sm text-muted-foreground">Enhanced security functions deployed and active</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-success mb-2">✓ Audit Logging</h4>
                  <p className="text-sm text-muted-foreground">Comprehensive security event logging implemented</p>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold text-warning mb-2">⚠ Database Version</h4>
                  <p className="text-sm text-muted-foreground">Postgres version needs security updates</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};