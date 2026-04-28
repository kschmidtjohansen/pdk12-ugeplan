
import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useCars } from '@/hooks/car';
import { Assignment } from '@/types/assignment';
import { filterDisplayNames } from '@/utils/people';
import WeekNavigation from './WeekNavigation';
import AssignmentDetailsDialog from './AssignmentDetailsDialog';
import { getSeriesSiblingIds } from '@/utils/assignmentSeries';

interface WeeklyAssignmentsProps {
  assignments: Assignment[];
  selectedWeek: number;
  onPreviousWeek: () => void;
  onNextWeek: () => void;
}

const WeeklyAssignments: React.FC<WeeklyAssignmentsProps> = ({
  assignments,
  selectedWeek,
  onPreviousWeek,
  onNextWeek
}) => {
  const { t, currentLanguage } = useTranslation();
  const { cars } = useCars();
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsAssignmentDialogOpen(true);
  };

  // Function to get car names from assignment
  const getCarNames = (assignment: Assignment): string[] => {
    const carNames: string[] = [];
    
    if (assignment.cars && Array.isArray(assignment.cars) && assignment.cars.length > 0) {
      // New format: multiple cars array with IDs
      assignment.cars.forEach(carId => {
        const car = cars.find(c => c.id === carId);
        if (car) {
          carNames.push(car.name);
        }
      });
    } else if (assignment.car) {
      // Old format: single car
      if (typeof assignment.car === 'string') {
        const car = cars.find(c => c.id === assignment.car);
        if (car) {
          carNames.push(car.name);
        }
      } else if (typeof assignment.car === 'object' && assignment.car.name) {
        carNames.push(assignment.car.name);
      }
    }
    
    return carNames;
  };

  // Function to get employee names from assignment
  const getEmployeeNames = (assignment: Assignment): string[] => {
    const names: string[] = [];
    
    // Add names from assignedEmployees (new format)
    if (assignment.assignedEmployees && assignment.assignedEmployees.length > 0) {
      names.push(...assignment.assignedEmployees.map(emp => emp.name || emp.email || ''));
    }
    
    // Add names from legacy employees array
    if (assignment.employees && assignment.employees.length > 0) {
      names.push(...assignment.employees);
    }
    
    return filterDisplayNames(names);
  };

  const sortedAssignments = useMemo(() => {
    return assignments.sort((a, b) => {
      const today = new Date().toISOString().split('T')[0];
      const aIsToday = a.date === today;
      const bIsToday = b.date === today;
      const aIsFuture = a.date > today;
      const bIsFuture = b.date > today;
      const aIsPast = a.date < today;
      const bIsPast = b.date < today;
      
      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;
      if (aIsFuture && bIsPast) return -1;
      if (aIsPast && bIsFuture) return 1;
      if (a.date !== b.date) {
        if (aIsFuture && bIsFuture) {
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        }
        if (aIsPast && bIsPast) {
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      }
      return a.fromTime.localeCompare(b.fromTime);
    });
  }, [assignments]);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle asChild>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="p-1.5 rounded-md bg-muted text-foreground">
                  <Clock className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold truncate text-foreground">
                    {t('dashboard.myAssignments')}
                  </h2>
                </div>
                <div className="flex-shrink-0">
                  <WeekNavigation
                    onPrevious={onPreviousWeek}
                    onNext={onNextWeek}
                    currentWeek={selectedWeek}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button variant="outline" size="sm" asChild className="w-full sm:w-auto">
                  <Link to="/planner" className="flex items-center justify-center gap-2">
                    <span>{t('dashboard.viewAll')}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAssignments.length === 0 ? (
            <div className="text-center py-10">
              <div className="p-3 rounded-full bg-muted w-12 h-12 mx-auto mb-3 flex items-center justify-center">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                {t('dashboard.noAssignments')}
              </h3>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.noAssignmentsScheduled')}
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {sortedAssignments.map((assignment) => {
                const employeeNames = getEmployeeNames(assignment);
                const carNames = getCarNames(assignment);

                return (
                  <div
                    key={assignment.id}
                    onClick={() => handleAssignmentClick(assignment)}
                    className="border border-border rounded-lg p-3 bg-card cursor-pointer hover:bg-accent/40 transition-colors"
                  >
                    <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                      <div className="flex flex-col min-w-0">
                        <h3 className="font-semibold text-sm text-foreground text-left truncate">
                          {assignment.title || 'Untitled'}
                        </h3>
                        {assignment.location && (
                          <p className="text-xs text-muted-foreground text-left truncate">
                            {assignment.location}
                          </p>
                        )}
                      </div>
                      <div className="px-2 py-0.5 bg-muted text-foreground rounded-md text-xs font-medium tabular-nums">
                        {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                      </div>
                    </div>

                    {assignment.description && (
                      <p className="mb-2 text-left text-sm text-muted-foreground leading-relaxed line-clamp-2">
                        {assignment.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {carNames.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-foreground">
                          <Car className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{carNames.join(', ')}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="tabular-nums">
                          {assignment.fromTime.substring(0, 5)} – {assignment.toTime.substring(0, 5)}
                        </span>
                      </div>
                      {employeeNames.length > 0 && (
                        <div className="flex items-center gap-2 text-xs text-foreground">
                          <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">{employeeNames.join(', ')}</span>
                        </div>
                      )}
                      {assignment.responsibleUser && (
                        <div className="flex items-center gap-2 text-xs text-foreground">
                          <UserCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <span className="truncate">
                            {typeof assignment.responsibleUser === 'string' ? assignment.responsibleUser : assignment.responsibleUser.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignmentDetailsDialog 
        assignment={selectedAssignment} 
        isOpen={isAssignmentDialogOpen} 
        onClose={() => setIsAssignmentDialogOpen(false)}
        cars={cars}
        siblingAssignmentIds={getSeriesSiblingIds(selectedAssignment, assignments)}
      />
    </>
  );
};

export default WeeklyAssignments;
