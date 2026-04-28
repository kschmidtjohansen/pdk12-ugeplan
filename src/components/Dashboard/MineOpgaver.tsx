
import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTranslation } from '@/context/TranslationContext';
import { useAssignmentDataOptimized } from '@/hooks/assignment/useAssignmentDataOptimized';
import { useCars } from '@/hooks/car';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, UserCheck, Calendar, Users, Car, Navigation, Package } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import { getCurrentWeekInfo, getWeekDates } from '@/utils/dates';
import { da } from 'date-fns/locale';
import { filterDisplayNames } from '@/utils/people';
import AssignmentDetailsDialog from './AssignmentDetailsDialog';
import { getSeriesSiblingIds } from '@/utils/assignmentSeries';
import { Assignment } from '@/types/assignment';
import { useWarehouseIndicators } from '@/hooks/warehouse/useWarehouseIndicators';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MineOpgaverProps {
  selectedWeek?: number;
  selectedYear?: number;
}

const MineOpgaver: React.FC<MineOpgaverProps> = ({ selectedWeek, selectedYear }) => {
  const { user } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const { assignments, loading, error } = useAssignmentDataOptimized();
  const { cars } = useCars();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { data: warehouseIndicators } = useWarehouseIndicators();

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsDialogOpen(true);
  };

  // Filter assignments for the selected week (falls back to current week)
  const userAssignments = React.useMemo(() => {
    if (!user?.id || !assignments) return [];

    const fallback = getCurrentWeekInfo();
    const week = selectedWeek ?? fallback.week;
    const year = selectedYear ?? fallback.year;
    const currentWeekDates = getWeekDates(week, year);

    const userTasks = assignments.filter(assignment => {
      // Strict ID-based matching only (legacy 'employees' may contain IDs as strings)
      const isAssignedViaNew = assignment.assignedEmployees?.some(emp => emp.id === user.id) ?? false;
      const isAssignedViaLegacy = Array.isArray(assignment.employees)
        && assignment.employees.includes(user.id);
      const isResponsible =
        (assignment.responsibleUser?.id ?? assignment.responsibleUserId) === user.id;

      const assignmentDate = parseISO(assignment.date);
      const isInCurrentWeek = assignmentDate >= currentWeekDates.start && assignmentDate <= currentWeekDates.end;

      const isUserInvolved = isResponsible || isAssignedViaNew || isAssignedViaLegacy;
      return isUserInvolved && isInCurrentWeek;
    });

    const now = new Date();
    const todayStr = format(now, 'yyyy-MM-dd');
    const startOfToday = new Date(`${todayStr}T00:00:00`);
    const endOfToday = new Date(`${todayStr}T23:59:59`);

    const weight = (d: Date) => (d >= startOfToday && d <= endOfToday) ? 0 : (d > endOfToday ? 1 : 2);

    const sorted = userTasks.sort((a, b) => {
      const da = parseISO(a.date);
      const db = parseISO(b.date);
      const wa = weight(da);
      const wb = weight(db);
      if (wa !== wb) return wa - wb;
      if (da.getTime() !== db.getTime()) return da.getTime() - db.getTime();
      return a.fromTime.localeCompare(b.fromTime);
    });

    return sorted.slice(0, 5);
  }, [assignments, user, selectedWeek, selectedYear]);

  // Calculate unique days count - moved before early returns to fix React hooks error
  const uniqueDaysCount = React.useMemo(() => {
    if (!userAssignments || userAssignments.length === 0) return 0;
    const uniqueDates = new Set(userAssignments.map(assignment => assignment.date));
    return uniqueDates.size;
  }, [userAssignments]);

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

  // Helper function to generate Google Maps navigation URL
  const generateNavigationUrl = (location: string) => {
    const encodedLocation = encodeURIComponent(location);
    return `https://www.google.com/maps/dir/Current+Location/${encodedLocation}`;
  };

  // Helper function to handle navigation
  const handleNavigate = (location: string) => {
    const url = generateNavigationUrl(location);
    window.open(url, '_blank', 'noopener,noreferrer');
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


  if (import.meta.env.DEV) console.log(`[MineOpgaver] User assignments: ${userAssignments.length}/${assignments.length}`);

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

  // Only show error if we have a fatal error AND no data
  if (error && userAssignments.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('dashboard.myTasks') || 'Mine Opgaver'}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-sm text-muted-foreground mb-2">
              {t('dashboard.noUpcomingTasks') || 'Ingen kommende opgaver'}
            </p>
            <p className="text-xs text-muted-foreground/60">
              Kom tilbage senere for nye opgaver
            </p>
          </div>
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
    <Card className="h-full overflow-visible">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            {t('dashboard.myTasks') || 'Mine Opgaver'}
            <span className="text-sm font-normal text-muted-foreground">
              - Uge {getCurrentWeekInfo().week}
            </span>
            <Badge variant="secondary" className="ml-auto">
              {uniqueDaysCount} {uniqueDaysCount === 1 ? 'dag' : 'dage'}
            </Badge>
          </CardTitle>
        </CardHeader>
      <CardContent className="space-y-4 overflow-visible">
        {userAssignments.map((assignment) => (
          <div
            key={assignment.id}
            onClick={() => handleAssignmentClick(assignment)}
            className="relative flex flex-col space-y-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
            style={{ contentVisibility: 'auto' }}
          >
            {/* Warehouse indicator badge - positioned at bottom right */}
            {(() => {
              // Match by case_number first, fallback to title for flexibility
              const warehouseData = warehouseIndicators 
                ? (assignment.case_number && warehouseIndicators.get(assignment.case_number)) || 
                  warehouseIndicators.get(assignment.title) || { count: 0, totalQuantity: 0 }
                : { count: 0, totalQuantity: 0 };
              const warehouseCount = warehouseData.totalQuantity;
              return warehouseCount > 0 ? (
                <TooltipProvider delayDuration={100}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="absolute bottom-3 right-3 z-20 flex items-center gap-1 px-2 py-0.5 bg-amber-500 text-white rounded shadow-sm cursor-help">
                        <Package className="h-4 w-4" />
                        <span className="text-xs font-bold">{warehouseCount}</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent 
                      side="left" 
                      align="end"
                      sideOffset={8}
                      className="max-w-xs z-[100]"
                    >
                      <p className="font-medium whitespace-normal">Der er {warehouseData.totalQuantity} møbelkasser/paller på lager</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null;
            })()}
            
            {/* Title and Date */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <h4 className="font-medium text-sm leading-tight">
                  {assignment.title}
                </h4>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
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
                {assignment.location && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(assignment.location);
                    }}
                    className="flex items-center justify-center h-6 w-6 rounded-md hover:bg-accent/50 transition-colors group"
                    title={t('dashboard.navigateToLocation') || 'Navigate to location'}
                    aria-label={t('dashboard.navigateToLocation') || 'Navigate to location'}
                  >
                    <Navigation className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                  </button>
                )}
              </div>
            </div>

            {/* Location */}
            {assignment.location && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{assignment.location}</span>
              </div>
            )}

            {/* Time */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="chip chip-strong chip-tabular">
                <Clock className="h-3 w-3 text-primary" />
                <span>{assignment.fromTime?.substring(0, 5)} - {assignment.toTime?.substring(0, 5)}</span>
              </span>
            </div>

            {/* Cars */}
            {(() => {
              const carNames = getCarNames(assignment);
              return carNames.length > 0 ? (
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <Car className="h-3 w-3 text-amber-600 dark:text-amber-400 shrink-0" />
                  {carNames.map((n, i) => (
                    <span key={i} className="chip">{n}</span>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Show all team members for assignments user can access */}
            {(() => {
              const names: string[] = [];
              if (assignment.assignedEmployees?.length) {
                names.push(...assignment.assignedEmployees.map(emp => emp.name || emp.email || ''));
              }
              if (assignment.employees?.length) {
                names.push(...assignment.employees);
              }
              const teamMembers = filterDisplayNames(names);
              return teamMembers.length > 0 ? (
                <div className="flex items-center gap-1.5 text-xs flex-wrap">
                  <Users className="h-3 w-3 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                  {teamMembers.map((name, i) => (
                    <span key={i} className="chip">{name}</span>
                  ))}
                </div>
              ) : null;
            })()}

            {/* Show Sagsansvarlig if present */}
            {assignment.responsibleUser?.name && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="chip">
                  <UserCheck className="h-3 w-3 text-indigo-600 dark:text-indigo-400" />
                  <span className="text-muted-foreground">{t('planner.responsibleUser') || 'Sagsansvarlig'}:</span>
                  <span className="font-medium text-foreground">{assignment.responsibleUser.name}</span>
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

      <AssignmentDetailsDialog
        assignment={selectedAssignment}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        cars={cars}
        siblingAssignmentIds={getSeriesSiblingIds(selectedAssignment, assignments)}
      />
    </Card>
  );
};

export default MineOpgaver;
