import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, XCircle, Shield, AlertTriangle, Play } from 'lucide-react';
import { 
  SecurityValidator, 
  SecurityTestResult, 
  runQuickSecurityCheck,
  testMultiDepartmentFunctionality 
} from '@/utils/securityValidation';
import { useToast } from '@/hooks/use-toast';

interface SecurityValidationProps {
  className?: string;
}

export const SecurityValidation: React.FC<SecurityValidationProps> = ({ className }) => {
  const [testResults, setTestResults] = useState<SecurityTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const { toast } = useToast();

  const runSecurityTests = async () => {
    setIsRunning(true);
    try {
      const results = await testMultiDepartmentFunctionality();
      setTestResults(results);
      setLastRunTime(new Date());
      
      const summary = {
        total: results.length,
        passed: results.filter(r => r.passed).length,
        failed: results.filter(r => !r.passed).length
      };

      toast({
        title: "Security Tests Completed",
        description: `${summary.passed}/${summary.total} tests passed`,
        variant: summary.passed === summary.total ? "default" : "destructive"
      });
    } catch (error) {
      toast({
        title: "Security Test Error",
        description: "Failed to run security validation tests",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const runQuickCheck = async () => {
    setIsRunning(true);
    try {
      await runQuickSecurityCheck();
    } catch (error) {
      toast({
        title: "Quick Check Error",
        description: "Failed to run quick security check",
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getTestIcon = (passed: boolean) => {
    return passed ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getTestBadge = (passed: boolean) => {
    return (
      <Badge variant={passed ? "default" : "destructive"}>
        {passed ? "PASSED" : "FAILED"}
      </Badge>
    );
  };

  const summary = testResults.length > 0 ? {
    total: testResults.length,
    passed: testResults.filter(r => r.passed).length,
    failed: testResults.filter(r => !r.passed).length,
    successRate: Math.round((testResults.filter(r => r.passed).length / testResults.length) * 100)
  } : null;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Multi-Department Security Validation
          </CardTitle>
          <CardDescription>
            Comprehensive security testing for the multi-department system
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Test Controls */}
          <div className="flex gap-3">
            <Button 
              onClick={runSecurityTests}
              disabled={isRunning}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              {isRunning ? 'Running Tests...' : 'Run Full Security Tests'}
            </Button>
            <Button 
              variant="outline"
              onClick={runQuickCheck}
              disabled={isRunning}
            >
              Quick Security Check
            </Button>
          </div>

          {/* Test Summary */}
          {summary && (
            <Alert className={summary.successRate >= 80 ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Test Summary:</strong> {summary.passed}/{summary.total} tests passed 
                ({summary.successRate}% success rate)
                {lastRunTime && (
                  <span className="text-muted-foreground ml-2">
                    • Last run: {lastRunTime.toLocaleTimeString()}
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">Test Results</h4>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div 
                    key={index}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      {getTestIcon(result.passed)}
                      <div>
                        <div className="font-medium text-sm">{result.testName}</div>
                        <div className="text-xs text-muted-foreground">{result.message}</div>
                      </div>
                    </div>
                    {getTestBadge(result.passed)}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Security Guidelines */}
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-foreground mb-3">Security Features Validated</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Row Level Security (RLS) enabled on all tables</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Department-aware data isolation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Role-based access control</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Cross-department admin access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Secure edge function authentication</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>User permission validation</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};