import React from 'react';
import { format, isPast, isFuture, isToday, parseISO } from 'date-fns';
import { da } from 'date-fns/locale';
import { Calendar, Clock, CalendarCheck, CalendarX, CalendarClock } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StatusBadge } from '@/components/ui/status-badge';
import { Employee } from '@/types/employee';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';

interface EmployeeVacationHistoryDialogProps {
  employee: Employee | null;
  vacations: Vacation[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EmployeeVacationHistoryDialog: React.FC<EmployeeVacationHistoryDialogProps> = ({
  employee,
  vacations,
  open,
  onOpenChange,
}) => {
  const { t } = useTranslation();
  if (!employee) return null;

  // Filter vacations for this employee
  const employeeVacations = vacations.filter(v => v.user_id === employee.id);

  // Categorize vacations
  const now = new Date();
  
  const currentVacations = employeeVacations.filter(v => {
    if (v.status !== 'approved') return false;
    const start = parseISO(v.start_date);
    const end = parseISO(v.end_date);
    return (isToday(start) || isPast(start)) && (isToday(end) || isFuture(end));
  });

  const upcomingVacations = employeeVacations.filter(v => {
    if (v.status !== 'approved') return false;
    const start = parseISO(v.start_date);
    return isFuture(start) && !isToday(start);
  }).sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime());

  const pastVacations = employeeVacations.filter(v => {
    if (v.status !== 'approved') return false;
    const end = parseISO(v.end_date);
    return isPast(end) && !isToday(end);
  }).sort((a, b) => parseISO(b.start_date).getTime() - parseISO(a.start_date).getTime()).slice(0, 10);

  const pendingVacations = employeeVacations.filter(v => v.status === 'pending')
    .sort((a, b) => parseISO(a.start_date).getTime() - parseISO(b.start_date).getTime());

  const formatDateRange = (vacation: Vacation) => {
    const start = parseISO(vacation.start_date);
    const end = parseISO(vacation.end_date);
    const dateFormat = 'dd. MMM yyyy';
    const locale = da;
    
    if (vacation.start_date === vacation.end_date) {
      return format(start, dateFormat, { locale });
    }
    return `${format(start, dateFormat, { locale })} - ${format(end, dateFormat, { locale })}`;
  };

  const VacationItem = ({ vacation }: { vacation: Vacation }) => (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-muted/50 border">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium text-sm">{formatDateRange(vacation)}</span>
        {vacation.request_type === 'partial_day' && vacation.start_time && vacation.end_time && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {vacation.start_time} - {vacation.end_time}
          </div>
        )}
      </div>
      {vacation.reason && (
        <p className="text-xs text-muted-foreground">{vacation.reason}</p>
      )}
    </div>
  );

  const Section = ({ 
    title, 
    icon: Icon, 
    items, 
    emptyMessage,
    variant = 'default'
  }: { 
    title: string; 
    icon: React.ElementType;
    items: Vacation[];
    emptyMessage: string;
    variant?: 'success' | 'warning' | 'default' | 'info';
  }) => {
    const colorClasses = {
      success: 'text-green-600',
      warning: 'text-orange-600',
      info: 'text-blue-600',
      default: 'text-muted-foreground'
    };

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Icon className={`h-4 w-4 ${colorClasses[variant]}`} />
          <h3 className="font-semibold text-sm">{title}</h3>
          <StatusBadge variant={variant === 'default' ? 'default' : variant}>
            {items.length}
          </StatusBadge>
        </div>
        {items.length > 0 ? (
          <div className="space-y-2 pl-6">
            {items.map(vacation => (
              <VacationItem key={vacation.id} vacation={vacation} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground pl-6">{emptyMessage}</p>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {t('vacation.historyFor', { name: employee.name })}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Current vacation */}
            <Section
              title={t('vacation.currentVacation')}
              icon={CalendarCheck}
              items={currentVacations}
              emptyMessage={t('vacation.notOnVacation')}
              variant="success"
            />

            {/* Upcoming vacations */}
            <Section
              title={t('vacation.upcomingVacations')}
              icon={CalendarClock}
              items={upcomingVacations}
              emptyMessage={t('vacation.noUpcoming')}
              variant="info"
            />

            {/* Pending requests */}
            {pendingVacations.length > 0 && (
              <Section
                title={t('vacation.pendingRequests')}
                icon={Clock}
                items={pendingVacations}
                emptyMessage=""
                variant="warning"
              />
            )}

            {/* Past vacations */}
            <Section
              title={t('vacation.pastVacations')}
              icon={CalendarX}
              items={pastVacations}
              emptyMessage={t('vacation.noPast')}
            />
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default EmployeeVacationHistoryDialog;
