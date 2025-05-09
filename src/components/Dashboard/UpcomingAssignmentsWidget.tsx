
import React from 'react';
import { usePlannerAssignments } from '@/hooks/usePlannerAssignments';
import { useTranslation } from '@/context/TranslationContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, MapPin, Car } from 'lucide-react';
import { format } from 'date-fns';

const UpcomingAssignmentsWidget: React.FC = () => {
  const { assignments } = usePlannerAssignments();
  const { t, currentLanguage } = useTranslation();
  
  // Get upcoming assignments (next 3 days)
  const today = new Date();
  const threeDaysFromNow = new Date();
  threeDaysFromNow.setDate(today.getDate() + 3);
  
  const todayFormatted = format(today, 'yyyy-MM-dd');
  const threeDaysFormatted = format(threeDaysFromNow, 'yyyy-MM-dd');
  
  const upcomingAssignments = assignments
    .filter(a => {
      return a.date >= todayFormatted && a.date <= threeDaysFormatted && a.published === true;
    })
    .slice(0, 3);

  // Format car display value
  const getCarDisplay = (car: string | { id: string; name: string } | null) => {
    if (!car) return t('planner.noCar');
    if (typeof car === 'string') return car;
    return car.name;
  };

  return (
    <Card className="col-span-1 md:col-span-2">
      <CardHeader>
        <CardTitle className="text-sm font-medium">
          {t('dashboard.upcomingAssignments')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {upcomingAssignments.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t('dashboard.noUpcomingAssignments')}</p>
        ) : (
          <div className="space-y-4">
            {upcomingAssignments.map(assignment => (
              <div key={assignment.id} className="border rounded-md p-3 bg-white">
                <div className="flex justify-between items-start gap-2 mb-1">
                  <h4 className="font-medium text-sm">{assignment.title}</h4>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-md">
                    {new Date(assignment.date).toLocaleDateString(currentLanguage === 'da' ? 'da-DK' : 'en-GB')}
                  </span>
                </div>
                <div className="text-xs text-gray-500 flex flex-col gap-1">
                  <div className="flex items-start gap-2">
                    <Clock className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>
                      {assignment.fromTime} - {assignment.toTime}
                    </span>
                  </div>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>{assignment.location}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Car className="h-3 w-3 flex-shrink-0 mt-0.5" />
                    <span>{getCarDisplay(assignment.car)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingAssignmentsWidget;
