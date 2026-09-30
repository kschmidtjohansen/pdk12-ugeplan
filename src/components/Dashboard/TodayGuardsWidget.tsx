import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { useDateLocale } from '@/hooks/useDateLocale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { Shield, ChevronDown } from 'lucide-react';
import { useDutyData } from '@/hooks/duty/useDutyData';
import { useDutyEmployees } from '@/hooks/duty/useDutyEmployees';
import { useTranslation } from '@/context/TranslationContext';
import EmployeeContactActions from '@/components/Shared/EmployeeContactActions';

const dutyLabelKey = (type: string) => (type === 'skadeleder_vagt' ? 'ui.dutyLeader' : 'ui.drivingDuty');

const TodayGuardsWidget: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const dateLocale = useDateLocale();
  const [open, setOpen] = useState(false);
  const now = useMemo(() => new Date(), []);
  const todayStr = format(now, 'yyyy-MM-dd');
  const weekStart = useMemo(() => startOfWeek(now, { weekStartsOn: 1 }), [now]);
  const weekEnd = useMemo(() => endOfWeek(now, { weekStartsOn: 1 }), [now]);
  const { duties } = useDutyData(weekStart, weekEnd);
  const { employees } = useDutyEmployees();

  const resolve = (d: any) => {
    const emp = employees.find(e => e.id === d.employee_id);
    const external = d.notes?.startsWith('EKSTERN:')
      ? d.notes.split('\n')[0].replace('EKSTERN: ', '')
      : undefined;
    return {
      id: d.id,
      date: d.duty_date as string,
      type: t(dutyLabelKey(d.duty_type)),
      name: d.employee?.name || emp?.name || external || t('ui.unknown'),
      phone: (d.employee?.phone || emp?.phone) as string | undefined,
    };
  };

  const todayDuties = useMemo(
    () => duties.filter(d => d.duty_date === todayStr).map(resolve),
    [duties, employees, todayStr, t]
  );

  const restOfWeek = useMemo(() => {
    const items = duties
      .filter(d => d.duty_date > todayStr)
      .sort((a, b) => a.duty_date.localeCompare(b.duty_date))
      .map(resolve);
    const groups: { date: string; items: ReturnType<typeof resolve>[] }[] = [];
    items.forEach(i => {
      const g = groups.find(x => x.date === i.date);
      if (g) g.items.push(i);
      else groups.push({ date: i.date, items: [i] });
    });
    return groups;
  }, [duties, employees, todayStr, t]);

  return (
    <Card>
      <CardHeader className="brand-card-header flex flex-row items-center justify-between py-2">
        <CardTitle className="text-sm font-semibold brand-dot">{t('ui.dutiesToday')}</CardTitle>
        <Shield className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-1 py-2">
        {todayDuties.length === 0 ? (
          <p className="py-1 text-xs text-muted-foreground">{t('ui.noDutiesToday')}</p>
        ) : (
          todayDuties.map(d => (
            <div key={d.id} className="flex items-center justify-between gap-2 py-0.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-tight text-foreground">{d.name}</p>
                <p className="truncate text-[11px] leading-tight text-muted-foreground">{d.type}</p>
              </div>
              <EmployeeContactActions phone={d.phone} name={d.name} size="sm" />
            </div>
          ))
        )}

        <Collapsible open={open} onOpenChange={setOpen}>
          <CollapsibleContent className="space-y-1 border-t border-border/40 pt-1">
            {restOfWeek.length === 0 ? (
              <p className="py-1 text-xs text-muted-foreground">{t('ui.noMoreDutiesThisWeek')}</p>
            ) : (
              restOfWeek.map(group => (
                <div key={group.date}>
                  <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {format(new Date(group.date + 'T00:00:00'), 'EEE d/M', { locale: dateLocale })}
                  </p>
                  {group.items.map(i => (
                    <div key={i.id} className="flex items-center justify-between gap-2">
                      <p className="min-w-0 truncate text-xs">
                        <span className="font-medium text-foreground">{i.name}</span>
                        <span className="text-muted-foreground"> · {i.type}</span>
                      </p>
                      <EmployeeContactActions phone={i.phone} name={i.name} size="sm" />
                    </div>
                  ))}
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>

        <div className="flex items-center justify-between border-t border-border/40 pt-1">
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {open ? t('ui.hideWeek') : t('ui.showWholeWeek')}
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => navigate('/duty')}
            className="text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t('ui.openDutyPlan')}
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TodayGuardsWidget;
