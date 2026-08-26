import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ChevronLeft, ChevronRight, Plus, Trash2, CheckSquare, X } from 'lucide-react';
import { useTranslation } from '@/context/TranslationContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useDutyActions } from '@/hooks/duty/useDutyActions';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import type { Duty } from '@/types/duty';
import { 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  format, 
  isSameMonth, 
  addMonths, 
  subMonths,
  startOfWeek,
  endOfWeek,
  isSameDay
} from 'date-fns';
import { da, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface DutyMonthCalendarProps {
  duties: Duty[];
  month: Date;
  onMonthChange: (month: Date) => void;
  onDutyClick: (duty: Duty) => void;
  canManage: boolean;
  onAddDuty?: (date: Date) => void;
  onSuccess?: () => void;
}

export const DutyMonthCalendar = ({
  duties,
  month,
  onMonthChange,
  onDutyClick,
  canManage,
  onAddDuty,
  onSuccess,
}: DutyMonthCalendarProps) => {
  const { t, currentLanguage } = useTranslation();
  const locale = currentLanguage === 'da' ? da : enUS;
  const isMobile = useIsMobile();
  const { removeDuty, removeDuties, loading: deleting } = useDutyActions(onSuccess);

  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dutyToDelete, setDutyToDelete] = useState<Duty | null>(null);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const exitSelection = () => {
    setSelectionMode(false);
    setSelectedIds([]);
  };

  const handleDeleteSingle = async () => {
    if (!dutyToDelete) return;
    await removeDuty(dutyToDelete.id);
    setDutyToDelete(null);
  };

  const handleDeleteBulk = async () => {
    await removeDuties(selectedIds);
    setBulkConfirmOpen(false);
    exitSelection();
  };


  const monthStart = startOfMonth(month);
  const monthEnd = endOfMonth(month);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getDutiesForDate = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return duties.filter(duty => duty.duty_date === dateStr);
  };

  const getDutyColor = (dutyType: string) => {
    if (dutyType === 'skadeleder_vagt') {
      return {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        border: 'border-blue-300 dark:border-blue-700',
        text: 'text-blue-900 dark:text-blue-100',
        hover: 'hover:bg-blue-200 dark:hover:bg-blue-800/40'
      };
    }
    return {
      bg: 'bg-green-100 dark:bg-green-900/30',
      border: 'border-green-300 dark:border-green-700',
      text: 'text-green-900 dark:text-green-100',
      hover: 'hover:bg-green-200 dark:hover:bg-green-800/40'
    };
  };

  const getDutyTypeName = (dutyType: string) => {
    return dutyType === 'skadeleder_vagt' 
      ? t('duty.skadelederVagt')
      : t('duty.kørevagt');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Helper to extract initials from external entry notes
  const getExternalInitials = (notes: string | null | undefined): string => {
    if (!notes?.startsWith('EKSTERN:')) return '?';
    
    const match = notes.match(/\[([A-Z]{1,2})\]/);
    if (match) return match[1];
    
    const name = notes.split('\n')[0].replace('EKSTERN: ', '');
    return name.split(/\s+/).map(w => w.charAt(0).toUpperCase()).slice(0, 2).join('');
  };

  // Helper to get display name from duty
  const getDisplayName = (duty: Duty): string => {
    if (duty.employee?.name) return duty.employee.name;
    if (duty.notes?.startsWith('EKSTERN:')) {
      return duty.notes.split('\n')[0].replace('EKSTERN: ', '').replace(/\s*\[.*?\]\s*/, '').trim();
    }
    return 'Ukendt';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            {format(month, 'MMMM yyyy', { locale })}
          </CardTitle>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {canManage && (
              selectionMode ? (
                <Button variant="outline" size="sm" onClick={exitSelection}>
                  <X className="h-4 w-4 mr-1" />
                  {t('duty.cancelSelection')}
                </Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setSelectionMode(true)}>
                  <CheckSquare className="h-4 w-4 mr-1" />
                  {t('duty.selectMultiple')}
                </Button>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onMonthChange(new Date())}
            >
              {t('duty.today')}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(subMonths(month, 1))}
              aria-label="Forrige måned"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => onMonthChange(addMonths(month, 1))}
              aria-label="Næste måned"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {canManage && selectionMode && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-lg border bg-muted/40 px-3 py-2">
            <span className="text-sm font-medium">
              {(t('duty.selectedCount') || '{{count}} vagter valgt').replace('{{count}}', String(selectedIds.length))}
            </span>
            <Button
              variant="destructive"
              size="sm"
              disabled={selectedIds.length === 0 || deleting}
              onClick={() => setBulkConfirmOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              {t('duty.deleteSelected')}
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>

        <div className="grid grid-cols-7 gap-2">
          {/* Day headers */}
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => (
            <div
              key={i}
              className="text-center text-sm font-semibold text-muted-foreground py-2"
            >
              {currentLanguage === 'da' 
                ? ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'][i]
                : day
              }
            </div>
          ))}

          {/* Calendar days */}
          {days.map((day, i) => {
            const dayDuties = getDutiesForDate(day);
            const isCurrentMonth = isSameMonth(day, month);
            const isToday = isSameDay(day, new Date());

            return (
              <div
                key={i}
                className={cn(
                  "min-h-[120px] md:min-h-[100px] border rounded-lg p-1.5 md:p-2",
                  isCurrentMonth ? "bg-card" : "bg-muted/30",
                  isToday && "ring-2 ring-primary"
                )}
              >
                <div className="flex items-center justify-between mb-1">
                  <div
                    className={cn(
                      "text-sm font-medium",
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground",
                      isToday && "text-primary font-bold"
                    )}
                  >
                    {format(day, 'd')}
                  </div>
                  {canManage && onAddDuty && isCurrentMonth && (
                    <button
                      type="button"
                      onClick={() => onAddDuty(day)}
                      className="opacity-60 hover:opacity-100 hover:bg-muted rounded p-0.5 transition-opacity"
                      title={t('duty.addDutyOnDay')}
                      aria-label={t('duty.addDutyOnDay')}
                    >
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                
                <div className="space-y-1">
                  {dayDuties.map((duty) => {
                    const colors = getDutyColor(duty.duty_type);
                    const employeeName = getDisplayName(duty);
                    const initials = duty.employee?.name 
                      ? getInitials(employeeName) 
                      : getExternalInitials(duty.notes);
                    
                    const isSelected = selectedIds.includes(duty.id);

                    if (canManage && selectionMode) {
                      return (
                        <button
                          key={duty.id}
                          type="button"
                          onClick={() => toggleSelected(duty.id)}
                          className={cn(
                            "w-full flex items-center gap-2 text-left px-2 py-1.5 rounded border text-xs transition-colors",
                            colors.bg,
                            colors.border,
                            colors.text,
                            colors.hover,
                            isSelected && "ring-2 ring-destructive"
                          )}
                          title={`${employeeName} - ${getDutyTypeName(duty.duty_type)}`}
                        >
                          <Checkbox checked={isSelected} className="pointer-events-none h-3.5 w-3.5" />
                          <span className="truncate font-medium text-[11px]">
                            {duty.duty_type === 'skadeleder_vagt' ? 'SL' : 'KV'} · {initials}
                          </span>
                        </button>
                      );
                    }

                    return isMobile ? (
                      <Popover key={duty.id}>
                        <PopoverTrigger asChild>
                          <button
                            className={cn(
                              "w-full text-left px-2 py-1.5 rounded border text-xs transition-colors",
                              colors.bg,
                              colors.border,
                              colors.text,
                              colors.hover,
                              "cursor-pointer"
                            )}
                          >
                            <div className="text-[12px] font-semibold leading-tight truncate">
                              {duty.duty_type === 'skadeleder_vagt' ? 'SL' : 'KV'} · {initials}
                            </div>
                            {(duty as any).sharedDepartmentName && (
                              <div className="text-[9px] font-medium opacity-70 truncate mt-0.5">
                                {(duty as any).sharedDepartmentName}
                              </div>
                            )}
                          </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-3" side="top">
                          <div className="space-y-1">
                            <p className="font-semibold text-sm">{employeeName}</p>
                            <p className="text-xs text-muted-foreground">
                              {getDutyTypeName(duty.duty_type)}
                            </p>
                            {(duty as any).sharedDepartmentName && (
                              <p className="text-xs text-muted-foreground">
                                {(duty as any).sharedDepartmentName}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(duty.duty_date), 'd. MMMM yyyy', { locale })}
                            </p>
                            {canManage && (
                              <div className="pt-2 flex flex-col gap-1">
                                <Button size="sm" variant="outline" onClick={() => onDutyClick(duty)}>
                                  {t('duty.edit')}
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => setDutyToDelete(duty)}
                                >
                                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                                  {t('duty.remove')}
                                </Button>
                              </div>
                            )}
                          </div>
                        </PopoverContent>
                      </Popover>
                    ) : (
                      <div key={duty.id} className="relative group">
                        <button
                          onClick={() => canManage && onDutyClick(duty)}
                          disabled={!canManage}
                          className={cn(
                            "w-full text-left px-2 py-1.5 md:py-1 rounded border text-xs transition-colors",
                            colors.bg,
                            colors.border,
                            colors.text,
                            canManage && colors.hover,
                            canManage ? "cursor-pointer" : "cursor-default"
                          )}
                          title={`${employeeName} - ${getDutyTypeName(duty.duty_type)}${(duty as any).sharedDepartmentName ? ' · ' + (duty as any).sharedDepartmentName : ''}`}
                        >
                          <div className="font-semibold md:font-medium truncate text-[11px] md:text-xs">
                            {initials}
                          </div>
                          <div className="text-[9px] md:text-[10px] opacity-75 truncate font-medium">
                            {duty.duty_type === 'skadeleder_vagt' ? 'SL' : 'KV'}
                          </div>
                          {(duty as any).sharedDepartmentName && (
                            <div className="text-[9px] md:text-[10px] opacity-70 truncate italic">
                              {(duty as any).sharedDepartmentName}
                            </div>
                          )}
                        </button>
                        {canManage && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setDutyToDelete(duty); }}
                            className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 focus:opacity-100 rounded bg-background/80 hover:bg-destructive/10 text-destructive p-0.5 transition-opacity"
                            title={t('duty.remove')}
                            aria-label={t('duty.remove')}
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    );

                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700"></div>
            <span className="text-sm text-muted-foreground">
              {t('duty.skadelederVagt')}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700"></div>
            <span className="text-sm text-muted-foreground">
              {t('duty.kørevagt')}
            </span>
          </div>
        </div>

        <AlertDialog open={!!dutyToDelete} onOpenChange={(o) => !o && setDutyToDelete(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('duty.confirmRemove')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('duty.confirmRemoveMessage')}
                {dutyToDelete && (
                  <span className="block mt-2 font-medium text-foreground">
                    {getDisplayName(dutyToDelete)} — {getDutyTypeName(dutyToDelete.duty_type)} · {format(new Date(dutyToDelete.duty_date), 'd. MMMM yyyy', { locale })}
                  </span>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('duty.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteSingle}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t('duty.remove')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <AlertDialog open={bulkConfirmOpen} onOpenChange={setBulkConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('duty.confirmRemoveMultiple')}</AlertDialogTitle>
              <AlertDialogDescription>
                {(t('duty.confirmRemoveMultipleMessage') || 'Er du sikker på, at du vil fjerne {{count}} vagter?').replace('{{count}}', String(selectedIds.length))}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('duty.cancel')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteBulk}
                className="bg-destructive hover:bg-destructive/90"
              >
                {t('duty.remove')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>

    </Card>
  );
};
