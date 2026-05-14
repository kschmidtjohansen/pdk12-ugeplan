import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, ChevronLeft, ChevronRight, Users } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useDepartment } from '@/context/DepartmentContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  addMonths,
  subMonths,
  getDay,
  isSameMonth,
  startOfWeek,
  endOfWeek,
  getISOWeek,
  eachWeekOfInterval,
  isWithinInterval,
  parseISO,
} from 'date-fns';
import { da, enUS } from 'date-fns/locale';

interface VacationWithProfile {
  id: string;
  user_id: string;
  start_date: string;
  end_date: string;
  status: string;
  user_name: string;
}

const VacationCalendarOverview: React.FC = () => {
  const { t } = useTranslation();
  const { selectedDepartmentId } = useDepartment();
  const { isDemoMode } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const locale = da;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);

  // Fetch approved vacations for current month range (with buffer for week view)
  const { data: vacations = [] } = useQuery({
    queryKey: ['admin-vacation-calendar', selectedDepartmentId, format(currentMonth, 'yyyy-MM')],
    queryFn: async () => {
      const rangeStart = format(subMonths(monthStart, 0), 'yyyy-MM-dd');
      const rangeEnd = format(endOfMonth(addMonths(currentMonth, 0)), 'yyyy-MM-dd');

      let query = supabase
        .from('vacations')
        .select('id, user_id, start_date, end_date, status')
        .eq('status', 'approved')
        .or(`start_date.lte.${rangeEnd},end_date.gte.${rangeStart}`)
        .eq('is_demo', isDemoMode);

      if (selectedDepartmentId) {
        query = query.eq('department_id', selectedDepartmentId);
      }

      const { data, error } = await query;
      if (error) throw error;

      // Fetch profile names for these users
      const userIds = [...new Set((data || []).map(v => v.user_id))];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      const profileMap = new Map((profiles || []).map(p => [p.id, p.name]));

      return (data || []).map(v => ({
        ...v,
        user_name: profileMap.get(v.user_id) || 'Ukendt',
      })) as VacationWithProfile[];
    },
    enabled: isDemoMode || !!selectedDepartmentId,
  });

  // Fetch total active service employees
  const { data: totalServiceEmployees = 0 } = useQuery({
    queryKey: ['service-employee-count', selectedDepartmentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'servicemedarbejder');
      if (error) throw error;

      if (!selectedDepartmentId) return data?.length || 0;

      // Filter by department via user_access
      const userIds = (data || []).map(r => r.user_id);
      if (userIds.length === 0) return 0;

      const { data: accessData } = await supabase
        .from('user_access')
        .select('user_id')
        .eq('department_id', selectedDepartmentId)
        .in('user_id', userIds);

      // Also check active status
      const accessUserIds = [...new Set((accessData || []).map(a => a.user_id))];
      if (accessUserIds.length === 0) return 0;

      const { data: activeProfiles } = await supabase
        .from('profiles')
        .select('id')
        .in('id', accessUserIds)
        .eq('status', 'active');

      return activeProfiles?.length || 0;
    },
    enabled: isDemoMode || !!selectedDepartmentId,
  });

  // Build calendar days
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  // Map: date string -> vacation users
  const vacationsByDate = useMemo(() => {
    const map = new Map<string, VacationWithProfile[]>();
    for (const v of vacations) {
      const start = parseISO(v.start_date);
      const end = parseISO(v.end_date);
      const days = eachDayOfInterval({ start, end });
      for (const day of days) {
        const key = format(day, 'yyyy-MM-dd');
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(v);
      }
    }
    return map;
  }, [vacations]);

  // Week summary
  const weeks = useMemo(() => {
    const weekStarts = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    return weekStarts.map(weekStart => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekNum = getISOWeek(weekStart);

      // Count unique users on vacation this week
      const usersOnVacation = new Set<string>();
      for (const v of vacations) {
        const vStart = parseISO(v.start_date);
        const vEnd = parseISO(v.end_date);
        // Check overlap
        if (vStart <= weekEnd && vEnd >= weekStart) {
          usersOnVacation.add(v.user_id);
        }
      }

      const onVacation = usersOnVacation.size;
      const available = Math.max(0, totalServiceEmployees - onVacation);
      const percentage = totalServiceEmployees > 0 ? (available / totalServiceEmployees) * 100 : 100;

      return { weekNum, weekStart, available, onVacation, percentage };
    });
  }, [vacations, totalServiceEmployees, monthStart, monthEnd]);

  const getAvailabilityColor = (pct: number) => {
    if (pct > 75) return 'bg-green-100 text-green-800 border-green-200';
    if (pct >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const selectedDateVacations = selectedDate
    ? vacationsByDate.get(format(selectedDate, 'yyyy-MM-dd')) || []
    : [];

  const dayNames = ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'];

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5" />
                {t('admin.vacationCalendar.title')}
              </CardTitle>
              <CardDescription>{t('admin.vacationCalendar.description')}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => subMonths(m, 1))} aria-label="Forrige måned">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-semibold min-w-[140px] text-center capitalize">
                {format(currentMonth, 'MMMM yyyy', { locale })}
              </span>
              <Button variant="outline" size="icon" onClick={() => setCurrentMonth(m => addMonths(m, 1))} aria-label="Næste måned">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day names header */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map(day => {
              const key = format(day, 'yyyy-MM-dd');
              const dayVacations = vacationsByDate.get(key) || [];
              const isCurrentMonth = isSameMonth(day, currentMonth);
              const isSelected = selectedDate && format(selectedDate, 'yyyy-MM-dd') === key;
              const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

              return (
                <button
                  key={key}
                  onClick={() => setSelectedDate(day)}
                  className={`
                    relative p-2 min-h-[48px] rounded-lg text-sm transition-all border
                    ${!isCurrentMonth ? 'opacity-30' : ''}
                    ${isSelected ? 'ring-2 ring-primary border-primary' : 'border-transparent hover:border-border'}
                    ${isToday ? 'font-bold' : ''}
                    ${dayVacations.length > 0 ? 'bg-orange-50 dark:bg-orange-950/20' : 'hover:bg-muted/50'}
                  `}
                >
                  <span className="text-xs">{format(day, 'd')}</span>
                  {dayVacations.length > 0 && (
                    <div className="absolute bottom-1 left-1/2 -translate-x-1/2">
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 bg-orange-200 text-orange-800">
                        {dayVacations.length}
                      </Badge>
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Selected date details */}
          {selectedDate && (
            <div className="mt-4 p-4 rounded-lg border bg-muted/30">
              <h4 className="font-semibold mb-2">
                {format(selectedDate, 'd. MMMM yyyy', { locale })}
                {selectedDateVacations.length > 0
                  ? ` — ${selectedDateVacations.length} ${t('admin.vacationCalendar.onVacation')}`
                  : ` — ${t('admin.vacationCalendar.noVacations')}`}
              </h4>
              {selectedDateVacations.length > 0 && (
                <ul className="space-y-1">
                  {selectedDateVacations.map(v => (
                    <li key={v.id} className="flex items-center gap-2 text-sm">
                      <span className="w-2 h-2 rounded-full bg-orange-400" />
                      <span>{v.user_name}</span>
                      <span className="text-muted-foreground text-xs">
                        ({format(parseISO(v.start_date), 'd/M')} – {format(parseISO(v.end_date), 'd/M')})
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly availability overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            {t('admin.vacationCalendar.availableEmployees')}
          </CardTitle>
          <CardDescription>
            {totalServiceEmployees} {t('admin.vacationCalendar.totalServiceEmployees')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {weeks.map(w => (
              <div
                key={w.weekNum}
                className={`p-3 rounded-lg border ${getAvailabilityColor(w.percentage)}`}
              >
                <div className="text-xs font-medium mb-1">
                  {t('admin.vacationCalendar.week')} {w.weekNum}
                </div>
                <div className="text-lg font-bold">{w.available}/{totalServiceEmployees}</div>
                <div className="text-xs">
                  {w.onVacation} {t('admin.vacationCalendar.onVacation')}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default VacationCalendarOverview;
