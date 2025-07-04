
import React from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';
import { useCars } from '@/hooks/car';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, UserCheck, Calendar, Users, Car } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { getCurrentWeekInfo, getWeekDates } from '@/utils/dates';
import { da } from 'date-fns/locale';

const MineOpgaver: React.FC = () => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { assignments, loading, error } = useAssignmentDataOptimized();
  const { cars } = useCars();

  // Filter assignments for current week only
  const userAssignments = React.useMemo(() => {
    if (!user?.id || !assignments) return [];
    
    const { week: currentWeek, year: currentYear } = getCurrentWeekInfo();
    const currentWeekDates = getWeekDates(currentWeek, currentYear);
    
    console.log('[MineOpgaver] COMPREHENSIVE FIX - Filtering assignments:', {
      userName: user.name,
      userId: user.id,
      totalAssignments: assignments.length,
      currentWeek,
      currentYear
    });
    
    const userTasks = assignments.filter(assignment => {
      // Check if user is assigned via assignedEmployees (preferred) or legacy employees array
      const isAssignedViaNew = assignment.assignedEmployees?.some(emp => emp.id === user.id);
      const isAssignedViaLegacy = assignment.employees?.includes(user.name);
      const isResponsible = assignment.responsibleUser?.id === user.id;
      const assignmentDate = parseISO(assignment.date);
      
      // Check if assignment is in current week
      const isInCurrentWeek = assignmentDate >= currentWeekDates.start && assignmentDate <= currentWeekDates.end;
      
      const isUserInvolved = isAssignedViaNew || isAssignedViaLegacy || isResponsible;
      
      console.log(`[MineOpgaver] Assignment "${assignment.title}":`, {
        currentUserId: user.id,
        currentUserName: user.name,
        isAssignedViaNew,
        isAssignedViaLegacy,
        isResponsible,
        isInCurrentWeek,
        isUserInvolved,
        published: assignment.published,
        assignedEmployeeIds: assignment.assignedEmployees?.map(e => e.id),
        assignedEmployeeNames: assignment.assignedEmployees?.map(e => e.name),
        legacyEmployees: assignment.employees,
        responsibleUserId: assignment.responsibleUser?.id
      });
      
      return isUserInvolved && isInCurrentWeek; // FIXED: Removed published filter so servicemedarbejder can see all assignments they're involved in
    });

    return userTasks.sort((a, b) => {
      const dateA = parseISO(a.date);
      const dateB = parseISO(b.date);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    }).slice(0, 5); // Show max 5 upcoming tasks
  }, [assignments, user]);

  // Helper function to get car names from assignment
  const getCarNames = (assignment: any): string[] => {
    const carNames: string[] = [];
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array with IDs
      assignment.cars.forEach((carId: string) => {
        if (carId) {
          const car = cars.find(c => c.id === carId);
          if (car) {
            carNames.push(car.name);
          } else {
            carNames.push(`Car ${carId.substring(0, 8)}`);
          }
        }
      });
    } else if (assignment.car) {
      // Old format: single car
      if (typeof assignment.car === 'string') {
        const car = cars.find(c => c.id === assignment.car);
        if (car) {
          carNames.push(car.name);
        } else {
          carNames.push(`Car ${assignment.car.substring(0, 8)}`);
        }
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    return carNames;
  };

  // PHASE 3 FIX: Enhanced date formatting
  const formatAssignmentDate = (dateStr: string) => {
    const date = parseISO(dateStr);
    const locale = currentLanguage === 'da' ? da : undefined;
    
    if (isToday(date)) {
      return t('common.today') || 'I dag';
    } else if (isTomorrow(date)) {
      return t('common.tomorrow') || 'I morgen';
    } else {
      return format(date, 'EEE d. MMM', { locale });
    }
  };


  console.log(`[MineOpgaver] PHASE 3 FIX - User assignments:`, {
    userName: user?.name,
    totalAssignments: assignments.length,
    userAssignments: userAssignments.length,
    assignmentsWithResponsible: userAssignments.filter(a => a.responsibleUser).length,
    assignmentsWithFullEmployeeData: userAssignments.filter(a => a.assignedEmployees?.length).length
  });

  if (loading) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('dashboard.myTasks') || 'Mine Opgaver'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <Spinner size="sm" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('dashboard.myTasks') || 'Mine Opgaver'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground">
            {t('common.error') || 'Fejl ved indlæsning'}
          </p>
        </CardContent>
      </Card>
    );
  }

  if (userAssignments.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('dashboard.myTasks') || 'Mine Opgaver'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground text-center">
            {t('dashboard.noUpcomingTasks') || 'Ingen kommende opgaver'}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          {t('dashboard.myTasks') || 'Mine Opgaver'}
          <Badge variant="secondary" className="ml-auto">
            {userAssignments.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {userAssignments.map((assignment) => (
          <div
            key={assignment.id}
            className="flex flex-col space-y-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            {/* Title and Date */}
            <div className="flex items-start justify-between">
              <h4 className="font-medium text-sm leading-tight">
                {assignment.title}
              </h4>
              <Badge 
                variant="outline" 
                className={`text-xs ${
                  isToday(parseISO(assignment.date)) 
                    ? 'bg-primary/10 text-primary border-primary/20' 
                    : 'bg-muted'
                }`}
              >
                {formatAssignmentDate(assignment.date)}
              </Badge>
            </div>

            {/* Location */}
            {assignment.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{assignment.location}</span>
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{assignment.fromTime?.substring(0, 5)} - {assignment.toTime?.substring(0, 5)}</span>
            </div>

            {/* Cars */}
            {(() => {
              const carNames = getCarNames(assignment);
              return carNames.length > 0 ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Car className="h-3 w-3" />
                  <span>{carNames.join(', ')}</span>
                </div>
              ) : null;
            })()}

            {/* Show all team members for assignments user can access */}
            {(assignment.assignedEmployees?.length || assignment.employees?.length) && (() => {
              let teamMembers = [];
              
              if (assignment.assignedEmployees?.length) {
                // Show all team members
                teamMembers = assignment.assignedEmployees.map(emp => emp.name);
              } else if (assignment.employees?.length) {
                // Show all team members from legacy format
                teamMembers = assignment.employees;
              }
              
              return teamMembers.length > 0 ? (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="h-3 w-3" />
                  <span>{teamMembers.join(', ')}</span>
                </div>
              ) : null;
            })()}

            {/* Show Sagsansvarlig if present */}
            {assignment.responsibleUser?.name && (
              <div className="flex items-center gap-1 text-xs text-indigo-600">
                <UserCheck className="h-3 w-3" />
                <span className="font-medium">
                  {t('planner.responsibleUser') || 'Sagsansvarlig'}: {assignment.responsibleUser.name}
                </span>
              </div>
            )}
          </div>
        ))}

        {/* View all link */}
        <div className="pt-2 border-t">
          <button 
            className="text-xs text-primary hover:underline w-full text-center"
            onClick={() => window.location.href = '/planner'}
          >
            {t('dashboard.viewAllTasks') || 'Se alle opgaver'} →
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default MineOpgaver;
