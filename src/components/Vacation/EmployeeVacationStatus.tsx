
import React from 'react';
import { format, differenceInDays, getISOWeek } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Vacation } from '@/types/vacation';
import { useTranslation } from '@/context/TranslationContext';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { formatDateRangeWithWeeks } from '@/utils/dateUtils';

interface EmployeeVacationStatusProps {
  vacations: Vacation[];
}

const EmployeeVacationStatus: React.FC<EmployeeVacationStatusProps> = ({ vacations }) => {
  const { t, currentLanguage } = useTranslation();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Filter for approved vacations that are currently active or upcoming
  const activeVacations = vacations.filter(v => 
    v.status === 'approved' && 
    new Date(v.end_date) >= today
  ).sort((a, b) => 
    new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  
  if (activeVacations.length === 0) {
    return null;
  }
  
  const calculateDaysRemaining = (endDate: Date): number => {
    return differenceInDays(new Date(endDate), today) + 1;
  };

  const isCurrentlyOnVacation = (startDate: Date): boolean => {
    return new Date(startDate) <= today;
  };
  
  return (
    <Card className="mt-8">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          {t("vacation.currentlyOnVacation")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("employees.name")}</TableHead>
              <TableHead>{t("vacation.dateRange")}</TableHead>
              <TableHead>{t("vacation.reason")}</TableHead>
              <TableHead>{t("vacation.status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeVacations.map(vacation => (
              <TableRow key={vacation.id}>
                <TableCell className="font-medium">{vacation.user?.name || 'Unknown'}</TableCell>
                <TableCell>
                  {formatDateRangeWithWeeks(
                    new Date(vacation.start_date),
                    new Date(vacation.end_date),
                    currentLanguage,
                    t('common.week')
                  )}
                </TableCell>
                <TableCell>{vacation.reason}</TableCell>
                <TableCell>
                  {isCurrentlyOnVacation(new Date(vacation.start_date)) ? (
                    <Badge variant="outline" className="bg-green-50">
                      {calculateDaysRemaining(new Date(vacation.end_date))} {t("vacation.days")}
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-blue-50">
                      {t("vacation.upcoming")}
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default EmployeeVacationStatus;
