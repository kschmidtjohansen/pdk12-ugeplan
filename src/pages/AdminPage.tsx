import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users } from 'lucide-react';
import UserManagement from '@/components/Admin/UserManagement';
import VacationCleanupHandler from '@/components/Vacation/VacationCleanupHandler';

const AdminPage: React.FC = () => {
  const {
    user,
    loading
  } = useAuth();
  const {
    t
  } = useTranslation();
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  if (!user || user.role !== 'administrator') {
    return <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {t('accessDenied.message')}
          </AlertDescription>
        </Alert>
      </div>;
  }
  return <div className="container mx-auto px-4 py-8">
      <VacationCleanupHandler />
      
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{t('admin.userManagement.title')}</CardTitle>
            <CardDescription>
              {t('admin.userManagement.description')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserManagement />
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default AdminPage;