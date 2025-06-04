
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar, Users, Car, Clock, ArrowRight, UserCheck } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { Assignment } from '@/types/assignment';
import WeekNavigation from './WeekNavigation';
import AssignmentDetailsDialog from './AssignmentDetailsDialog';

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
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [isAssignmentDialogOpen, setIsAssignmentDialogOpen] = useState(false);

  const handleAssignmentClick = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setIsAssignmentDialogOpen(true);
  };

  const sortedAssignments = assignments.sort((a, b) => {
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

  return (
    <>
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card">
        <CardHeader className="pb-4">
          <CardTitle className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-primary/10 border border-primary/20">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {t('dashboard.myAssignments', { week: selectedWeek })}
                </h2>
              </div>
              <WeekNavigation 
                onPrevious={onPreviousWeek} 
                onNext={onNextWeek} 
                currentWeek={selectedWeek} 
              />
            </div>
            <Button variant="gradient" size="sm" asChild className="shadow-lg">
              <Link to="/planner">
                {t('dashboard.viewAll')}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sortedAssignments.length === 0 ? (
            <div className="text-center py-12">
              <div className="p-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                <Clock className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                {t('dashboard.noAssignments')}
              </h3>
              <p className="text-muted-foreground">
                No assignments scheduled for this week
              </p>
            </div>
          ) : (
            <div className="grid gap-3">
              {sortedAssignments.map((assignment, index) => (
                <div 
                  key={assignment.id} 
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => handleAssignmentClick(assignment)} 
                  className="border-2 border-border/50 rounded-2xl p-4 bg-gradient-to-br from-card to-card/50 cursor-pointer animate-scale-in relative overflow-hidden py-[12px]"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none"></div>
                  
                  <div className="relative z-10">
                    <div className="flex flex-wrap justify-between items-start gap-3 mb-3">
                      <h3 className="font-bold text-lg text-left">
                        {assignment.location}
                      </h3>
                      <div className="px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold text-sm border border-primary/20">
                        {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                      </div>
                    </div>
                    
                    {assignment.description && (
                      <p className="mb-2 text-left leading-relaxed text-sm text-polygon-neutral">
                        {assignment.description}
                      </p>
                    )}
                    <p className="text-foreground mb-3 font-medium text-left text-sm">
                      {assignment.title}
                    </p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {assignment.car && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-200">
                            <Car className="h-3.5 w-3.5 text-blue-600" />
                          </div>
                          <span className="text-foreground font-medium text-sm">
                            {typeof assignment.car === 'string' ? assignment.car : assignment.car.name}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-green-50 border border-green-200">
                          <Clock className="h-3.5 w-3.5 text-green-600" />
                        </div>
                        <span className="text-foreground font-medium text-sm">
                          {assignment.fromTime.substring(0, 5)} - {assignment.toTime.substring(0, 5)}
                        </span>
                      </div>
                      
                      {assignment.employees && assignment.employees.length > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-purple-50 border border-purple-200">
                            <Users className="h-3.5 w-3.5 text-purple-600" />
                          </div>
                          <span className="text-foreground font-medium text-sm">
                            {assignment.employees.join(', ')}
                          </span>
                        </div>
                      )}

                      {assignment.responsibleUser && (
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded-lg bg-indigo-50 border border-indigo-200">
                            <UserCheck className="h-3.5 w-3.5 text-indigo-600" />
                          </div>
                          <span className="text-foreground font-medium text-sm">
                            {assignment.responsibleUser.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AssignmentDetailsDialog 
        assignment={selectedAssignment} 
        isOpen={isAssignmentDialogOpen} 
        onClose={() => setIsAssignmentDialogOpen(false)} 
      />
    </>
  );
};

export default WeeklyAssignments;
