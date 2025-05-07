
import React from 'react';
import { useTranslation } from '../context/TranslationContext';
import { usePermissions } from '../context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagementContainer from '../components/Admin/UserManagementContainer';
import SystemMetrics from '../components/Admin/SystemMetrics';
import { AlertTriangle } from 'lucide-react';

const AdminPage = () => {
  const { t } = useTranslation();
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <AlertTriangle className="mx-auto h-12 w-12 text-yellow-500" />
          <h1 className="text-2xl font-semibold">{t('accessDenied.title')}</h1>
          <p className="text-muted-foreground">{t('accessDenied.adminRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      <header>
        <h1 className="text-3xl font-bold">{t('navigation.admin')}</h1>
        <p className="text-muted-foreground">{t('admin.description')}</p>
      </header>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="users">{t('admin.users')}</TabsTrigger>
          <TabsTrigger value="system">{t('admin.system')}</TabsTrigger>
        </TabsList>
        <TabsContent value="users">
          <UserManagementContainer />
        </TabsContent>
        <TabsContent value="system">
          <SystemMetrics />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
