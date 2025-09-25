import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Shield, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface SecurityStatus {
  monitoring_timestamp: string;
  recent_violations_24h: number;
  failed_logins_1h: number;
  suspicious_activities_24h: number;
  security_status: 'healthy' | 'warning' | 'critical';
  recommendations: string[];
}

export const SecurityMonitoringWidget: React.FC = () => {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSecurityStatus = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('enhanced_security_monitor');
      
      if (error) {
        console.error('Security monitoring error:', error);
        toast({
          variant: "destructive",
          title: "Security Monitoring Error",
          description: "Failed to fetch security status",
        });
        return;
      }

      // Type guard and safe parsing
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const parsedData = data as unknown as SecurityStatus;
        // Validate required fields exist
        if (parsedData.monitoring_timestamp && 
            typeof parsedData.recent_violations_24h === 'number' &&
            typeof parsedData.failed_logins_1h === 'number' &&
            typeof parsedData.suspicious_activities_24h === 'number' &&
            parsedData.security_status &&
            Array.isArray(parsedData.recommendations)) {
          setSecurityStatus(parsedData);
        }
      }
    } catch (error) {
      console.error('Security monitoring failed:', error);
      toast({
        variant: "destructive",
        title: "Monitoring Failed",
        description: "Unable to check security status",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      fetchSecurityStatus();
      // Auto-refresh every 5 minutes
      const interval = setInterval(fetchSecurityStatus, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  if (!isAdmin) {
    return null;
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'critical':
        return <Shield className="h-5 w-5 text-red-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Monitoring
          </CardTitle>
          <CardDescription>
            Real-time security status and threat detection
          </CardDescription>
        </div>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={fetchSecurityStatus}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {securityStatus && (
          <>
            {/* Overall Status */}
            <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
              <div className="flex items-center gap-3">
                {getStatusIcon(securityStatus.security_status)}
                <div>
                  <p className="font-medium">System Security Status</p>
                  <p className="text-sm text-muted-foreground">
                    Last updated: {new Date(securityStatus.monitoring_timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <Badge className={getStatusColor(securityStatus.security_status)}>
                {securityStatus.security_status.toUpperCase()}
              </Badge>
            </div>

            {/* Security Metrics */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-lg border bg-card">
                <p className="text-2xl font-bold text-primary">{securityStatus.recent_violations_24h}</p>
                <p className="text-sm text-muted-foreground">Security Events (24h)</p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-card">
                <p className="text-2xl font-bold text-orange-600">{securityStatus.failed_logins_1h}</p>
                <p className="text-sm text-muted-foreground">Failed Logins (1h)</p>
              </div>
              <div className="text-center p-4 rounded-lg border bg-card">
                <p className={`text-2xl font-bold ${securityStatus.suspicious_activities_24h > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {securityStatus.suspicious_activities_24h}
                </p>
                <p className="text-sm text-muted-foreground">Threats (24h)</p>
              </div>
            </div>

            {/* Recommendations */}
            {securityStatus.recommendations.length > 0 && (
              <div className="p-4 rounded-lg border bg-card">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Security Recommendations
                </h4>
                <ul className="space-y-1">
                  {securityStatus.recommendations.map((recommendation, index) => (
                    <li key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-primary">•</span>
                      {recommendation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="flex items-center justify-center p-8">
            <div className="flex items-center gap-2 text-muted-foreground">
              <RefreshCw className="h-4 w-4 animate-spin" />
              Loading security status...
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};