import React from 'react';
import { format, getISOWeek } from 'date-fns';
import { da } from 'date-fns/locale';
import { useTranslation } from '@/context/TranslationContext';
import { useAuth } from '@/context/AuthContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Vacation } from '@/types/vacation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, Edit } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { EnhancedVacationCard } from './EnhancedVacationCard';

interface VacationTableProps {
  vacations: Vacation[];
  onApprove: (vacation: Vacation) => void;
  onReject: (vacation: Vacation) => void;
  onEdit?: (vacation: Vacation) => void;
  isLoading?: boolean;
}

const VacationTable: React.FC<VacationTableProps> = ({ 
  vacations, 
  onApprove, 
  onReject,
  onEdit,
  isLoading = false 
}) => {
  const { isEffectiveAdmin } = useAuth();
  const { t, currentLanguage } = useTranslation();
  const isMobile = useIsMobile();
  
  const canApprove = isEffectiveAdmin;

  const formatDateWithWeek = (date: Date) => {
    const locale = currentLanguage === 'da' ? da : undefined;
    const weekday = format(date, 'EEEE', { locale });
    const capitalized = weekday.charAt(0).toUpperCase() + weekday.slice(1);
    const dateStr = `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
    const week = getISOWeek(date);
    const weekLabel = currentLanguage === 'da' ? 'Uge' : 'Week';
    return `${capitalized} ${dateStr} (${weekLabel} ${week})`;
  };

  const formatDateRange = (startDate: Date, endDate: Date) => {
    if (startDate.toDateString() === endDate.toDateString()) {
      return formatDateWithWeek(startDate);
    }
    return `${formatDateWithWeek(startDate)} - ${formatDateWithWeek(endDate)}`;
  };

  const formatRequestType = (vacation: Vacation) => {
    if (vacation.request_type === 'partial_day' && vacation.start_time && vacation.end_time) {
      // Format times from HH:MM:SS to HH:MM format
      const startTime = vacation.start_time.substring(0, 5);
      const endTime = vacation.end_time.substring(0, 5);
      
      // For partial day vacations, we need to determine what to show
      // If the vacation starts at 08:00 (beginning of workday), show "off until {endTime}"
      // If the vacation starts later in the day, show "off from {startTime}"
      // This handles cases like Julie being off from 13:00 onwards
      
      if (startTime === "08:00") {
        // Off from beginning of day until endTime - show working hours after vacation
        return t("vacation.availableHours", { startTime: endTime, endTime: "16:00" });
      } else {
        // Off from startTime onwards - this is the case for Julie (off from 13:00)
        return t("vacation.offFrom", { time: startTime });
      }
    }
    return t("vacation.fullDay");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">{t("vacation.status.approved")}</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">{t("vacation.status.rejected")}</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">{t("vacation.status.pending")}</Badge>;
    }
  };
  
  if (isLoading) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin h-8 w-8 border-t-2 border-polygon-blue rounded-full"></div>
      </div>
    );
  }
  
  if (vacations.length === 0) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <p>{t("vacation.noRequests")}</p>
      </div>
    );
  }
  
  // Mobile: Card-based layout
  if (isMobile) {
    return (
      <div className="space-y-4">
        {vacations.map((vacation) => (
          <EnhancedVacationCard
            key={vacation.id}
            vacation={vacation}
            onApprove={canApprove && vacation.status === 'pending' ? onApprove : undefined}
            onReject={canApprove && vacation.status === 'pending' ? onReject : undefined}
            onEdit={onEdit && canApprove ? onEdit : undefined}
            showActions={canApprove || !!onEdit}
          />
        ))}
      </div>
    );
  }
  
  // Desktop: Table layout
  return (
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t("employees.name")}</TableHead>
            <TableHead>{t("vacation.dateRange")}</TableHead>
            <TableHead>{t("vacation.timeRange")}</TableHead>
            <TableHead>{t("vacation.reason")}</TableHead>
            <TableHead>{t("common.status")}</TableHead>
            <TableHead>{t("vacation.requestedOn")}</TableHead>
            {canApprove && <TableHead className="text-right">{t("common.actions")}</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {vacations.map((vacation) => (
            <TableRow key={vacation.id}>
              <TableCell className="font-medium">
                {vacation.user?.name || 'Unknown Employee'}
              </TableCell>
              <TableCell>
                {formatDateRange(new Date(vacation.start_date), new Date(vacation.end_date))}
              </TableCell>
              <TableCell>
                <span className="text-sm text-muted-foreground">
                  {formatRequestType(vacation)}
                </span>
              </TableCell>
              <TableCell>
                <span className="max-w-xs truncate block" title={vacation.reason}>
                  {vacation.reason}
                </span>
              </TableCell>
              <TableCell>
                {getStatusBadge(vacation.status)}
              </TableCell>
              <TableCell>
                {new Date(vacation.created_at).toLocaleDateString(
                  currentLanguage === 'da' ? 'da-DK' : 'en-GB'
                )}
              </TableCell>
              {canApprove && (
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {vacation.status === 'pending' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onApprove(vacation)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                        >
                          <Check className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onReject(vacation)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {onEdit && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onEdit(vacation)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default VacationTable;
