
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, Car, Clock, Users } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useVacations } from '@/hooks/useVacations';
import { format } from 'date-fns';
import { Assignment } from '@/types/assignment';

const SystemMetricsOverview: React.FC = () => {
  const { t } = useTranslation();
  const { assignments } = usePlannerAssignments();
  const { vacations } = useVacations();
  
  // Get today's date in YYYY-MM-DD format
  const today = format(new Date(), 'yyyy-MM-dd');
  
  // Filter for today's assignments
  const todaysAssignments = assignments.filter(assignment => 
    assignment.date === today && assignment.published === true
  );
  
  // Filter for active vacations (approved and current/upcoming)
  const activeVacations = vacations.filter(vacation => 
    vacation.status === 'approved' && 
    new Date(vacation.endDate) >= new Date()
  );
  
  // Calculate total number of employees assigned today
  const getUniqueEmployeesCount = (assignments: Assignment[]): number => {
    const uniqueEmployees = new Set();
    assignments.forEach(assignment => {
      assignment.employees.forEach(employee => {
        uniqueEmployees.add(employee);
      });
    });
    return uniqueEmployees.size;
  };
  
  const activeEmployeesCount = getUniqueEmployeesCount(todaysAssignments);
  
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <MetricCard 
        title={t('dashboard.metrics.todayTasks')} 
        value={todaysAssignments.length.toString()}
        description={t('dashboard.metrics.tasksDescription')} 
        icon={<Clock className="h-5 w-5 text-polygon-blue" />}
        className="bg-gradient-to-br from-blue-50 to-sky-50"
      />
      <MetricCard 
        title={t('dashboard.metrics.activeEmployees')} 
        value={activeEmployeesCount.toString()}
        description={t('dashboard.metrics.employeesDescription')} 
        icon={<Users className="h-5 w-5 text-green-500" />}
        className="bg-gradient-to-br from-green-50 to-emerald-50"
      />
      <MetricCard 
        title={t('dashboard.metrics.activeCars')} 
        value={todaysAssignments.filter(a => a.car).length.toString()}
        description={t('dashboard.metrics.carsDescription')} 
        icon={<Car className="h-5 w-5 text-amber-500" />}
        className="bg-gradient-to-br from-amber-50 to-yellow-50"
      />
      <MetricCard 
        title={t('dashboard.metrics.onVacation')} 
        value={activeVacations.length.toString()}
        description={t('dashboard.metrics.vacationDescription')} 
        icon={<Calendar className="h-5 w-5 text-purple-500" />}
        className="bg-gradient-to-br from-purple-50 to-pink-50"
      />
    </div>
  );
};

interface MetricCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, description, icon, className }) => {
  return (
    <Card className={`${className} hover:shadow-md transition-shadow`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
};

export default SystemMetricsOverview;
