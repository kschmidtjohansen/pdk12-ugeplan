import React, { useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useTranslation } from '@/context/TranslationContext';
import { Phone, CalendarClock } from 'lucide-react';
import type { Duty } from '@/types/duty';
import type { Employee } from '@/types/employee';

interface TodayDutyCardProps {
  duties: Duty[];
  employees: Employee[];
  /** yyyy-MM-dd for today */
  todayStr: string;
}

const externalName = (notes?: string | null): string | null => {
  if (!notes?.startsWith('EKSTERN:')) return null;
  return notes.split('\n')[0].replace('EKSTERN: ', '').replace(/\s*\[.*?\]\s*/, '').trim();
};

/**
 * Compact overview of who is on duty today, with directly callable phone
 * numbers so nobody has to dig through the plan.
 */
const TodayDutyCard: React.FC<TodayDutyCardProps> = ({ duties, employees, todayStr }) => {
  const { t } = useTranslation();

  const phoneById = useMemo(() => {
    const map = new Map<string, string>();
    employees.forEach((e) => {
      if (e.phone) map.set(e.id, e.phone);
    });
    return map;
  }, [employees]);

  const todayDuties = useMemo(
    () => duties.filter((d) => d.duty_date === todayStr),
    [duties, todayStr]
  );

  return (
    <Card className="rounded-xl border-border/60 shadow-none p-4">
      <div className="flex items-center gap-2 mb-3">
        <CalendarClock className="h-4 w-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold text-foreground">{t('duty.todayDuties')}</h2>
      </div>

      {todayDuties.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('duty.noDutyToday')}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {todayDuties.map((duty) => {
            const ext = externalName(duty.notes);
            const name = ext || duty.employee?.name || t('duty.unassignedSlot');
            const phone = duty.employee_id ? phoneById.get(duty.employee_id) : undefined;
            return (
              <li
                key={duty.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border/60 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{name}</p>
                  <div className="mt-0.5 flex items-center gap-2">
                    <Badge variant="secondary" className="text-[11px] font-normal">
                      {t(`duty.${duty.duty_type === 'kørevagt' ? 'kørevagt' : 'skadelederVagt'}`)}
                    </Badge>
                    {phone ? (
                      <span className="text-xs text-muted-foreground truncate">{phone}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{t('duty.noPhone')}</span>
                    )}
                  </div>
                </div>
                {phone && (
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="touch-target shrink-0"
                    aria-label={`${t('duty.call')} ${name}`}
                  >
                    <a href={`tel:${phone.replace(/\s/g, '')}`}>
                      <Phone className="h-4 w-4 sm:mr-1" />
                      <span className="hidden sm:inline">{t('duty.call')}</span>
                    </a>
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
};

export default React.memo(TodayDutyCard);
