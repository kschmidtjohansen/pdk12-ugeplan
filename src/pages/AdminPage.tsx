
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '@/components/Admin/UserManagement';
import SystemMetrics from '@/components/Admin/SystemMetrics';

const AdminPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Redirect if not an admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  return (
    <>
      <PageHeader
        title={t('admin.title')}
        description={t('admin.description')}
      />

      <Tabs defaultValue="metrics" className="mb-8">
        <TabsList>
          <TabsTrigger value="metrics">{t('admin.tabs.metrics')}</TabsTrigger>
          <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="mt-6">
          <SystemMetrics />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AdminPage;
