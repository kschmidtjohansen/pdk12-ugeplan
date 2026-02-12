import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Shield, Users, Building2, Layers, Settings } from 'lucide-react';
import UserManagement from '@/components/Admin/UserManagement';
import DepartmentManagement from '@/components/Admin/DepartmentManagement';
import SubDepartmentManagement from '@/components/Admin/SubDepartmentManagement';
import FeatureToggleManagement from '@/components/Admin/FeatureToggleManagement';
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

  const isSuperAdmin = user?.role === 'super_admin';
  const isAdmin = user?.role === 'administrator';

  if (!user || (!isSuperAdmin && !isAdmin)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <Shield className="h-4 w-4" />
          <AlertDescription>{t('accessDenied.message')}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const defaultTab = isSuperAdmin ? 'departments' : 'users';

  return (
    <div className="container mx-auto px-4 py-8">
      <VacationCleanupHandler />

      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold">{t('admin.title')}</h1>
        </div>

        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList className="w-full justify-start flex-wrap h-auto gap-1 p-1">
            {isSuperAdmin && (
              <TabsTrigger value="departments" className="gap-2">
                <Building2 className="h-4 w-4" />
                {t('admin.tabs.departments')}
              </TabsTrigger>
            )}
            <TabsTrigger value="subdepartments" className="gap-2">
              <Layers className="h-4 w-4" />
              {t('admin.tabs.subDepartments')}
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" />
              {t('admin.tabs.users')}
            </TabsTrigger>
            <TabsTrigger value="features" className="gap-2">
              <Settings className="h-4 w-4" />
              {t('admin.tabs.features')}
            </TabsTrigger>
          </TabsList>

          {isSuperAdmin && (
            <TabsContent value="departments" className="animate-fade-in">
              <DepartmentManagement />
            </TabsContent>
          )}

          <TabsContent value="subdepartments" className="animate-fade-in">
            <SubDepartmentManagement />
          </TabsContent>

          <TabsContent value="users" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>{t('admin.userManagement.title')}</CardTitle>
                <CardDescription>{t('admin.userManagement.description')}</CardDescription>
              </CardHeader>
              <CardContent>
                <UserManagement />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="animate-fade-in">
            <FeatureToggleManagement />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
