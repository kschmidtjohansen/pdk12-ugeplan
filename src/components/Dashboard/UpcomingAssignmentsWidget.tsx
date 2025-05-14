
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Assignment } from '@/types/assignment';
import { useTranslation } from '@/context/TranslationContext';
import { format } from 'date-fns';
import { Clock, MapPin } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';

interface UpcomingAssignmentsWidgetProps {
  assignments: Assignment[];
  isLoading: boolean;
}

const UpcomingAssignmentsWidget: React.FC<UpcomingAssignmentsWidgetProps> = ({
  assignments,
  isLoading
}) => {
  const { t, currentLanguage } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Format time to show only hours and minutes (HH:MM)
  const formatTimeWithoutSeconds = (timeString: string) => {
    if (!timeString) return '';
    return timeString.split(':').slice(0, 2).join(':');
  };
  
  // Filter assignments to show only today's assignments
  const todayAssignments = assignments.filter(assignment => {
    const assignmentDate = new Date(assignment.date);
    assignmentDate.setHours(0, 0, 0, 0);
    return assignmentDate.getTime() === today.getTime() && assignment.published;
  });
  
  // Filter assignments to show only future assignments (excluding today)
  const futureAssignments = assignments.filter(assignment => {
    const assignmentDate = new Date(assignment.date);
    assignmentDate.setHours(0, 0, 0, 0);
    return assignmentDate.getTime() > today.getTime() && assignment.published;
  }).slice(0, 3); // Show only first 3 upcoming assignments
  
  // Format date based on language
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return currentLanguage === 'da'
      ? format(date, 'EEEE d. MMMM')
      : format(date, 'EEEE, MMMM d');
  };
  
  if (isLoading) {
    return (
      <Card className="col-span-1 lg:col-span-2">
        <CardHeader>
          <CardTitle>{t('dashboard.todayAssignments')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center h-32">
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle>{t('dashboard.todayAssignments')}</CardTitle>
      </CardHeader>
      <CardContent>
        {todayAssignments.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">{t('dashboard.noData')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayAssignments.map(assignment => (
              <div key={assignment.id} className="bg-accent/40 p-3 rounded-md">
                <div className="flex justify-between items-start">
                  <h3 className="font-medium">{assignment.title}</h3>
                  <Badge variant="outline" className="bg-blue-50">
                    {formatTimeWithoutSeconds(assignment.fromTime)} - {formatTimeWithoutSeconds(assignment.toTime)}
                  </Badge>
                </div>
                
                {assignment.location && (
                  <div className="flex items-center mt-2 text-sm">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    <span className="text-muted-foreground">{assignment.location}</span>
                  </div>
                )}
                
                {assignment.employees && assignment.employees.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {assignment.employees.map((employee, index) => (
                      <Badge key={index} variant="outline" className="bg-blue-50 text-xs">
                        {employee}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {futureAssignments.length > 0 && (
          <>
            <Separator className="my-4" />
            <div>
              <h3 className="font-medium mb-3">{t('dashboard.upcomingAssignments')}</h3>
              <div className="space-y-3">
                {futureAssignments.map(assignment => (
                  <div key={assignment.id} className="flex justify-between items-center border-b border-border pb-2 last:border-0">
                    <div>
                      <div className="font-medium">{assignment.title}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatDate(assignment.date)}
                      </div>
                    </div>
                    <Badge variant="outline" className="bg-blue-50">
                      {formatTimeWithoutSeconds(assignment.fromTime)} - {formatTimeWithoutSeconds(assignment.toTime)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAssignmentsWidget;
