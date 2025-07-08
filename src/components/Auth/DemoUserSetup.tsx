import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, AlertTriangle, User } from 'lucide-react';
import { createDemoUser } from '@/utils/createDemoUser';

export const DemoUserSetup: React.FC = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCreateDemoUser = async () => {
    setIsCreating(true);
    setResult(null);
    
    try {
      const createResult = await createDemoUser();
      setResult(createResult);
    } catch (error) {
      setResult({
        success: false,
        message: 'An unexpected error occurred.'
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto mt-4">
      <CardHeader className="space-y-1">
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Demo User Setup</CardTitle>
        </div>
        <CardDescription>
          Create a demo user account for testing the system
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
            <AlertDescription>{result.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            This will create a demo user with the following credentials:
          </p>
          <div className="bg-gray-50 p-3 rounded-md text-sm">
            <div><strong>Email:</strong> test@polygongroup.com</div>
            <div><strong>Password:</strong> TesterbrugerPlan123</div>
            <div><strong>Role:</strong> Administrator</div>
          </div>
        </div>

        <Button 
          onClick={handleCreateDemoUser}
          disabled={isCreating}
          className="w-full"
        >
          {isCreating ? (
            <div className="flex items-center gap-2">
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
              Creating Demo User...
            </div>
          ) : (
            'Create Demo User'
          )}
        </Button>

        {result?.success && (
          <div className="text-center">
            <p className="text-sm text-green-600">
              Demo user created successfully! You can now log in with the credentials above.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};