
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '@/components/Admin/UserManagement';
import SystemMetrics from '@/components/Admin/SystemMetrics';
import { SecurityValidation } from '@/components/Admin/SecurityValidation';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { format } from 'date-fns';

const AdminPage: React.FC = () => {
  const { isAdmin, isSuperadmin } = usePermissions();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("metrics");
  const { assignments } = usePlannerAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();

  // Redirect if not an admin or superadmin
  React.useEffect(() => {
    if (!isAdmin && !isSuperadmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, isSuperadmin, navigate]);

  // Don't render anything if user doesn't have access
  if (!isAdmin && !isSuperadmin) {
    return null;
  }

  // Calculate metrics based on real data
  const usersCount = employees.length;
  const activeUsersCount = employees.filter(e => !e.onLeave).length;
  const vehiclesCount = cars.length;
  
  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Count vehicles in use today based on assignments
  const inUseVehiclesCount = assignments
    .filter(a => a.date === today && a.car)
    .reduce((uniqueCars, assignment) => {
      const carId = typeof assignment.car === 'string' ? assignment.car : assignment.car?.id;
      if (carId && !uniqueCars.includes(carId)) {
        uniqueCars.push(carId);
      }
      return uniqueCars;
    }, [] as string[]).length;
  
  // Count pending vacation requests
  const pendingVacationCount = vacations.filter(v => v.status === 'pending').length;

  const handleUsersClick = () => {
    setActiveTab("users");
  };

  const handleVehiclesClick = () => {
    navigate('/cars');
  };

  const handleVacationClick = () => {
    navigate('/vacation');
  };

  const handleTasksClick = () => {
    navigate('/planner');
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
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>
        <TabsContent value="metrics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Scheduled tasks metric card */}
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
            usersCount={usersCount}
            vehiclesCount={vehiclesCount}
            pendingVacationCount={pendingVacationCount}
            activeUsersCount={activeUsersCount}
            inUseVehiclesCount={inUseVehiclesCount}
          />
        </TabsContent>
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
        <TabsContent value="security" className="mt-6">
          <SecurityValidation />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AdminPage;
