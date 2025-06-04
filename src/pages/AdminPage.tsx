
import React from 'react';
import PageHeader from '../components/Layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePermissions } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useNavigate } from 'react-router-dom';
import UserManagement from '@/components/Admin/UserManagement';
import { useAssignmentsConsolidated } from '@/hooks/useAssignmentsConsolidated';
import { useEmployees } from '@/hooks/useEmployees';
import { useCars } from '@/hooks/car';
import { useVacations } from '@/hooks/useVacations';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Car, 
  Calendar, 
  ClipboardCheck, 
  TrendingUp, 
  Activity,
  UserCheck,
  AlertTriangle,
  CheckCircle,
  Settings
} from 'lucide-react';

const AdminPage: React.FC = () => {
  const { isAdmin } = usePermissions();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = React.useState("overview");
  const { assignments } = useAssignmentsConsolidated({ filter: 'all' });
  const { employees } = useEmployees();
  const { cars } = useCars();
  const { vacations } = useVacations();

  // Redirect if not an admin
  React.useEffect(() => {
    if (!isAdmin) {
      navigate('/dashboard');
    }
  }, [isAdmin, navigate]);

  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');

  // Helper function to check if an employee is on vacation today
  const isEmployeeOnVacationToday = (employeeId: string) => {
    const todayDate = new Date(today);
    todayDate.setHours(0, 0, 0, 0);
    
    return vacations.some(vacation => {
      if (vacation.employeeId !== employeeId || vacation.status !== 'approved') {
        return false;
      }
      
      const startDate = new Date(vacation.startDate);
      const endDate = new Date(vacation.endDate);
      
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(0, 0, 0, 0);
      
      return todayDate >= startDate && todayDate <= endDate;
    });
  };

  // Helper function to check if employee has assignments today
  const hasAssignmentsToday = (employeeId: string, employeeName: string) => {
    return assignments.some(assignment => 
      assignment.date === today && 
      assignment.published &&
      assignment.employees && 
      assignment.employees.includes(employeeName)
    );
  };

  // Calculate actually available employees (not on leave, not on vacation, no assignments today)
  const availableEmployees = employees.filter(employee => {
    const isOnLeave = employee.onLeave;
    const isOnVacation = isEmployeeOnVacationToday(employee.id);
    const hasAssignments = hasAssignmentsToday(employee.id, employee.name);
    
    return !isOnLeave && !isOnVacation && !hasAssignments;
  });

  const vehiclesCount = cars.length;
  const availableVehiclesCount = cars.filter(c => c.is_available).length;
  
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

  // Quick stats for overview - removed employee count metric
  const quickStats = [
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
      status: availableEmployees.length > employees.length * 0.5 ? 'good' : 'warning',
      message: t('admin.systemHealth.staffAvailable', { available: availableEmployees.length, total: employees.length }),
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
    <div className="min-h-screen w-full bg-gradient-to-br from-gray-25 via-background to-gray-50">
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 py-6 space-y-8">
        {/* Enhanced Header with Glassmorphism */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/80 p-8 text-white shadow-2xl animate-fade-in-up">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl transform translate-x-32 -translate-y-32"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-2xl transform -translate-x-16 translate-y-16"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold tracking-tight">
                {t('admin.title')}
              </h1>
              <p className="text-blue-100 text-lg font-medium">
                {t('admin.systemOverview.description')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center justify-center w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30">
                <Settings className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* Admin Content */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
          <div className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">{t('admin.tabs.overview')}</TabsTrigger>
                <TabsTrigger value="users">{t('admin.tabs.users')}</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-6 space-y-6">
                {/* Quick Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                        <UserCheck className="h-6 w-6 mx-auto mb-2 text-polygon-blue" />
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
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
