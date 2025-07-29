import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users, Car } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { ScreenDisplayAssignment } from '@/services/screenDisplayService';
import { format } from 'date-fns';

interface ScreenDisplayContentProps {
  assignments: ScreenDisplayAssignment[];
  selectedDate: Date;
}

export const ScreenDisplayContent: React.FC<ScreenDisplayContentProps> = ({
  assignments,
  selectedDate
}) => {
  const { t } = useTranslation();
  
  const formatTime = (time: string): string => {
    return time.substring(0, 5);
  };

  const getTimeStatus = (assignment: ScreenDisplayAssignment) => {
    const now = new Date();
    const currentTimeStr = format(now, 'HH:mm');
    const isToday = format(now, 'yyyy-MM-dd') === assignment.date;

    if (!isToday) return 'scheduled';
    if (currentTimeStr < assignment.fromTime) return 'upcoming';
    if (currentTimeStr >= assignment.fromTime && currentTimeStr <= assignment.toTime) return 'active';
    return 'completed';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500 text-white';
      case 'upcoming':
        return 'bg-blue-500 text-white';
      case 'completed':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-blue-500 text-white';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return t('screenDisplay.statusActive');
      case 'upcoming':
        return t('screenDisplay.statusUpcoming');
      case 'completed':
        return t('screenDisplay.statusCompleted');
      default:
        return t('screenDisplay.statusScheduled');
    }
  };

  if (assignments.length === 0) {
    return (
      <Card className="border-2 border-border/50 bg-gradient-to-br from-card to-card shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="p-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Calendar className="h-10 w-10 text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-600 mb-2">
            {t('screenDisplay.noTasksPlanned')}
          </h2>
          <p className="text-muted-foreground">
            {t('screenDisplay.noTasksDescription')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
      {assignments.map((assignment, index) => {
        const status = getTimeStatus(assignment);
        
        return (
          <Card 
            key={assignment.id}
            className="border-2 border-border/50 bg-gradient-to-br from-card to-card/50 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden relative animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <CardContent className="p-4 space-y-3">
              {/* Status Badge */}
              <div className="flex justify-between items-start">
                <Badge 
                  className={`${getStatusColor(status)} text-xs font-medium px-2 py-1`}
                >
                  {getStatusText(status)}
                </Badge>
              </div>

              {/* Title */}
              <h3 className="font-bold text-lg text-foreground leading-tight">
                {assignment.title}
              </h3>

              {/* Description */}
              {assignment.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {assignment.description}
                </p>
              )}

              {/* Time */}
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-primary" />
                <span className="font-medium text-foreground">
                  {formatTime(assignment.fromTime)} - {formatTime(assignment.toTime)}
                </span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-primary" />
                <span className="text-muted-foreground truncate">
                  {assignment.location}
                </span>
              </div>

              {/* Employees */}
              {assignment.employees.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 flex-1">
                    {assignment.employees.map((employee, empIndex) => (
                      <div key={empIndex} className="text-muted-foreground">
                        {employee}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cars */}
              {assignment.cars.length > 0 && (
                <div className="flex items-start gap-2 text-sm">
                  <Car className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1 flex-1">
                    {assignment.cars.map((car, carIndex) => (
                      <div key={carIndex} className="text-muted-foreground">
                        {car}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};