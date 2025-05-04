
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '@/components/Admin/UserManagement';
import SystemMetrics from '@/components/Admin/SystemMetrics';

const AdminPage: React.FC = () => {
  const { isAdmin } = usePermissions();
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
        title="Admin Dashboard"
        description="System management and settings"
      />

      <Tabs defaultValue="metrics" className="mb-8">
        <TabsList>
          <TabsTrigger value="metrics">System Metrics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
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
