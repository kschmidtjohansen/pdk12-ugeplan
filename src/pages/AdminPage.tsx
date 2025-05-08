
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '@/components/Admin/UserManagement';
import SystemMetrics from '@/components/Admin/SystemMetrics';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';

const AdminPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("metrics");
  const { assignments } = usePlannerAssignments();

  // Redirect if not an admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/Dashboard');
    }
  }, [isAdmin, navigate]);

  const handleUsersClick = () => {
    setActiveTab("users");
  };

  const handleVehiclesClick = () => {
    navigate('/Biler');
  };

  const handleVacationClick = () => {
    navigate('/Fridage');
  };

  const handleTasksClick = () => {
    navigate('/Ugeplan');
  };

  return (
    <>
      <PageHeader
        title={t('admin.title')}
        description={t('admin.description')}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList>
          <TabsTrigger value="metrics">{t('admin.tabs.metrics')}</TabsTrigger>
          <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Additional scheduled tasks metric card */}
            <div 
              className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
              onClick={handleTasksClick}
            >
              <h3 className="font-medium text-lg">{t('admin.systemMetrics.scheduledTasks')}</h3>
              <p className="text-3xl font-bold text-polygon-blue mt-2">{assignments ? assignments.length : 0}</p>
              <p className="text-sm text-muted-foreground mt-1">{t('admin.systemMetrics.scheduledTasksDesc')}</p>
            </div>
          </div>
          
          <SystemMetrics 
            onUsersClick={handleUsersClick}
            onVehiclesClick={handleVehiclesClick}
            onVacationClick={handleVacationClick}
          />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AdminPage;
