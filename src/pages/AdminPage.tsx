
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '@/components/Admin/UserManagement';
import SystemMetrics from '@/components/Admin/SystemMetrics';
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
      title: 'Total Users',
      value: usersCount,
      subtitle: `${activeUsersCount} active`,
      icon: <Users className="h-6 w-6" />,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      onClick: () => setActiveTab("users")
    },
    {
      title: 'Vehicles',
      value: vehiclesCount,
      subtitle: `${availableVehiclesCount} available`,
      icon: <Car className="h-6 w-6" />,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      onClick: () => navigate('/cars')
    },
    {
      title: 'Pending Vacations',
      value: pendingVacationCount,
      subtitle: `${approvedVacationCount} approved`,
      icon: <Calendar className="h-6 w-6" />,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      onClick: () => navigate('/vacation')
    },
    {
      title: 'Today\'s Tasks',
      value: todayAssignments,
      subtitle: `${totalAssignments} total`,
      icon: <ClipboardCheck className="h-6 w-6" />,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      onClick: () => navigate('/planner')
    }
  ];

  // System health indicators
  const systemHealth = [
    {
      title: 'Assignment Publishing',
      status: unpublishedAssignments === 0 ? 'good' : 'warning',
      message: unpublishedAssignments === 0 ? 'All assignments published' : `${unpublishedAssignments} unpublished`,
      icon: unpublishedAssignments === 0 ? <CheckCircle className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />
    },
    {
      title: 'Vehicle Utilization',
      status: inUseVehiclesCount > 0 ? 'good' : 'info',
      message: `${inUseVehiclesCount}/${vehiclesCount} vehicles in use`,
      icon: <Activity className="h-5 w-5" />
    },
    {
      title: 'Staff Availability',
      status: activeUsersCount > usersCount * 0.8 ? 'good' : 'warning',
      message: `${activeUsersCount}/${usersCount} staff available`,
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
        description="Comprehensive system administration and monitoring"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">System Overview</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
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
                System Health
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
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button 
                  onClick={() => navigate('/planner')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <ClipboardCheck className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
                  <p className="text-sm font-medium">View Planner</p>
                </button>
                <button 
                  onClick={() => navigate('/employees')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Users className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
                  <p className="text-sm font-medium">Manage Staff</p>
                </button>
                <button 
                  onClick={() => navigate('/cars')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Car className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
                  <p className="text-sm font-medium">Fleet Management</p>
                </button>
                <button 
                  onClick={() => navigate('/vacation')}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors text-center"
                >
                  <Calendar className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
                  <p className="text-sm font-medium">Vacation Requests</p>
                </button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="metrics" className="mt-6">
          <SystemMetrics 
            onUsersClick={() => setActiveTab("users")}
            onVehiclesClick={() => navigate('/cars')}
            onVacationClick={() => navigate('/vacation')}
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
      </Tabs>
    </>
  );
};

export default AdminPage;
