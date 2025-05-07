import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslation } from '@/context/TranslationContext';
import { Vacation } from '@/types/vacation';
import { CalendarClock, User } from 'lucide-react';
import { format } from 'date-fns';
import { da, enGB } from 'date-fns/locale';
interface UpcomingVacationsWidgetProps {
  vacations: Vacation[];
}
const UpcomingVacationsWidget: React.FC<UpcomingVacationsWidgetProps> = ({
  vacations
}) => {
  const {
    t,
    currentLanguage
  } = useTranslation();

  // Determine locale object based on current language
  const dateLocale = currentLanguage === 'da' ? da : enGB;

  // Sort vacations by start date and get only approved upcoming ones
  const upcomingVacations = vacations.filter(vacation => vacation.status === 'approved' && new Date(vacation.startDate) >= new Date()).sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).slice(0, 3); // Only show max 3 upcoming vacations

  return;
};
export default UpcomingVacationsWidget;