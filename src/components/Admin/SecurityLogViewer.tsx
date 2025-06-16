
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, AlertTriangle, Info, Eye, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

interface SecurityLog {
  id: string;
  event_type: string;
  message: string;
  details: any;
  created_at: string;
}

export const SecurityLogViewer: React.FC = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<SecurityLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      
      let query = supabase
        .from('logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (filter !== 'all') {
        query = query.eq('event_type', filter);
      }
      
      const { data, error: fetchError } = await query;
      
      if (fetchError) {
        throw fetchError;
      }
      
      setLogs(data || []);
    } catch (err) {
      console.error('[SecurityLogViewer] Error fetching logs:', err);
      setError('Failed to fetch security logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const getSeverityIcon = (eventType: string) => {
    if (eventType.includes('error') || eventType.includes('failure')) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    if (eventType.includes('security') || eventType.includes('auth')) {
      return <Shield className="h-4 w-4 text-yellow-500" />;
    }
    return <Info className="h-4 w-4 text-blue-500" />;
  };

  const getSeverityVariant = (eventType: string): "default" | "secondary" | "destructive" | "outline" => {
    if (eventType.includes('error') || eventType.includes('failure')) {
      return 'destructive';
    }
    if (eventType.includes('security') || eventType.includes('auth')) {
      return 'default';
    }
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Security Logs</h2>
          <p className="text-muted-foreground">Monitor security events and system activities</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter logs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Events</SelectItem>
              <SelectItem value="auth_attempt">Auth Attempts</SelectItem>
              <SelectItem value="auth_failure">Auth Failures</SelectItem>
              <SelectItem value="security_error">Security Errors</SelectItem>
              <SelectItem value="unauthorized_access">Unauthorized Access</SelectItem>
              <SelectItem value="input_validation_error">Validation Errors</SelectItem>
              <SelectItem value="admin_action">Admin Actions</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchLogs} disabled={loading} size="sm" variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        {logs.length === 0 && !loading ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">No security logs found</p>
            </CardContent>
          </Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="transition-all hover:shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    {getSeverityIcon(log.event_type)}
                    <Badge variant={getSeverityVariant(log.event_type)}>
                      {log.event_type}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-sm font-medium">{log.message}</CardTitle>
              </CardHeader>
              
              {expandedLog === log.id && (
                <CardContent className="pt-0">
                  <div className="bg-gray-50 p-3 rounde-md">
                    <h4 className="font-semibold mb-2">Event Details</h4>
                    <pre className="text-xs bg-white p-2 rounded border overflow-auto max-h-40">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
};
