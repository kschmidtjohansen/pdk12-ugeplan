
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Trash2, RefreshCw, Database, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { cleanupFalsePositiveSecurityLogs, cleanupOldSecurityLogs, optimizeSecurityLogsTable } from '@/utils/databaseCleanup';
import { useToast } from '@/components/ui/use-toast';

export const SystemCleanupPanel: React.FC = () => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: any }>({});

  // Only show to admin users
  if (!user || user.role !== 'administrator') {
    return null;
  }

  const handleCleanupFalsePositives = async () => {
    setLoading(prev => ({ ...prev, falsePositives: true }));
    
    try {
      const result = await cleanupFalsePositiveSecurityLogs();
      setResults(prev => ({ ...prev, falsePositives: result }));
      
      if (result.success) {
        toast({
          title: "Cleanup Successful",
          description: `Removed ${result.deletedCount} false positive security logs`,
        });
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Cleanup Error",
        description: "Failed to cleanup false positive logs",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, falsePositives: false }));
    }
  };

  const handleCleanupOldLogs = async () => {
    setLoading(prev => ({ ...prev, oldLogs: true }));
    
    try {
      const result = await cleanupOldSecurityLogs(30);
      setResults(prev => ({ ...prev, oldLogs: result }));
      
      if (result.success) {
        toast({
          title: "Cleanup Successful",
          description: `Removed ${result.deletedCount} old security logs`,
        });
      } else {
        toast({
          title: "Cleanup Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Cleanup Error",
        description: "Failed to cleanup old logs",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, oldLogs: false }));
    }
  };

  const handleOptimizeTable = async () => {
    setLoading(prev => ({ ...prev, optimize: true }));
    
    try {
      const result = await optimizeSecurityLogsTable();
      setResults(prev => ({ ...prev, optimize: result }));
      
      if (result.success) {
        toast({
          title: "Optimization Requested",
          description: "Table optimization has been logged for review",
        });
      } else {
        toast({
          title: "Optimization Failed",
          description: result.error || "Unknown error occurred",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Optimization Error",
        description: "Failed to request table optimization",
        variant: "destructive",
      });
    } finally {
      setLoading(prev => ({ ...prev, optimize: false }));
    }
  };

  const getResultIcon = (result: any) => {
    if (!result) return null;
    if (result.success) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getResultBadge = (result: any) => {
    if (!result) return null;
    return (
      <Badge variant={result.success ? "default" : "destructive"}>
        {result.success ? "Success" : "Failed"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">System Cleanup & Maintenance</h2>
        <p className="text-muted-foreground">
          Manage database cleanup and system optimization tasks
        </p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Important:</strong> These operations will modify your database. 
          False positive cleanup removes incorrectly flagged security events, 
          while old logs cleanup removes non-critical logs older than 30 days.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* False Positives Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>False Positives</span>
              {getResultIcon(results.falsePositives)}
            </CardTitle>
            <CardDescription>
              Remove incorrectly flagged security events like normal mouse movements
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCleanupFalsePositives}
              disabled={loading.falsePositives}
              className="w-full"
              variant="outline"
            >
              <Trash2 className={`h-4 w-4 mr-2 ${loading.falsePositives ? 'animate-spin' : ''}`} />
              Clean False Positives
            </Button>
            
            {results.falsePositives && (
              <div className="space-y-2">
                {getResultBadge(results.falsePositives)}
                <p className="text-sm text-muted-foreground">
                  {results.falsePositives.success 
                    ? `Removed ${results.falsePositives.deletedCount} false positive logs`
                    : `Error: ${results.falsePositives.error}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Old Logs Cleanup */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Old Logs</span>
              {getResultIcon(results.oldLogs)}
            </CardTitle>
            <CardDescription>
              Remove non-critical security logs older than 30 days
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleCleanupOldLogs}
              disabled={loading.oldLogs}
              className="w-full"
              variant="outline"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading.oldLogs ? 'animate-spin' : ''}`} />
              Clean Old Logs
            </Button>
            
            {results.oldLogs && (
              <div className="space-y-2">
                {getResultBadge(results.oldLogs)}
                <p className="text-sm text-muted-foreground">
                  {results.oldLogs.success 
                    ? `Removed ${results.oldLogs.deletedCount} old logs`
                    : `Error: ${results.oldLogs.error}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Table Optimization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Optimize Tables</span>
              {getResultIcon(results.optimize)}
            </CardTitle>
            <CardDescription>
              Request database table optimization for better performance
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button
              onClick={handleOptimizeTable}
              disabled={loading.optimize}
              className="w-full"
              variant="outline"
            >
              <Database className={`h-4 w-4 mr-2 ${loading.optimize ? 'animate-spin' : ''}`} />
              Optimize Tables
            </Button>
            
            {results.optimize && (
              <div className="space-y-2">
                {getResultBadge(results.optimize)}
                <p className="text-sm text-muted-foreground">
                  {results.optimize.success 
                    ? "Optimization request logged"
                    : `Error: ${results.optimize.error}`
                  }
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cleanup Summary</CardTitle>
          <CardDescription>
            Overview of all cleanup operations performed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>False Positives Cleaned:</span>
              <span className="font-medium">
                {results.falsePositives?.success ? results.falsePositives.deletedCount : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Old Logs Cleaned:</span>
              <span className="font-medium">
                {results.oldLogs?.success ? results.oldLogs.deletedCount : 'N/A'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Table Optimization:</span>
              <span className="font-medium">
                {results.optimize?.success ? 'Requested' : 'N/A'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
