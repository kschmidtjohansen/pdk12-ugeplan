
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Shield, Users, Settings, BarChart3, Activity, Zap } from 'lucide-react';
import UserManagement from '@/components/Admin/UserManagement';
import { SystemHealthDashboard } from '@/components/Admin/SystemHealthDashboard';
import { SecurityLogViewer } from '@/components/Admin/SecurityLogViewer';
import { ComprehensiveDiagnosticsPanel } from '@/components/Admin/ComprehensiveDiagnosticsPanel';
import { PerformanceMonitoringPanel } from '@/components/Admin/PerformanceMonitoringPanel';
import VacationCleanupHandler from '@/components/Vacation/VacationCleanupHandler';

const AdminPage: React.FC = () => {
  const { user, loading } = useAuth();
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || user.role !== 'administrator') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>
            {t('accessDenied.message')}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <VacationCleanupHandler />
      
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>{t('admin.tabs.overview')}</span>
            </TabsTrigger>
            <TabsTrigger value="diagnostics" className="flex items-center space-x-2">
              <Activity className="h-4 w-4" />
              <span>{t('admin.tabs.diagnostics')}</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center space-x-2">
              <Zap className="h-4 w-4" />
              <span>{t('admin.tabs.performance')}</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>{t('admin.tabs.users')}</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>{t('admin.tabs.security')}</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>{t('admin.tabs.system')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.dashboard.title')}</CardTitle>
                <CardDescription>
                  {t('admin.dashboard.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemHealthDashboard />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="diagnostics" className="space-y-6">
            <ComprehensiveDiagnosticsPanel />
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <PerformanceMonitoringPanel />
          </TabsContent>

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

          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.security.title')}</CardTitle>
                <CardDescription>
                  {t('admin.security.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SecurityLogViewer />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="system" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.systemHealth.title')}</CardTitle>
                <CardDescription>
                  {t('admin.systemHealth.description')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SystemHealthDashboard />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
