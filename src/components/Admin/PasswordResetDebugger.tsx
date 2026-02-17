
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const PasswordResetDebugger: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<string[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const addResult = (message: string) => {
    if (import.meta.env.DEV) console.log('[PasswordResetDebugger]', message);
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setResults([]);
    
    try {
      addResult('🔍 Starting password reset diagnostics...');
      
      // Test 1: Check current user authentication
      addResult('📋 Test 1: Checking current user authentication');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        addResult(`❌ Session error: ${sessionError.message}`);
      } else if (!session) {
        addResult('❌ No active session found');
      } else {
        addResult(`✅ Valid session found (expires: ${new Date(session.expires_at * 1000).toLocaleString()})`);
        addResult(`📋 User ID: ${session.user.id}`);
        addResult(`📋 User email: ${session.user.email}`);
      }
      
      // Test 2: Check user role
      addResult('📋 Test 2: Checking user role');
      if (user) {
        addResult(`📋 Current user role: ${user.role}`);
        if (user.role === 'administrator') {
          addResult('✅ User has administrator role');
        } else {
          addResult('❌ User does not have administrator role');
        }
      } else {
        addResult('❌ No user data available');
      }
      
      // Test 3: Test edge function connectivity
      addResult('📋 Test 3: Testing edge function connectivity');
      try {
        const response = await fetch(`https://cyuyrpwtkljfiqwgasmn.supabase.co/functions/v1/admin-reset-password`, {
          method: 'OPTIONS',
          headers: {
            'Origin': window.location.origin,
          }
        });
        
        addResult(`📋 OPTIONS response status: ${response.status}`);
        addResult(`📋 Response headers: ${JSON.stringify(Object.fromEntries(response.headers.entries()))}`);
        
        if (response.ok) {
          addResult('✅ Edge function is accessible');
        } else {
          addResult(`❌ Edge function returned status ${response.status}`);
        }
      } catch (fetchError) {
        addResult(`❌ Edge function connectivity failed: ${fetchError}`);
      }
      
      // Test 4: Test Supabase client configuration
      addResult('📋 Test 4: Testing Supabase client configuration');
      addResult(`📋 Supabase URL: https://cyuyrpwtkljfiqwgasmn.supabase.co`);
      addResult(`📋 Current origin: ${window.location.origin}`);
      
      // Test 5: Test a simple database query
      addResult('📋 Test 5: Testing database connectivity');
      try {
        const { data: testData, error: testError } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        if (testError) {
          addResult(`❌ Database query failed: ${testError.message}`);
        } else {
          addResult('✅ Database connectivity is working');
        }
      } catch (dbError) {
        addResult(`❌ Database test failed: ${dbError}`);
      }
      
      // Test 6: Test authentication with edge function (safe test)
      addResult('📋 Test 6: Testing edge function authentication');
      if (session?.access_token) {
        try {
          // Make a test request to see if authentication works
          const testResponse = await fetch(`https://cyuyrpwtkljfiqwgasmn.supabase.co/functions/v1/admin-reset-password`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
              'Origin': window.location.origin
            },
            body: JSON.stringify({
              userId: 'test-invalid-uuid',
              newPassword: 'TestPassword123'
            })
          });
          
          const testResponseText = await testResponse.text();
          addResult(`📋 Test auth response status: ${testResponse.status}`);
          addResult(`📋 Test auth response: ${testResponseText.substring(0, 200)}...`);
          
          if (testResponse.status === 400) {
            addResult('✅ Authentication working (400 expected for invalid UUID)');
          } else if (testResponse.status === 401) {
            addResult('❌ Authentication failed (401 Unauthorized)');
          } else if (testResponse.status === 403) {
            addResult('❌ Access denied (403 Forbidden)');
          } else {
            addResult(`📋 Unexpected status: ${testResponse.status}`);
          }
        } catch (authTestError) {
          addResult(`❌ Authentication test failed: ${authTestError}`);
        }
      } else {
        addResult('❌ No access token available for authentication test');
      }
      
      addResult('🎯 Diagnostics completed!');
      
    } catch (error) {
      addResult(`❌ Diagnostic error: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  const copyResults = () => {
    const resultsText = results.join('\n');
    navigator.clipboard.writeText(resultsText);
    toast({
      title: 'Results Copied',
      description: 'Diagnostic results copied to clipboard',
    });
  };

  return (
    <Card className="w-full max-w-4xl">
      <CardHeader>
        <CardTitle>Password Reset Debugger</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex space-x-2">
          <Button 
            onClick={runDiagnostics} 
            disabled={isRunning}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isRunning ? 'Running Diagnostics...' : 'Run Diagnostics'}
          </Button>
          <Button 
            onClick={clearResults} 
            variant="outline"
            disabled={results.length === 0}
          >
            Clear Results
          </Button>
          <Button 
            onClick={copyResults} 
            variant="outline"
            disabled={results.length === 0}
          >
            Copy Results
          </Button>
        </div>
        
        {results.length > 0 && (
          <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">Diagnostic Results:</h3>
            <div className="font-mono text-sm space-y-1">
              {results.map((result, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PasswordResetDebugger;
