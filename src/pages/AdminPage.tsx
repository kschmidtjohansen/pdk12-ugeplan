
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '@/components/Admin/UserManagement';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  Car, 
  Calendar, 
  ClipboardCheck, 
  TrendingUp, 
  Activity,
  UserCheck,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("overview");
  const { assignments } = usePlannerAssignments();
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();

  // Redirect if not an admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Calculate comprehensive metrics
  const usersCount = employees.length;
  const activeUsersCount = employees.filter(e => !e.onLeave).length;
  const vehiclesCount = cars.length;
  const availableVehiclesCount = cars.filter(c => c.is_available).length;
  
  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Count vehicles in use today
  const inUseVehiclesCount = assignments
    .filter(a => a.date === today && a.car)
    .reduce((uniqueCars, assignment) => {
      const carId = typeof assignment.car === 'string' ? assignment.car : assignment.car?.id;
      if (carId && !uniqueCars.includes(carId)) {
        uniqueCars.push(carId);
      }
      return uniqueCars;
    }, [] as string[]).length;
  
  // Vacation metrics
  const pendingVacationCount = vacations.filter(v => v.status === 'pending').length;
  const approvedVacationCount = vacations.filter(v => v.status === 'approved').length;
  
  // Assignment metrics
  const totalAssignments = assignments.length;
  const publishedAssignments = assignments.filter(a => a.published).length;
  const unpublishedAssignments = totalAssignments - publishedAssignments;
  const todayAssignments = assignments.filter(a => a.date === today).length;

  // Quick stats for overview
  const quickStats = [
    {
      title: t('admin.quickStats.totalUsers'),
      value: usersCount,
      subtitle: `${activeUsersCount} ${t('admin.quickStats.active')}`,
      icon: <Users className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => setActiveTab("users")
    },
    {
      title: t('admin.quickStats.vehicles'),
      value: vehiclesCount,
      subtitle: `${availableVehiclesCount} ${t('admin.quickStats.available')}`,
      icon: <Car className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => navigate('/cars')
    },
    {
      title: t('admin.quickStats.pendingVacations'),
      value: pendingVacationCount,
      subtitle: `${approvedVacationCount} ${t('admin.quickStats.approved')}`,
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => navigate('/vacation')
    },
    {
      title: t('admin.quickStats.todaysTasks'),
      value: todayAssignments,
      subtitle: `${totalAssignments} ${t('admin.quickStats.total')}`,
      icon: <ClipboardCheck className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => navigate('/planner')
    }
  ];

  // System health indicators
  const systemHealth = [
    {
      title: t('admin.systemHealth.assignmentPublishing'),
      status: unpublishedAssignments === 0 ? 'good' : 'warning',
      message: unpublishedAssignments === 0 ? t('admin.systemHealth.allAssignmentsPublished') : t('admin.systemHealth.unpublishedTasks', { count: unpublishedAssignments }),
      icon: unpublishedAssignments === 0 ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />
    },
    {
      title: t('admin.systemHealth.vehicleUtilization'),
      status: inUseVehiclesCount > 0 ? 'good' : 'info',
      message: t('admin.systemHealth.vehiclesInUse', { inUse: inUseVehiclesCount, total: vehiclesCount }),
      icon: <Activity className="h-5 w-5" />
    },
    {
      title: t('admin.systemHealth.staffAvailability'),
      status: activeUsersCount > usersCount * 0.8 ? 'good' : 'warning',
      message: t('admin.systemHealth.staffAvailable', { available: activeUsersCount, total: usersCount }),
      icon: <UserCheck className="h-5 w-5" />
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-blue-600 bg-blue-50';
    }
  };

  return (
    <>
      <PageHeader
        title={t('admin.title')}
        description={t('admin.systemOverview.description')}
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
          <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="mt-6 space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {quickStats.map((stat, index) => (
              <Card 
                key={index} 
                className="cursor-pointer hover:shadow-md transition-all duration-200 hover:border-polygon-blue"
                onClick={stat.onClick}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                    </div>
                    <div className={`p-3 rounded-full ${stat.bgColor} ${stat.color}`}>
                      {stat.icon}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* System Health */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                {t('admin.systemHealth.title')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {systemHealth.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-full ${getStatusColor(item.status)}`}>
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-medium">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.message}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>{t('admin.quickActions.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => navigate('/planner')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
                  <p className="text-sm font-medium">{t('admin.quickActions.viewPlanner')}</p>
                </button>
                <button 
                  onClick={() => navigate('/employees')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
                  <p className="text-sm font-medium">{t('admin.quickActions.manageStaff')}</p>
                </button>
                <button 
                  onClick={() => navigate('/cars')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Car className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
                  <p className="text-sm font-medium">{t('admin.quickActions.fleetManagement')}</p>
                </button>
                <button 
                  onClick={() => navigate('/vacation')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
                  <p className="text-sm font-medium">{t('admin.quickActions.vacationRequests')}</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="users" className="mt-6">
          <UserManagement />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AdminPage;
