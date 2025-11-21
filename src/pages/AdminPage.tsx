import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Stethoscope } from 'lucide-react';
import UserManagement from '@/components/Admin/UserManagement';
import { SickLeaveStatisticsPanel } from '@/components/Admin/SickLeaveStatisticsPanel';
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

        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{t('admin.tabs.users')}</span>
            </TabsTrigger>
            <TabsTrigger value="sick-leave" className="flex items-center space-x-2">
              <Stethoscope className="h-4 w-4" />
              <span>Sygdomsstatistik</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="users" className="space-y-6">
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
          </TabsContent>

          <TabsContent value="sick-leave" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Sygdomsstatistik
                </CardTitle>
                <CardDescription>
                  Statistik over sygefravær i afdelingen. Kun synlig for administratorer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SickLeaveStatisticsPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>;
};
export default AdminPage;